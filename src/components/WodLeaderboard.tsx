import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  Bell,
  BellOff,
  BellRing,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  LogIn,
  Trash2,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStreak } from '../contexts/StreakContext';
import { OperationType, db, handleFirestoreError } from '../services/firebase';
import {
  WorkoutReminderRecord,
  cancelWorkoutReminder,
  getTomorrowDateString,
  loadWorkoutReminder,
  requestPushReminderToken,
  saveWorkoutReminder,
  sendTestWorkoutNotification,
  subscribeForegroundMessages,
} from '../services/messaging';

export type ScoreCategory = 'RX' | 'Scaled';
export type ScoreType = 'Tempo' | 'Reps';

export interface ActiveWodSummary {
  id: string;
  date: string;
  title: string;
  modality: string;
  workout: string;
}

interface ScoreDoc {
  id: string;
  wodDate: string;
  wodTitle: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  category: ScoreCategory;
  scoreType: ScoreType;
  resultDisplay: string;
  numericValue: number;
  sessionLabel: string;
  cleanNotes: string;
  updatedAtLabel: string;
}

interface WodLeaderboardProps {
  selectedDate: string;
  currentWod: ActiveWodSummary | null;
}

const BOX_SESSIONS = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  'Sábado 08:30',
  'Open Box',
];

function formatDatePtBr(dateStr: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return dateStr;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function parseTimeToSeconds(input: string): number | null {
  const cleaned = input.trim();
  const mmss = /^(\d{1,3}):([0-5]\d)$/.exec(cleaned);
  if (mmss) {
    return Number(mmss[1]) * 60 + Number(mmss[2]);
  }
  const plainNumber = Number(cleaned.replace(',', '.'));
  if (!Number.isNaN(plainNumber) && plainNumber > 0) {
    return Math.round(plainNumber);
  }
  return null;
}

function parseSessionAndNotes(rawNotes: string): {
  sessionLabel: string;
  cleanNotes: string;
} {
  const trimmed = rawNotes.trim();
  const match = /^\[Sessão:\s*([^\]]+)\]\s*(.*)$/i.exec(trimmed);
  if (match) {
    return {
      sessionLabel: match[1].trim(),
      cleanNotes: match[2].trim(),
    };
  }
  return {
    sessionLabel: '',
    cleanNotes: trimmed,
  };
}

function encodeSessionAndNotes(
  sessionLabel: string,
  notes: string
): string {
  const cleanNotes = notes.trim();
  const cleanSession = sessionLabel.trim();
  if (!cleanSession) {
    return cleanNotes.slice(0, 200);
  }
  const prefix = `[Sessão: ${cleanSession}]`;
  const combined = cleanNotes ? `${prefix} ${cleanNotes}` : prefix;
  return combined.slice(0, 200);
}

function formatFirestoreTimestamp(value: unknown): string {
  if (value instanceof Timestamp) {
    const dt = value.toDate();
    return dt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    const dt = (value as { toDate: () => Date }).toDate();
    return dt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return '';
}

function AthleteAvatar({
  photoURL,
  name,
}: {
  photoURL?: string;
  name: string;
}) {
  const [imgError, setImgError] = useState(false);
  const initial = (name.trim().charAt(0) || 'A').toUpperCase();

  if (!photoURL || imgError) {
    return (
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#149CEA]/40 bg-[#149CEA]/15 text-xs font-bold text-[#29A8F5]"
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={photoURL}
      alt={`Foto de ${name}`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className="h-10 w-10 shrink-0 rounded-full border border-white/15 object-cover"
    />
  );
}

export function WodLeaderboard({
  selectedDate,
  currentWod,
}: WodLeaderboardProps) {
  const { user, userProfile, authReady, authBusy, signInWithGoogle } =
    useAuth();
  const { markActiveDate } = useStreak();

  const isCoach = userProfile?.role === 'coach';

  const [scores, setScores] = useState<ScoreDoc[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [scoresError, setScoresError] = useState<string | null>(null);

  // Filtros do Placar
  const [categoryFilter, setCategoryFilter] = useState<'Todos' | ScoreCategory>(
    'Todos'
  );
  const [sessionFilter, setSessionFilter] = useState<string>('Todas');

  // Formulário do Atleta
  const [scoreWodName, setScoreWodName] = useState('');
  const [scoreSession, setScoreSession] = useState('19:00');
  const [scoreCategory, setScoreCategory] = useState<ScoreCategory>('RX');
  const [scoreType, setScoreType] = useState<ScoreType>('Tempo');
  const [scoreResult, setScoreResult] = useState('');
  const [scoreNotes, setScoreNotes] = useState('');
  const [scoreSaving, setScoreSaving] = useState(false);
  const [scoreFeedback, setScoreFeedback] = useState<string | null>(null);

  // Estado do Lembrete Push (Firebase Cloud Messaging) para o dia seguinte
  const [wantNextDayReminder, setWantNextDayReminder] = useState(false);
  const [nextDayTrainingTime, setNextDayTrainingTime] = useState('19:00');
  const [activeReminder, setActiveReminder] =
    useState<WorkoutReminderRecord | null>(null);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);
  const [foregroundPushNotice, setForegroundPushNotice] = useState<{
    title: string;
    body: string;
  } | null>(null);

  const tomorrowDate = useMemo(
    () => getTomorrowDateString(selectedDate),
    [selectedDate]
  );

  const defaultWodTitle = currentWod
    ? `${currentWod.title} (${currentWod.modality})`
    : `Treino do Dia ${formatDatePtBr(selectedDate)}`;

  // Carrega lembrete salvo do aluno e escuta notificações push em primeiro plano (FCM)
  useEffect(() => {
    if (!authReady || !user) {
      setActiveReminder(null);
      setReminderFeedback(null);
      return;
    }

    let mounted = true;
    void loadWorkoutReminder(user.uid).then((saved) => {
      if (!mounted || !saved) return;
      setActiveReminder(saved);
      if (saved.trainingTime) {
        setNextDayTrainingTime(saved.trainingTime);
      }
      if (saved.enabled) {
        setWantNextDayReminder(true);
      }
    });

    let unsubFcm: (() => void) | undefined;
    void subscribeForegroundMessages((payload) => {
      const title =
        payload.notification?.title || 'Crossfit Ebber · Lembrete de Treino';
      const body =
        payload.notification?.body ||
        'Hora de se preparar para o treino de hoje no box!';
      setForegroundPushNotice({ title, body });
    }).then((unsub) => {
      if (!mounted) {
        unsub();
      } else {
        unsubFcm = unsub;
      }
    });

    return () => {
      mounted = false;
      if (unsubFcm) unsubFcm();
    };
  }, [authReady, user]);

  // Limpa feedbacks e restaura filtros ao trocar a data selecionada
  useEffect(() => {
    setScoreFeedback(null);
    setSessionFilter('Todas');
    setCategoryFilter('Todos');
  }, [selectedDate]);

  // Listener autenticado em tempo real da coleção 'scores' filtrada pela data selecionada
  useEffect(() => {
    if (!authReady || !user) {
      setScores([]);
      setScoresLoading(false);
      setScoresError(null);
      return;
    }

    setScoresLoading(true);
    setScoresError(null);

    const scoresQuery = query(
      collection(db, 'scores'),
      where('wodDate', '==', selectedDate)
    );

    const unsubscribe = onSnapshot(
      scoresQuery,
      (snapshot) => {
        const loaded: ScoreDoc[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const parsedNotes = parseSessionAndNotes(String(d.notes || ''));
          return {
            id: docSnap.id,
            wodDate: String(d.wodDate || selectedDate),
            wodTitle: String(
              d.wodTitle || `Treino do Dia ${formatDatePtBr(selectedDate)}`
            ),
            userId: String(d.userId || ''),
            userName: String(d.userName || 'Atleta Ebber'),
            userPhotoURL: String(d.userPhotoURL || ''),
            category: d.category === 'Scaled' ? 'Scaled' : 'RX',
            scoreType: d.scoreType === 'Reps' ? 'Reps' : 'Tempo',
            resultDisplay: String(d.resultDisplay || ''),
            numericValue: Number(d.numericValue || 0),
            sessionLabel: parsedNotes.sessionLabel,
            cleanNotes: parsedNotes.cleanNotes,
            updatedAtLabel: formatFirestoreTimestamp(d.updatedAt),
          };
        });

        setScores(loaded);
        setScoresLoading(false);

        const own = loaded.find((item) => item.userId === user.uid);
        if (own) {
          setScoreWodName(own.wodTitle);
          setScoreSession(own.sessionLabel || '19:00');
          setScoreCategory(own.category);
          setScoreType(own.scoreType);
          setScoreResult(
            own.scoreType === 'Reps'
              ? own.resultDisplay.replace(/\s*reps$/i, '').trim()
              : own.resultDisplay
          );
          setScoreNotes(own.cleanNotes);
        } else {
          setScoreWodName(defaultWodTitle);
          setScoreResult('');
          setScoreNotes('');
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'scores');
        } catch {
          setScoresError(
            'Não foi possível carregar o placar agora. Confira as regras do Firestore.'
          );
          setScoresLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [authReady, user, selectedDate, defaultWodTitle]);

  const myCurrentScore = useMemo(
    () => (user ? scores.find((s) => s.userId === user.uid) ?? null : null),
    [scores, user]
  );

  // Sessões presentes no dia para filtro rápido
  const availableSessions = useMemo(() => {
    const set = new Set<string>();
    for (const s of scores) {
      if (s.sessionLabel) set.add(s.sessionLabel);
    }
    return Array.from(set).sort();
  }, [scores]);

  // Ordenação do Leaderboard: RX antes de Scaled; Tempo crescente; Reps decrescente
  const sortedScores = useMemo(() => {
    const filtered = scores.filter((s) => {
      const matchesCategory =
        categoryFilter === 'Todos' || s.category === categoryFilter;
      const matchesSession =
        sessionFilter === 'Todas' || s.sessionLabel === sessionFilter;
      return matchesCategory && matchesSession;
    });

    return [...filtered].sort((a, b) => {
      if (a.category !== b.category) {
        return a.category === 'RX' ? -1 : 1;
      }
      if (a.scoreType === b.scoreType) {
        return a.scoreType === 'Tempo'
          ? a.numericValue - b.numericValue
          : b.numericValue - a.numericValue;
      }
      return a.userName.localeCompare(b.userName);
    });
  }, [scores, categoryFilter, sessionFilter]);

  const statsSummary = useMemo(() => {
    const rxScores = scores.filter((s) => s.category === 'RX');
    const scaledScores = scores.filter((s) => s.category === 'Scaled');
    return {
      total: scores.length,
      rxCount: rxScores.length,
      scaledCount: scaledScores.length,
    };
  }, [scores]);

  const handleSaveScore = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const rawResult = scoreResult.trim();
    if (!rawResult) {
      setScoreFeedback('Digite seu tempo (ex: 12:45) ou total de reps.');
      return;
    }

    let numericValue = 0;
    let formattedDisplay = rawResult;

    if (scoreType === 'Tempo') {
      const parsed = parseTimeToSeconds(rawResult);
      if (parsed === null || parsed <= 0 || parsed > 100000) {
        setScoreFeedback(
          'Formato de tempo inválido. Use MM:SS (ex: 14:32) ou segundos.'
        );
        return;
      }
      numericValue = parsed;
      const mins = Math.floor(parsed / 60);
      const secs = String(parsed % 60).padStart(2, '0');
      formattedDisplay = `${mins}:${secs}`;
    } else {
      const normalizedReps = rawResult.replace(',', '.').trim();
      const repsParsed = /^\d+(\.\d+)?$/.test(normalizedReps)
        ? Number(normalizedReps)
        : Number.NaN;
      if (
        Number.isNaN(repsParsed) ||
        repsParsed <= 0 ||
        repsParsed > 100000
      ) {
        setScoreFeedback('Informe uma quantidade válida de repetições (ex: 185).');
        return;
      }
      numericValue = repsParsed;
      formattedDisplay = `${repsParsed} reps`;
    }

    setScoreSaving(true);
    setScoreFeedback(null);

    const scoreId = `${selectedDate}_${user.uid}`;
    const scoreRef = doc(db, 'scores', scoreId);
    const scorePath = `scores/${scoreId}`;

    const athleteName = (
      userProfile?.name ||
      user.displayName ||
      'Atleta Ebber'
    ).slice(0, 100);
    const athletePhoto = (userProfile?.photoURL || user.photoURL || '').slice(
      0,
      500
    );
    const resolvedWodTitle = (
      currentWod
        ? `${currentWod.title} (${currentWod.modality})`
        : scoreWodName.trim() || defaultWodTitle
    ).slice(0, 100);

    const encodedNotes = encodeSessionAndNotes(scoreSession, scoreNotes);

    try {
      if (myCurrentScore) {
        await updateDoc(scoreRef, {
          wodTitle: resolvedWodTitle,
          userName: athleteName,
          userPhotoURL: athletePhoto,
          category: scoreCategory,
          scoreType,
          resultDisplay: formattedDisplay.slice(0, 40),
          numericValue,
          notes: encodedNotes,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(scoreRef, {
          wodDate: selectedDate,
          wodTitle: resolvedWodTitle,
          userId: user.uid,
          userName: athleteName,
          userPhotoURL: athletePhoto,
          category: scoreCategory,
          scoreType,
          resultDisplay: formattedDisplay.slice(0, 40),
          numericValue,
          notes: encodedNotes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      markActiveDate(selectedDate, 'workout');
      setScoreFeedback('Resultado atualizado com sucesso no placar e foguinho reforçado!');

      if (wantNextDayReminder) {
        await handleActivateNextDayReminder(resolvedWodTitle);
      }
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, scorePath);
      } catch {
        setScoreFeedback(
          'Não foi possível salvar seu resultado. Verifique sua conexão e tente novamente.'
        );
      }
    } finally {
      setScoreSaving(false);
    }
  };

  const handleActivateNextDayReminder = async (wodRefOverride?: string) => {
    if (!user) return;
    setReminderBusy(true);
    setReminderFeedback(null);

    try {
      const tokenResult = await requestPushReminderToken();
      const athleteName =
        userProfile?.name || user.displayName || 'Atleta Ebber';
      const saved = await saveWorkoutReminder(user, {
        userName: athleteName,
        targetDate: tomorrowDate,
        trainingTime: nextDayTrainingTime,
        fcmToken: tokenResult.token,
        wodReference: wodRefOverride || defaultWodTitle,
      });
      setActiveReminder(saved);

      if (tokenResult.status === 'fcm-active') {
        setReminderFeedback(
          `Lembrete Push (FCM) agendado para amanhã (${formatDatePtBr(tomorrowDate)}) às ${nextDayTrainingTime}!`
        );
      } else {
        setReminderFeedback(
          `${tokenResult.message} Horário (${nextDayTrainingTime} em ${formatDatePtBr(tomorrowDate)}) salvo na sua conta.`
        );
      }
    } finally {
      setReminderBusy(false);
    }
  };

  const handleCancelReminder = async () => {
    if (!user) return;
    setReminderBusy(true);
    try {
      const updated = await cancelWorkoutReminder(user);
      setActiveReminder(updated);
      setWantNextDayReminder(false);
      setReminderFeedback('Lembrete de treino cancelado.');
    } finally {
      setReminderBusy(false);
    }
  };

  const handleTestNotification = async () => {
    const sent = await sendTestWorkoutNotification(
      nextDayTrainingTime,
      formatDatePtBr(tomorrowDate)
    );
    setReminderFeedback(
      sent
        ? 'Notificação de teste disparada no seu dispositivo!'
        : 'Conceda permissão de notificação acima primeiro para testar.'
    );
  };

  const handleDeleteScore = async (scoreId: string) => {
    if (!user) return;
    const scorePath = `scores/${scoreId}`;
    try {
      await deleteDoc(doc(db, 'scores', scoreId));
      setScoreFeedback('Resultado removido do placar.');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, scorePath);
      } catch {
        setScoreFeedback('Não foi possível remover o resultado.');
      }
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0F1318] p-6">
      {/* Cabeçalho do Placar com Resumo do Treino e Sessões */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#149CEA]/40 bg-[#149CEA]/10 text-[#29A8F5]">
            <Trophy className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3
              id="ranking-heading"
              className="font-display text-xl font-bold uppercase tracking-wide text-white"
            >
              Placar / Leaderboard do Dia
            </h3>
            <p className="text-xs text-[#9AA3AF] tabular-nums">
              {defaultWodTitle} · {formatDatePtBr(selectedDate)}
            </p>
          </div>
        </div>

        {/* Filtro RX / Scaled */}
        <div
          role="group"
          aria-label="Filtrar placar por categoria"
          className="inline-flex rounded-md border border-white/15 bg-[#080A0C] p-0.5 self-start sm:self-auto"
        >
          {(['Todos', 'RX', 'Scaled'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#0C7EC8] text-white'
                  : 'text-[#B4BCC6] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {!user ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-[#080A0C] p-6 text-center sm:p-8">
          <UserCheck
            className="mx-auto h-8 w-8 text-[#29A8F5]"
            aria-hidden="true"
          />
          <h4
            id="login-prompt-ranking-title"
            className="mt-3 font-display text-lg font-bold uppercase tracking-wide text-white"
          >
            Entre com Google para ver e registrar seu resultado
          </h4>
          <p
            id="login-prompt-ranking-desc"
            className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#B4BCC6] sm:text-sm"
          >
            O placar diário por turma, categoria (RX ou Scaled) e tempo/reps é
            exclusivo para alunos autenticados da Crossfit Ebber.
          </p>
          <button
            type="button"
            disabled={authBusy}
            onClick={() => void signInWithGoogle()}
            aria-labelledby="login-prompt-ranking-title"
            aria-describedby="login-prompt-ranking-desc"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-[#0C7EC8] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA] disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span>{authBusy ? 'Conectando...' : 'Entrar com Google'}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Painel Resumo do Dia */}
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-[#080A0C] p-3.5 sm:grid-cols-3">
            <div className="flex items-center gap-2.5">
              <Flame
                className="h-4 w-4 shrink-0 text-[#29A8F5]"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA3AF]">
                  Treino / WOD
                </p>
                <p className="truncate text-xs font-semibold text-white">
                  {currentWod
                    ? `${currentWod.title} · ${currentWod.modality}`
                    : `Treino de ${formatDatePtBr(selectedDate)}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Users
                className="h-4 w-4 shrink-0 text-[#29A8F5]"
                aria-hidden="true"
              />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA3AF]">
                  Participantes Hoje
                </p>
                <p className="text-xs font-semibold text-white tabular-nums">
                  {statsSummary.total}{' '}
                  {statsSummary.total === 1 ? 'atleta' : 'atletas'} (
                  {statsSummary.rxCount} RX · {statsSummary.scaledCount} Scaled)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock
                className="h-4 w-4 shrink-0 text-[#29A8F5]"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="leaderboard-session-filter"
                  className="block text-[10px] font-bold uppercase tracking-wider text-[#9AA3AF]"
                >
                  Filtrar por Sessão / Turma
                </label>
                <select
                  id="leaderboard-session-filter"
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                  className="mt-0.5 w-full rounded border border-white/15 bg-[#0F1318] px-2 py-1 text-xs font-medium text-white focus:border-[#149CEA] focus:outline-none"
                >
                  <option value="Todas">Todas as sessões</option>
                  {availableSessions.map((sess) => (
                    <option key={sess} value={sess}>
                      Turma {sess}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Formulário Completo: Atualizar / Registrar Meu Resultado no Placar */}
          <form
            onSubmit={handleSaveScore}
            aria-labelledby="score-form-title"
            aria-describedby="score-form-desc"
            className="mt-4 rounded-lg border border-white/10 bg-[#080A0C] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h4
                  id="score-form-title"
                  className="text-xs font-bold uppercase tracking-wider text-white"
                >
                  {myCurrentScore
                    ? 'Atualizar Meu Resultado no Placar'
                    : 'Registrar Meu Resultado no Placar'}
                </h4>
                <p id="score-form-desc" className="mt-0.5 text-[11px] text-[#9AA3AF]">
                  Informe a sessão/turma, categoria (RX/Scaled), tipo de placar e
                  seu resultado final.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-[#29A8F5]">
                  Atleta: {userProfile?.name || user.displayName}
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
              {!currentWod && (
                <div className="sm:col-span-6">
                  <label
                    htmlFor="score-wod-name"
                    className="block text-[11px] font-medium text-[#B4BCC6]"
                  >
                    Nome do Treino / WOD
                  </label>
                  <input
                    id="score-wod-name"
                    type="text"
                    maxLength={100}
                    placeholder="Ex: Fran, Murph ou Força + Metcon"
                    value={scoreWodName}
                    onChange={(e) => setScoreWodName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-white/15 bg-[#0F1318] px-2.5 py-2 text-sm text-white placeholder-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                  />
                </div>
              )}

              <div className={currentWod ? 'sm:col-span-3' : 'sm:col-span-6'}>
                <label
                  htmlFor="score-session"
                  className="block text-[11px] font-medium text-[#B4BCC6]"
                >
                  Sessão / Turma
                </label>
                <select
                  id="score-session"
                  value={scoreSession}
                  onChange={(e) => setScoreSession(e.target.value)}
                  className="mt-1 w-full rounded-md border border-white/15 bg-[#0F1318] px-2.5 py-2 text-sm text-white focus:border-[#149CEA] focus:outline-none"
                >
                  {BOX_SESSIONS.map((sess) => (
                    <option key={sess} value={sess}>
                      {sess.includes(':') ? `Turma ${sess}` : sess}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="score-category"
                  className="block text-[11px] font-medium text-[#B4BCC6]"
                >
                  Categoria
                </label>
                <select
                  id="score-category"
                  value={scoreCategory}
                  onChange={(e) =>
                    setScoreCategory(e.target.value as ScoreCategory)
                  }
                  className="mt-1 w-full rounded-md border border-white/15 bg-[#0F1318] px-2.5 py-2 text-sm text-white focus:border-[#149CEA] focus:outline-none"
                >
                  <option value="RX">RX</option>
                  <option value="Scaled">Scaled</option>
                </select>
              </div>

              <div className={currentWod ? 'sm:col-span-3' : 'sm:col-span-4'}>
                <label
                  htmlFor="score-type"
                  className="block text-[11px] font-medium text-[#B4BCC6]"
                >
                  Tipo de Placar
                </label>
                <select
                  id="score-type"
                  value={scoreType}
                  onChange={(e) => setScoreType(e.target.value as ScoreType)}
                  className="mt-1 w-full rounded-md border border-white/15 bg-[#0F1318] px-2.5 py-2 text-sm text-white focus:border-[#149CEA] focus:outline-none"
                >
                  <option value="Tempo">Tempo (MM:SS)</option>
                  <option value="Reps">Reps / Rounds</option>
                </select>
              </div>

              <div className={currentWod ? 'sm:col-span-3' : 'sm:col-span-5'}>
                <label
                  htmlFor="score-result"
                  className="block text-[11px] font-medium text-[#B4BCC6]"
                >
                  {scoreType === 'Tempo' ? 'Tempo (MM:SS)' : 'Total de Reps'}
                </label>
                <input
                  id="score-result"
                  type="text"
                  required
                  maxLength={40}
                  placeholder={scoreType === 'Tempo' ? '14:20' : '185'}
                  value={scoreResult}
                  onChange={(e) => setScoreResult(e.target.value)}
                  className="mt-1 w-full rounded-md border border-white/15 bg-[#0F1318] px-2.5 py-2 text-sm text-white tabular-nums placeholder-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                />
              </div>

              {!currentWod && (
                <div className="sm:col-span-3 flex items-end">
                  <button
                    type="submit"
                    disabled={scoreSaving}
                    aria-describedby="score-form-title score-form-desc"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#0C7EC8] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA] disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {scoreSaving
                        ? 'Salvando...'
                        : myCurrentScore
                          ? 'Atualizar'
                          : 'Publicar'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className={currentWod ? 'sm:col-span-9' : 'sm:col-span-12'}>
                <label
                  htmlFor="score-notes"
                  className="block text-[11px] font-medium text-[#B4BCC6]"
                >
                  Observação / Carga utilizada (opcional)
                </label>
                <input
                  id="score-notes"
                  type="text"
                  maxLength={175}
                  placeholder="Ex: Thruster 35kg / Pull-up com elástico"
                  value={scoreNotes}
                  onChange={(e) => setScoreNotes(e.target.value)}
                  className="mt-1 w-full rounded-md border border-white/15 bg-[#0F1318] px-3 py-2 text-xs text-white placeholder-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                />
              </div>

              {currentWod && (
                <div className="sm:col-span-3 flex items-end">
                  <button
                    type="submit"
                    disabled={scoreSaving}
                    aria-describedby="score-form-title score-form-desc"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#0C7EC8] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA] disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {scoreSaving
                        ? 'Salvando...'
                        : myCurrentScore
                          ? 'Atualizar'
                          : 'Publicar'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Solicitação opcional de lembrete push (FCM) integrada ao envio do WOD */}
            <div className="mt-3 rounded-md border border-white/10 bg-[#0F1318] p-3">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <label
                  htmlFor="score-reminder-checkbox"
                  className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#E5E7EB]"
                >
                  <input
                    id="score-reminder-checkbox"
                    type="checkbox"
                    checked={wantNextDayReminder}
                    onChange={(e) => setWantNextDayReminder(e.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-[#080A0C] accent-[#149CEA]"
                  />
                  <Bell
                    className="h-3.5 w-3.5 text-[#29A8F5]"
                    aria-hidden="true"
                  />
                  <span>
                    Solicitar lembrete push (FCM) para o treino de amanhã (
                    {formatDatePtBr(tomorrowDate)})
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="score-reminder-time"
                    className="text-[11px] font-medium text-[#9AA3AF]"
                  >
                    Horário:
                  </label>
                  <select
                    id="score-reminder-time"
                    value={nextDayTrainingTime}
                    onChange={(e) => setNextDayTrainingTime(e.target.value)}
                    className="rounded border border-white/15 bg-[#080A0C] px-2 py-1 text-xs font-semibold text-white tabular-nums focus:border-[#149CEA] focus:outline-none"
                  >
                    {BOX_SESSIONS.map((sess) => (
                      <option key={sess} value={sess}>
                        {sess.includes(':') ? `Turma ${sess}` : sess}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {scoreFeedback && (
              <p
                role="status"
                className="mt-2.5 text-xs font-medium text-[#29A8F5]"
              >
                {scoreFeedback}
              </p>
            )}
          </form>

          {/* Painel Dedicado de Lembrete Push via Firebase Cloud Messaging (FCM) */}
          <div
            aria-labelledby="fcm-reminder-heading"
            className="mt-4 rounded-lg border border-[#149CEA]/30 bg-[#080A0C] p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#149CEA]/40 bg-[#149CEA]/10 text-[#29A8F5]">
                  {activeReminder?.enabled ? (
                    <BellRing className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Bell className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <h4
                    id="fcm-reminder-heading"
                    className="text-xs font-bold uppercase tracking-wider text-white"
                  >
                    Lembrete Push do Próximo Treino (FCM)
                  </h4>
                  <p className="mt-0.5 text-xs text-[#B4BCC6]">
                    {activeReminder?.enabled ? (
                      <span>
                        Agendado para{' '}
                        <strong className="text-[#29A8F5] tabular-nums">
                          {formatDatePtBr(activeReminder.targetDate)} às{' '}
                          {activeReminder.trainingTime}
                        </strong>
                        {activeReminder.fcmToken
                          ? ' · Token Web Push FCM ativo'
                          : ' · Preferência salva no perfil'}
                      </span>
                    ) : (
                      <span>
                        Receba uma notificação push para não perder o horário de
                        amanhã ({formatDatePtBr(tomorrowDate)}).
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={reminderBusy}
                  onClick={() => void handleActivateNextDayReminder()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#0C7EC8] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA] disabled:opacity-60"
                >
                  <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {reminderBusy
                      ? 'Ativando...'
                      : activeReminder?.enabled
                        ? 'Atualizar Horário'
                        : 'Ativar Lembrete Push'}
                  </span>
                </button>

                {typeof Notification !== 'undefined' &&
                  Notification.permission === 'granted' && (
                    <button
                      type="button"
                      onClick={() => void handleTestNotification()}
                      className="rounded-md border border-white/15 bg-[#0F1318] px-3 py-1.5 text-xs font-semibold text-[#D1D5DB] transition-colors hover:border-[#149CEA] hover:text-white"
                    >
                      Testar Aviso
                    </button>
                  )}

                {activeReminder?.enabled && (
                  <button
                    type="button"
                    disabled={reminderBusy}
                    onClick={() => void handleCancelReminder()}
                    aria-label="Cancelar lembrete push de amanhã"
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-[#9AA3AF] transition-colors hover:border-red-400/50 hover:text-red-300"
                  >
                    <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Cancelar</span>
                  </button>
                )}
              </div>
            </div>

            {reminderFeedback && (
              <p
                role="status"
                className="mt-2.5 text-xs font-medium text-[#29A8F5]"
              >
                {reminderFeedback}
              </p>
            )}

            {foregroundPushNotice && (
              <div
                role="alert"
                className="mt-2.5 flex items-center justify-between gap-3 rounded border border-[#149CEA]/40 bg-[#149CEA]/10 px-3 py-2 text-xs text-white"
              >
                <span>
                  <strong>{foregroundPushNotice.title}:</strong>{' '}
                  {foregroundPushNotice.body}
                </span>
                <button
                  type="button"
                  onClick={() => setForegroundPushNotice(null)}
                  className="font-bold underline"
                >
                  Ok
                </button>
              </div>
            )}
          </div>

          {scoresError && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200"
            >
              {scoresError}
            </p>
          )}

          {/* Lista Ordenada Completa do Leaderboard */}
          <div className="mt-5">
            {scoresLoading ? (
              <div className="space-y-2">
                <div className="h-16 w-full animate-pulse rounded-lg bg-white/5" />
                <div className="h-16 w-full animate-pulse rounded-lg bg-white/5" />
              </div>
            ) : sortedScores.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 bg-[#080A0C] p-6 text-center">
                <p className="text-sm font-medium text-white">
                  {scores.length > 0
                    ? 'Nenhum resultado encontrado para o filtro selecionado.'
                    : 'Nenhum resultado lançado neste dia ainda.'}
                </p>
                <p className="mt-1 text-xs text-[#9AA3AF]">
                  {scores.length > 0
                    ? 'Altere a categoria ou a turma filtrada para visualizar os outros placares.'
                    : `Seja o primeiro atleta a registrar o treino de ${formatDatePtBr(selectedDate)}!`}
                </p>
                {scores.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('Todos');
                      setSessionFilter('Todas');
                    }}
                    className="mt-3 rounded-md border border-[#149CEA]/40 bg-[#149CEA]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#29A8F5] hover:bg-[#149CEA]/20"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <ul
                aria-labelledby="ranking-heading"
                className="divide-y divide-white/10 rounded-lg border border-white/10 bg-[#080A0C]"
              >
                {sortedScores.map((item, idx) => {
                  const isMine = item.userId === user.uid;
                  return (
                    <li
                      key={item.id}
                      className={`flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${
                        isMine ? 'bg-[#149CEA]/10' : ''
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-3 sm:items-center">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded font-display text-sm font-extrabold tabular-nums ${
                            idx === 0
                              ? 'bg-[#149CEA] text-white'
                              : idx === 1
                                ? 'border border-white/25 bg-white/10 text-white'
                                : 'border border-white/10 bg-[#0F1318] text-[#B4BCC6]'
                          }`}
                        >
                          {idx + 1}º
                        </span>

                        <AthleteAvatar
                          photoURL={item.userPhotoURL}
                          name={item.userName}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <p className="truncate text-sm font-semibold text-white">
                              {item.userName}
                            </p>
                            {isMine && (
                              <span className="text-xs font-semibold text-[#29A8F5]">
                                (Você)
                              </span>
                            )}
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#29A8F5]">
                              · {item.category}
                            </span>
                          </div>

                          {/* Informações completas do Treino, Sessão, Tipo e Carga */}
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#9AA3AF]">
                            <span className="inline-flex items-center gap-1 text-[#D1D5DB]">
                              <Dumbbell
                                className="h-3 w-3 text-[#29A8F5]"
                                aria-hidden="true"
                              />
                              <span>{item.wodTitle}</span>
                            </span>

                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Clock
                                className="h-3 w-3 text-[#9AA3AF]"
                                aria-hidden="true"
                              />
                              <span>
                                {item.sessionLabel
                                  ? `Sessão ${item.sessionLabel}`
                                  : `Data ${formatDatePtBr(item.wodDate)}`}
                              </span>
                            </span>

                            <span>
                              Tipo:{' '}
                              <strong className="font-medium text-[#D1D5DB]">
                                {item.scoreType === 'Tempo'
                                  ? 'Tempo (MM:SS)'
                                  : 'Reps / Rounds'}
                              </strong>
                            </span>

                            {item.updatedAtLabel && (
                              <span className="tabular-nums text-[#8B949E]">
                                · Atualizado às {item.updatedAtLabel}
                              </span>
                            )}
                          </div>

                          {item.cleanNotes && (
                            <p className="mt-1 text-xs text-[#B4BCC6]">
                              Carga / Obs.: {item.cleanNotes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 pt-2 sm:justify-end sm:border-t-0 sm:pt-0">
                        <div className="sm:text-right">
                          <p className="font-display text-xl font-extrabold text-white tabular-nums">
                            {item.resultDisplay}
                          </p>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#29A8F5]">
                            {item.scoreType} · {item.category}
                          </p>
                        </div>

                        {(isMine || isCoach) && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteScore(item.id)}
                            aria-label={`Remover resultado de ${item.userName}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/10 text-[#9AA3AF] transition-colors hover:border-red-400/50 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
