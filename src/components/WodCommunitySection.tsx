import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  Award,
  Calendar,
  CheckCircle2,
  ClipboardEdit,
  Dumbbell,
  Flame,
  LogIn,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Trophy,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { OperationType, db, handleFirestoreError } from '../services/firebase';
import { ScrollReveal } from './ScrollReveal';

type WodModality = 'AMRAP' | 'For Time' | 'EMOM' | 'Força + Metcon';
type ScoreCategory = 'RX' | 'Scaled';
type ScoreType = 'Tempo' | 'Reps';

interface WodDoc {
  id: string;
  date: string;
  title: string;
  modality: WodModality;
  warmup: string;
  workout: string;
  coachNotes: string;
  authorUid: string;
  authorName: string;
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
  notes: string;
}

interface PrDoc {
  id: string;
  userId: string;
  movement: string;
  weightKg: number;
  reps: number;
  recordedDate: string;
  notes: string;
}

const WOD_MODALITIES: WodModality[] = [
  'For Time',
  'AMRAP',
  'EMOM',
  'Força + Metcon',
];

const PR_MOVEMENTS = [
  'Snatch',
  'Clean & Jerk',
  'Deadlift',
  'Back Squat',
  'Front Squat',
  'Overhead Squat',
  'Shoulder Press',
  'Thruster',
];

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

function AthleteAvatar({
  photoURL,
  name,
  sizeClass = 'h-9 w-9',
}: {
  photoURL?: string;
  name: string;
  sizeClass?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const initial = (name.trim().charAt(0) || 'A').toUpperCase();

  if (!photoURL || imgError) {
    return (
      <div
        aria-hidden="true"
        className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full border border-[#149CEA]/40 bg-[#149CEA]/15 text-xs font-bold text-[#29A8F5]`}
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
      className={`${sizeClass} shrink-0 rounded-full border border-white/15 object-cover`}
    />
  );
}

export function WodCommunitySection() {
  const { user, userProfile, authReady, authBusy, signInWithGoogle } =
    useAuth();

  const [activeTab, setActiveTab] = useState<'wod' | 'prs'>('wod');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString);

  // Estado do WOD do Dia
  const [recentWods, setRecentWods] = useState<WodDoc[]>([]);
  const [wodLoading, setWodLoading] = useState(true);
  const [wodError, setWodError] = useState<string | null>(null);
  const [coachFormOpen, setCoachFormOpen] = useState(false);
  const [coachSaving, setCoachSaving] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState<string | null>(null);

  const [wodTitle, setWodTitle] = useState('');
  const [wodModality, setWodModality] = useState<WodModality>('For Time');
  const [wodWarmup, setWodWarmup] = useState('');
  const [wodWorkout, setWodWorkout] = useState('');
  const [wodNotes, setWodNotes] = useState('');

  // Estado do Ranking (Scores)
  const [scores, setScores] = useState<ScoreDoc[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [scoresError, setScoresError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'Todos' | ScoreCategory>(
    'Todos'
  );
  const [scoreCategory, setScoreCategory] = useState<ScoreCategory>('RX');
  const [scoreType, setScoreType] = useState<ScoreType>('Tempo');
  const [scoreResult, setScoreResult] = useState('');
  const [scoreNotes, setScoreNotes] = useState('');
  const [scoreSaving, setScoreSaving] = useState(false);
  const [scoreFeedback, setScoreFeedback] = useState<string | null>(null);

  // Estado dos PRs (Personal Records)
  const [prs, setPrs] = useState<PrDoc[]>([]);
  const [prsLoading, setPrsLoading] = useState(false);
  const [prsError, setPrsError] = useState<string | null>(null);
  const [editingPrId, setEditingPrId] = useState<string | null>(null);
  const [prMovement, setPrMovement] = useState<string>('Deadlift');
  const [customMovement, setCustomMovement] = useState<string>('');
  const [prWeight, setPrWeight] = useState<string>('');
  const [prReps, setPrReps] = useState<string>('1');
  const [prDate, setPrDate] = useState<string>(getTodayDateString);
  const [prNotes, setPrNotes] = useState<string>('');
  const [prSaving, setPrSaving] = useState(false);
  const [prFeedback, setPrFeedback] = useState<string | null>(null);
  const [prFilterMovement, setPrFilterMovement] = useState<string>('Todos');

  const currentWod = useMemo(
    () => recentWods.find((w) => w.date === selectedDate) ?? null,
    [recentWods, selectedDate]
  );

  const isCoach = userProfile?.role === 'coach';

  // Sincroniza formulário do coach quando o WOD selecionado muda
  useEffect(() => {
    if (currentWod) {
      setWodTitle(currentWod.title);
      setWodModality(currentWod.modality);
      setWodWarmup(currentWod.warmup);
      setWodWorkout(currentWod.workout);
      setWodNotes(currentWod.coachNotes);
    } else {
      setWodTitle('');
      setWodModality('For Time');
      setWodWarmup('');
      setWodWorkout('');
      setWodNotes('');
    }
    setCoachFeedback(null);
  }, [currentWod, selectedDate]);

  // 1. Listener público para WODs recentes
  useEffect(() => {
    setWodLoading(true);
    setWodError(null);
    let settled = false;

    const loadingTimeout = window.setTimeout(() => {
      if (!settled) {
        setWodLoading(false);
        setWodError(
          'Conexão lenta ou Firestore ainda não inicializado no projeto crossfitebber. Verifique sua internet e se o Firestore Database está criado.'
        );
      }
    }, 6000);

    const wodsQuery = query(
      collection(db, 'wods'),
      orderBy('date', 'desc'),
      limit(14)
    );

    const unsubscribe = onSnapshot(
      wodsQuery,
      (snapshot) => {
        settled = true;
        window.clearTimeout(loadingTimeout);
        const loaded: WodDoc[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            date: String(d.date || docSnap.id),
            title: String(d.title || 'WOD do Dia'),
            modality: WOD_MODALITIES.includes(d.modality as WodModality)
              ? (d.modality as WodModality)
              : 'For Time',
            warmup: String(d.warmup || ''),
            workout: String(d.workout || ''),
            coachNotes: String(d.coachNotes || ''),
            authorUid: String(d.authorUid || ''),
            authorName: String(d.authorName || 'Coach Ebber'),
          };
        });
        setRecentWods(loaded);
        setWodError(null);
        setWodLoading(false);
      },
      (err) => {
        settled = true;
        window.clearTimeout(loadingTimeout);
        try {
          handleFirestoreError(err, OperationType.LIST, 'wods');
        } catch {
          setWodError(
            'Não foi possível carregar o WOD do dia no Firestore. Verifique as regras de segurança publicadas.'
          );
          setWodLoading(false);
        }
      }
    );

    return () => {
      window.clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  // 2. Listener autenticado para Ranking (Scores) da data selecionada
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
          return {
            id: docSnap.id,
            wodDate: String(d.wodDate || selectedDate),
            wodTitle: String(d.wodTitle || ''),
            userId: String(d.userId || ''),
            userName: String(d.userName || 'Atleta'),
            userPhotoURL: String(d.userPhotoURL || ''),
            category: d.category === 'Scaled' ? 'Scaled' : 'RX',
            scoreType: d.scoreType === 'Reps' ? 'Reps' : 'Tempo',
            resultDisplay: String(d.resultDisplay || ''),
            numericValue: Number(d.numericValue || 0),
            notes: String(d.notes || ''),
          };
        });
        setScores(loaded);
        setScoresLoading(false);

        const own = loaded.find((item) => item.userId === user.uid);
        if (own) {
          setScoreCategory(own.category);
          setScoreType(own.scoreType);
          setScoreResult(own.resultDisplay);
          setScoreNotes(own.notes);
        } else {
          setScoreResult('');
          setScoreNotes('');
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'scores');
        } catch {
          setScoresError(
            'Não foi possível carregar o ranking agora. Confira as regras do Firestore.'
          );
          setScoresLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [authReady, user, selectedDate]);

  // 3. Listener autenticado para PRs pessoais do aluno logado
  useEffect(() => {
    if (!authReady || !user) {
      setPrs([]);
      setPrsLoading(false);
      setPrsError(null);
      return;
    }

    setPrsLoading(true);
    setPrsError(null);

    const prsQuery = query(
      collection(db, 'prs'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      prsQuery,
      (snapshot) => {
        const loaded: PrDoc[] = snapshot.docs
          .map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              userId: String(d.userId || user.uid),
              movement: String(d.movement || ''),
              weightKg: Number(d.weightKg || 0),
              reps: Number(d.reps || 1),
              recordedDate: String(d.recordedDate || ''),
              notes: String(d.notes || ''),
            };
          })
          .sort((a, b) => b.recordedDate.localeCompare(a.recordedDate));
        setPrs(loaded);
        setPrsLoading(false);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'prs');
        } catch {
          setPrsError(
            'Não foi possível carregar seus PRs. Confira as permissões do Firestore.'
          );
          setPrsLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [authReady, user]);

  // Ordenação do Ranking: RX primeiro, depois Tempo crescente ou Reps decrescente
  const sortedScores = useMemo(() => {
    const filtered =
      categoryFilter === 'Todos'
        ? scores
        : scores.filter((s) => s.category === categoryFilter);

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
  }, [scores, categoryFilter]);

  const myCurrentScore = useMemo(
    () => (user ? scores.find((s) => s.userId === user.uid) ?? null : null),
    [scores, user]
  );

  // Melhor carga registrada por movimento nos PRs
  const bestPrByMovement = useMemo(() => {
    const map = new Map<string, PrDoc>();
    for (const pr of prs) {
      const prev = map.get(pr.movement);
      if (!prev || pr.weightKg > prev.weightKg) {
        map.set(pr.movement, pr);
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.movement.localeCompare(b.movement)
    );
  }, [prs]);

  const filteredPrs = useMemo(() => {
    if (prFilterMovement === 'Todos') return prs;
    return prs.filter((p) => p.movement === prFilterMovement);
  }, [prs, prFilterMovement]);

  // Salvar / Atualizar WOD (exclusivo Coach)
  const handleSaveWod = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !isCoach) return;

    const titleClean = wodTitle.trim();
    const workoutClean = wodWorkout.trim();
    if (titleClean.length < 2 || workoutClean.length < 5) {
      setCoachFeedback(
        'Informe um título (mín. 2 letras) e a descrição completa do treino (mín. 5 caracteres).'
      );
      return;
    }

    setCoachSaving(true);
    setCoachFeedback(null);
    const wodRef = doc(db, 'wods', selectedDate);
    const wodPath = `wods/${selectedDate}`;

    try {
      if (currentWod) {
        await updateDoc(wodRef, {
          date: selectedDate,
          title: titleClean.slice(0, 100),
          modality: wodModality,
          warmup: wodWarmup.trim().slice(0, 500),
          workout: workoutClean.slice(0, 2000),
          coachNotes: wodNotes.trim().slice(0, 500),
          authorUid: user.uid,
          authorName: (userProfile?.name || 'Coach Ebber').slice(0, 100),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(wodRef, {
          date: selectedDate,
          title: titleClean.slice(0, 100),
          modality: wodModality,
          warmup: wodWarmup.trim().slice(0, 500),
          workout: workoutClean.slice(0, 2000),
          coachNotes: wodNotes.trim().slice(0, 500),
          authorUid: user.uid,
          authorName: (userProfile?.name || 'Coach Ebber').slice(0, 100),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setCoachFeedback('WOD salvo com sucesso no quadro do box!');
      setCoachFormOpen(false);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, wodPath);
      } catch {
        setCoachFeedback(
          'Permissão negada ou falha ao gravar o WOD. Verifique seu perfil de coach nas regras.'
        );
      }
    } finally {
      setCoachSaving(false);
    }
  };

  // Salvar / Atualizar Score no Ranking
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
      const repsParsed = Number(rawResult.replace(/[^\d.]/g, ''));
      if (
        Number.isNaN(repsParsed) ||
        repsParsed <= 0 ||
        repsParsed > 100000
      ) {
        setScoreFeedback('Informe uma quantidade válida de repetições.');
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
    const wodTitleResolved = (
      currentWod?.title || `WOD ${formatDatePtBr(selectedDate)}`
    ).slice(0, 100);

    try {
      if (myCurrentScore) {
        await updateDoc(scoreRef, {
          wodTitle: wodTitleResolved,
          userName: athleteName,
          userPhotoURL: athletePhoto,
          category: scoreCategory,
          scoreType,
          resultDisplay: formattedDisplay.slice(0, 40),
          numericValue,
          notes: scoreNotes.trim().slice(0, 200),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(scoreRef, {
          wodDate: selectedDate,
          wodTitle: wodTitleResolved,
          userId: user.uid,
          userName: athleteName,
          userPhotoURL: athletePhoto,
          category: scoreCategory,
          scoreType,
          resultDisplay: formattedDisplay.slice(0, 40),
          numericValue,
          notes: scoreNotes.trim().slice(0, 200),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setScoreFeedback('Resultado registrado no placar!');
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

  // Salvar / Editar PR
  const handleSavePr = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const resolvedMovement = (
      prMovement === 'Outro' ? customMovement : prMovement
    ).trim();
    const parsedWeight = Number(prWeight.replace(',', '.'));
    const parsedReps = Number.parseInt(prReps, 10);

    if (resolvedMovement.length < 2 || resolvedMovement.length > 60) {
      setPrFeedback('Informe o nome do movimento (entre 2 e 60 caracteres).');
      return;
    }
    if (Number.isNaN(parsedWeight) || parsedWeight <= 0 || parsedWeight > 500) {
      setPrFeedback('Informe uma carga válida em kg (entre 1 e 500).');
      return;
    }
    if (Number.isNaN(parsedReps) || parsedReps < 1 || parsedReps > 20) {
      setPrFeedback('Informe o número de repetições entre 1 e 20 (ex: 1 RM).');
      return;
    }

    setPrSaving(true);
    setPrFeedback(null);

    try {
      if (editingPrId) {
        const prPath = `prs/${editingPrId}`;
        try {
          await updateDoc(doc(db, 'prs', editingPrId), {
            movement: resolvedMovement,
            weightKg: parsedWeight,
            reps: parsedReps,
            recordedDate: prDate,
            notes: prNotes.trim().slice(0, 200),
            updatedAt: serverTimestamp(),
          });
          setEditingPrId(null);
          setPrFeedback('PR atualizado no seu histórico!');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, prPath);
        }
      } else {
        try {
          await addDoc(collection(db, 'prs'), {
            userId: user.uid,
            movement: resolvedMovement,
            weightKg: parsedWeight,
            reps: parsedReps,
            recordedDate: prDate,
            notes: prNotes.trim().slice(0, 200),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setPrFeedback('Novo PR registrado com sucesso!');
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'prs');
        }
      }
      setPrWeight('');
      setPrNotes('');
      setCustomMovement('');
    } catch {
      setPrFeedback(
        'Não foi possível salvar seu PR. Verifique sua conexão e permissões.'
      );
    } finally {
      setPrSaving(false);
    }
  };

  const handleStartEditPr = (pr: PrDoc) => {
    setEditingPrId(pr.id);
    if (PR_MOVEMENTS.includes(pr.movement)) {
      setPrMovement(pr.movement);
      setCustomMovement('');
    } else {
      setPrMovement('Outro');
      setCustomMovement(pr.movement);
    }
    setPrWeight(String(pr.weightKg));
    setPrReps(String(pr.reps));
    setPrDate(pr.recordedDate);
    setPrNotes(pr.notes);
    setPrFeedback(null);
  };

  const handleCancelEditPr = () => {
    setEditingPrId(null);
    setPrWeight('');
    setPrReps('1');
    setPrNotes('');
    setCustomMovement('');
    setPrFeedback(null);
  };

  const handleDeletePr = async (prId: string) => {
    if (!user) return;
    const prPath = `prs/${prId}`;
    try {
      await deleteDoc(doc(db, 'prs', prId));
      if (editingPrId === prId) handleCancelEditPr();
      setPrFeedback('Registro de PR excluído.');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, prPath);
      } catch {
        setPrFeedback('Não foi possível excluir o registro.');
      }
    }
  };

  return (
    <section
      id="wod-ranking"
      aria-labelledby="wod-section-heading"
      className="border-b border-white/10 bg-[#080A0C] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#29A8F5]">
                Área do Atleta · Tempo Real
              </p>
              <h2
                id="wod-section-heading"
                className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl"
              >
                WOD do Dia, <span className="text-[#149CEA]">Ranking</span> e
                Meus PRs
              </h2>
              <p
                id="wod-section-subtitle"
                className="mt-3 max-w-2xl text-sm leading-relaxed text-[#B4BCC6] sm:text-base"
              >
                Acompanhe o treino prescrito do box, registre seu resultado no
                placar diário e salve suas cargas máximas de levantamento.
              </p>
            </div>

            {/* Navegação de Abas */}
            <div
              role="tablist"
              aria-labelledby="wod-section-heading"
              className="inline-flex w-full rounded-lg border border-white/15 bg-[#0F1318] p-1 sm:w-auto"
            >
              <button
                type="button"
                role="tab"
                id="tab-wod-ranking"
                aria-selected={activeTab === 'wod'}
                aria-controls="panel-wod-ranking"
                onClick={() => setActiveTab('wod')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors sm:flex-initial sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA] ${
                  activeTab === 'wod'
                    ? 'bg-[#0C7EC8] text-white'
                    : 'text-[#B4BCC6] hover:text-white'
                }`}
              >
                <Trophy className="h-4 w-4" aria-hidden="true" />
                <span>WOD &amp; Ranking</span>
              </button>
              <button
                type="button"
                role="tab"
                id="tab-meus-prs"
                aria-selected={activeTab === 'prs'}
                aria-controls="panel-meus-prs"
                onClick={() => setActiveTab('prs')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors sm:flex-initial sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA] ${
                  activeTab === 'prs'
                    ? 'bg-[#0C7EC8] text-white'
                    : 'text-[#B4BCC6] hover:text-white'
                }`}
              >
                <Dumbbell className="h-4 w-4" aria-hidden="true" />
                <span>Meus PRs</span>
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* PAINEL 1: WOD DO DIA & RANKING */}
        {activeTab === 'wod' && (
          <div
            id="panel-wod-ranking"
            role="tabpanel"
            aria-labelledby="tab-wod-ranking"
            className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12"
          >
            {/* Coluna Esquerda: Quadro do WOD */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-white/10 bg-[#0F1318] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#149CEA]/40 bg-[#149CEA]/10 text-[#29A8F5]">
                      <Flame className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3
                        id="wod-board-title"
                        className="font-display text-xl font-bold uppercase tracking-wide text-white"
                      >
                        Quadro do Dia
                      </h3>
                      <p className="text-xs text-[#9AA3AF] tabular-nums">
                        Data: {formatDatePtBr(selectedDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label htmlFor="wod-date-picker" className="sr-only">
                      Selecionar data do WOD
                    </label>
                    <div className="relative flex items-center">
                      <Calendar
                        className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#9AA3AF]"
                        aria-hidden="true"
                      />
                      <input
                        id="wod-date-picker"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          if (e.target.value) setSelectedDate(e.target.value);
                        }}
                        aria-describedby="wod-board-title"
                        className="rounded-md border border-white/15 bg-[#080A0C] py-1.5 pr-2.5 pl-8 text-xs font-medium text-white tabular-nums focus:border-[#149CEA] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Atalhos para datas publicadas recentemente */}
                {recentWods.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-[#9AA3AF]">
                      Recentes:
                    </span>
                    {recentWods.slice(0, 4).map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedDate(w.date)}
                        className={`rounded border px-2 py-1 text-[11px] font-semibold tabular-nums transition-colors ${
                          w.date === selectedDate
                            ? 'border-[#149CEA] bg-[#149CEA]/20 text-white'
                            : 'border-white/10 bg-[#080A0C] text-[#B4BCC6] hover:border-white/25 hover:text-white'
                        }`}
                      >
                        {formatDatePtBr(w.date)}
                      </button>
                    ))}
                  </div>
                )}

                {wodError && (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200"
                  >
                    {wodError}
                  </p>
                )}

                {wodLoading ? (
                  <div className="mt-6 space-y-3">
                    <div className="h-6 w-2/3 animate-pulse rounded bg-white/10" />
                    <div className="h-24 w-full animate-pulse rounded bg-white/5" />
                  </div>
                ) : currentWod ? (
                  <div className="mt-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white">
                        {currentWod.title}
                      </h4>
                      <span className="rounded border border-[#149CEA]/40 bg-[#149CEA]/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#29A8F5]">
                        {currentWod.modality}
                      </span>
                    </div>

                    {currentWod.warmup && (
                      <div className="rounded-lg border border-white/10 bg-[#080A0C] p-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF]">
                          Aquecimento / Técnica
                        </p>
                        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-[#D1D5DB]">
                          {currentWod.warmup}
                        </p>
                      </div>
                    )}

                    <div className="rounded-lg border border-[#149CEA]/25 bg-[#080A0C] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#29A8F5]">
                        Treino Principal (WOD)
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-white">
                        {currentWod.workout}
                      </p>
                    </div>

                    {currentWod.coachNotes && (
                      <div className="rounded-lg border border-white/10 bg-[#080A0C] p-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3AF]">
                          Estímulo &amp; Adaptações (Scaled)
                        </p>
                        <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-[#B4BCC6]">
                          {currentWod.coachNotes}
                        </p>
                      </div>
                    )}

                    <p className="text-[11px] text-[#8B949E]">
                      Prescrito por {currentWod.authorName}
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 rounded-lg border border-dashed border-white/15 bg-[#080A0C] p-6 text-center">
                    <p className="text-sm font-semibold text-white">
                      Nenhum WOD publicado para {formatDatePtBr(selectedDate)}.
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#9AA3AF]">
                      {isCoach
                        ? 'Você está autenticado como Coach. Clique abaixo para publicar o treino desta data.'
                        : 'Selecione outra data acima ou aguarde o coach publicar o treino de hoje.'}
                    </p>
                    {recentWods.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDate(recentWods[0].date)}
                        className="mt-4 inline-flex items-center gap-2 rounded-md border border-[#149CEA]/40 bg-[#149CEA]/10 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-[#29A8F5] transition-colors hover:bg-[#149CEA]/20"
                      >
                        Ver último WOD ({formatDatePtBr(recentWods[0].date)})
                      </button>
                    )}
                  </div>
                )}

                {/* Controles exclusivos de Coach */}
                {isCoach && (
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <button
                      type="button"
                      id="btn-toggle-coach-wod"
                      aria-expanded={coachFormOpen}
                      aria-controls="coach-wod-form"
                      aria-describedby="wod-board-title"
                      onClick={() => setCoachFormOpen((prev) => !prev)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#149CEA]/50 bg-[#149CEA]/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA]"
                    >
                      <ClipboardEdit className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {coachFormOpen
                          ? 'Fechar Editor de WOD'
                          : currentWod
                            ? 'Editar WOD desta Data'
                            : 'Publicar WOD para esta Data'}
                      </span>
                    </button>

                    {coachFormOpen && (
                      <form
                        id="coach-wod-form"
                        onSubmit={handleSaveWod}
                        aria-labelledby="coach-form-heading"
                        aria-describedby="coach-form-desc"
                        className="mt-4 space-y-3 rounded-lg border border-white/15 bg-[#080A0C] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4
                            id="coach-form-heading"
                            className="text-xs font-bold uppercase tracking-wider text-[#29A8F5]"
                          >
                            Editor do Coach · {formatDatePtBr(selectedDate)}
                          </h4>
                          <Shield
                            className="h-4 w-4 text-[#29A8F5]"
                            aria-hidden="true"
                          />
                        </div>
                        <p id="coach-form-desc" className="text-[11px] text-[#9AA3AF]">
                          O treino publicado aqui aparece em tempo real para todos os alunos do box.
                        </p>

                        <div>
                          <label
                            htmlFor="coach-wod-title"
                            className="block text-xs font-medium text-[#D1D5DB]"
                          >
                            Título do WOD
                          </label>
                          <input
                            id="coach-wod-title"
                            type="text"
                            required
                            maxLength={100}
                            placeholder="Ex: Fran Petrolândia / Força + Metcon"
                            value={wodTitle}
                            onChange={(e) => setWodTitle(e.target.value)}
                            className="mt-1 w-full rounded-md border border-white/15 bg-[#0F1318] px-3 py-2 text-sm text-white placeholder-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="coach-wod-modality"
                            className="block text-xs font-medium text-[#D1D5DB]"
                          >
                            Modalidade
                          </label>
                          <select
                            id="coach-wod-modality"
                            value={wodModality}
                            onChange={(e) =>
                              setWodModality(e.target.value as WodModality)
                            }
                            className="mt-1 w-full rounded-md border border-white/15 bg-[#0F1318] px-3 py-2 text-sm text-white focus:border-[#149CEA] focus:outline-none"
                          >
                            {WOD_MODALITIES.map((mod) => (
                              <option key={mod} value={mod}>
                                {mod}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="coach-wod-warmup"
                            className="block text-xs font-medium text-[#D1D5DB]"
                          >
                            Aquecimento / Técnica (opcional)
                          </label>
                          <textarea
                            id="coach-wod-warmup"
                            rows={2}
                            maxLength={500}
                            placeholder="Ex: 3 rounds: 10 Air Squat + 10 Scapular Pull-up"
                            value={wodWarmup}
                            onChange={(e) => setWodWarmup(e.target.value)}
                            className="mt-1 w-full rounded-md border border-white/15 bg-[#0F1318] px-3 py-2 text-sm text-white placeholder-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="coach-wod-workout"
                            className="block text-xs font-medium text-[#D1D5DB]"
                          >
                            Descrição do WOD
                          </label>
                          <textarea
                            id="coach-wod-workout"
                            rows={4}
                            required
                            maxLength={2000}
                            placeholder="Ex: 21-15-9 Thrusters (43/30 kg) + Pull-ups"
                            value={wodWorkout}
                            onChange={(e) => setWodWorkout(e.target.value)}
                            className="mt-1 w-full rounded-md border border-white/15 bg-[#0F1318] px-3 py-2 text-sm text-white placeholder-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="coach-wod-notes"
                            className="block text-xs font-medium text-[#D1D5DB]"
                          >
                            Notas de Estímulo / Scaled (opcional)
                          </label>
                          <textarea
                            id="coach-wod-notes"
                            rows={2}
                            maxLength={500}
                            placeholder="Ex: Time cap 15 min. Scaled: Ring Row + Halter."
                            value={wodNotes}
                            onChange={(e) => setWodNotes(e.target.value)}
                            className="mt-1 w-full rounded-md border border-white/15 bg-[#0F1318] px-3 py-2 text-sm text-white placeholder-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                          />
                        </div>

                        {coachFeedback && (
                          <p
                            role="status"
                            className="text-xs font-medium text-[#29A8F5]"
                          >
                            {coachFeedback}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={coachSaving}
                          aria-describedby="coach-form-heading coach-form-desc"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#0C7EC8] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA] disabled:opacity-60"
                        >
                          {coachSaving ? 'Salvando WOD...' : 'Salvar WOD no Quadro'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Direita: Ranking do WOD do Dia */}
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-white/10 bg-[#0F1318] p-6">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#149CEA]/40 bg-[#149CEA]/10 text-[#29A8F5]">
                      <Trophy className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3
                        id="ranking-heading"
                        className="font-display text-xl font-bold uppercase tracking-wide text-white"
                      >
                        Placar / Leaderboard
                      </h3>
                      <p className="text-xs text-[#9AA3AF]">
                        Resultados em tempo real · {formatDatePtBr(selectedDate)}
                      </p>
                    </div>
                  </div>

                  {/* Filtro RX / Scaled */}
                  <div
                    role="group"
                    aria-label="Filtrar placar por categoria"
                    className="inline-flex rounded-md border border-white/15 bg-[#080A0C] p-0.5"
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
                      O placar diário e o registro de tempo/reps na categoria RX
                      ou Scaled são exclusivos para alunos autenticados da
                      Crossfit Ebber.
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
                      <span>
                        {authBusy ? 'Conectando...' : 'Entrar com Google'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Formulário de Submissão de Resultado */}
                    <form
                      onSubmit={handleSaveScore}
                      aria-labelledby="score-form-title"
                      aria-describedby="score-form-desc"
                      className="mt-5 rounded-lg border border-white/10 bg-[#080A0C] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4
                          id="score-form-title"
                          className="text-xs font-bold uppercase tracking-wider text-white"
                        >
                          {myCurrentScore
                            ? 'Atualizar Meu Resultado no Placar'
                            : 'Registrar Meu Resultado'}
                        </h4>
                        <span className="text-[11px] text-[#9AA3AF]">
                          Atleta: {userProfile?.name || user.displayName}
                        </span>
                      </div>
                      <p id="score-form-desc" className="mt-1 text-[11px] text-[#9AA3AF]">
                        Informe seu tempo final (ex: 12:35) ou número de repetições concluídas.
                      </p>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
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

                        <div className="sm:col-span-3">
                          <label
                            htmlFor="score-type"
                            className="block text-[11px] font-medium text-[#B4BCC6]"
                          >
                            Tipo de Placar
                          </label>
                          <select
                            id="score-type"
                            value={scoreType}
                            onChange={(e) =>
                              setScoreType(e.target.value as ScoreType)
                            }
                            className="mt-1 w-full rounded-md border border-white/15 bg-[#0F1318] px-2.5 py-2 text-sm text-white focus:border-[#149CEA] focus:outline-none"
                          >
                            <option value="Tempo">Tempo (MM:SS)</option>
                            <option value="Reps">Reps / Rounds</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
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

                        <div className="sm:col-span-3 flex items-end">
                          <button
                            type="submit"
                            disabled={scoreSaving}
                            aria-describedby="score-form-title score-form-desc"
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#0C7EC8] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA] disabled:opacity-60"
                          >
                            <CheckCircle2
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            <span>
                              {scoreSaving
                                ? 'Salvando...'
                                : myCurrentScore
                                  ? 'Atualizar'
                                  : 'Publicar'}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label
                          htmlFor="score-notes"
                          className="block text-[11px] font-medium text-[#B4BCC6]"
                        >
                          Observação / Carga utilizada (opcional)
                        </label>
                        <input
                          id="score-notes"
                          type="text"
                          maxLength={200}
                          placeholder="Ex: Thruster 35kg / Pull-up com elástico"
                          value={scoreNotes}
                          onChange={(e) => setScoreNotes(e.target.value)}
                          className="mt-1 w-full rounded-md border border-white/15 bg-[#0F1318] px-3 py-1.5 text-xs text-white placeholder-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                        />
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

                    {scoresError && (
                      <p
                        role="alert"
                        className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200"
                      >
                        {scoresError}
                      </p>
                    )}

                    {/* Tabela / Lista do Ranking */}
                    <div className="mt-5">
                      {scoresLoading ? (
                        <div className="space-y-2">
                          <div className="h-14 w-full animate-pulse rounded-lg bg-white/5" />
                          <div className="h-14 w-full animate-pulse rounded-lg bg-white/5" />
                        </div>
                      ) : sortedScores.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-white/15 bg-[#080A0C] p-6 text-center">
                          <p className="text-sm font-medium text-white">
                            Nenhum resultado lançado nesta categoria ainda.
                          </p>
                          <p className="mt-1 text-xs text-[#9AA3AF]">
                            Seja o primeiro atleta a registrar o treino de{' '}
                            {formatDatePtBr(selectedDate)}!
                          </p>
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
                                className={`flex items-center justify-between gap-3 px-4 py-3 ${
                                  isMine ? 'bg-[#149CEA]/10' : ''
                                }`}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded font-display text-sm font-extrabold tabular-nums ${
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

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">
                                      {item.userName}{' '}
                                      {isMine && (
                                        <span className="text-xs font-normal text-[#29A8F5]">
                                          (Você)
                                        </span>
                                      )}
                                    </p>
                                    {item.notes && (
                                      <p className="truncate text-xs text-[#9AA3AF]">
                                        {item.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-3">
                                  <div className="text-right">
                                    <p className="font-display text-base font-bold text-white tabular-nums">
                                      {item.resultDisplay}
                                    </p>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#29A8F5]">
                                      {item.category}
                                    </p>
                                  </div>

                                  {(isMine || isCoach) && (
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteScore(item.id)}
                                      aria-label={`Remover resultado de ${item.userName}`}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/10 text-[#9AA3AF] transition-colors hover:border-red-400/50 hover:text-red-400"
                                    >
                                      <Trash2
                                        className="h-3.5 w-3.5"
                                        aria-hidden="true"
                                      />
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
            </div>
          </div>
        )}

        {/* PAINEL 2: MEUS PRs (PERSONAL RECORDS) */}
        {activeTab === 'prs' && (
          <div
            id="panel-meus-prs"
            role="tabpanel"
            aria-labelledby="tab-meus-prs"
            className="mt-8"
          >
            {!user ? (
              <div className="rounded-xl border border-white/10 bg-[#0F1318] p-8 text-center">
                <Award
                  className="mx-auto h-10 w-10 text-[#29A8F5]"
                  aria-hidden="true"
                />
                <h3
                  id="login-prompt-prs-title"
                  className="mt-3 font-display text-2xl font-bold uppercase tracking-wide text-white"
                >
                  Salve seus Recordes Pessoais (PRs)
                </h3>
                <p
                  id="login-prompt-prs-desc"
                  className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#B4BCC6]"
                >
                  Entre com sua conta Google para registrar e acompanhar sua
                  evolução de carga máxima em Snatch, Clean &amp; Jerk,
                  Deadlift, Back Squat e outros levantamentos olímpicos.
                </p>
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => void signInWithGoogle()}
                  aria-labelledby="login-prompt-prs-title"
                  aria-describedby="login-prompt-prs-desc"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-[#0C7EC8] px-6 py-3 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA] disabled:opacity-60"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {authBusy ? 'Conectando...' : 'Entrar com Google'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Formulário de Novo PR / Edição */}
                <div className="lg:col-span-5">
                  <form
                    onSubmit={handleSavePr}
                    aria-labelledby="pr-form-heading"
                    aria-describedby="pr-form-desc"
                    className="rounded-xl border border-white/10 bg-[#0F1318] p-6"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <h3
                          id="pr-form-heading"
                          className="font-display text-xl font-bold uppercase tracking-wide text-white"
                        >
                          {editingPrId ? 'Editar PR' : 'Registrar Novo PR'}
                        </h3>
                        <p id="pr-form-desc" className="text-xs text-[#9AA3AF]">
                          Salvo exclusivamente no seu perfil de atleta.
                        </p>
                      </div>
                      <Dumbbell
                        className="h-5 w-5 text-[#29A8F5]"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="mt-4 space-y-3.5">
                      <div>
                        <label
                          htmlFor="pr-movement"
                          className="block text-xs font-medium text-[#D1D5DB]"
                        >
                          Movimento
                        </label>
                        <select
                          id="pr-movement"
                          value={prMovement}
                          onChange={(e) => setPrMovement(e.target.value)}
                          className="mt-1 w-full rounded-md border border-white/15 bg-[#080A0C] px-3 py-2 text-sm text-white focus:border-[#149CEA] focus:outline-none"
                        >
                          {PR_MOVEMENTS.map((mov) => (
                            <option key={mov} value={mov}>
                              {mov}
                            </option>
                          ))}
                          <option value="Outro">Outro movimento...</option>
                        </select>
                      </div>

                      {prMovement === 'Outro' && (
                        <div>
                          <label
                            htmlFor="pr-custom-movement"
                            className="block text-xs font-medium text-[#D1D5DB]"
                          >
                            Nome do Movimento
                          </label>
                          <input
                            id="pr-custom-movement"
                            type="text"
                            required
                            maxLength={60}
                            placeholder="Ex: Push Jerk ou Power Clean"
                            value={customMovement}
                            onChange={(e) => setCustomMovement(e.target.value)}
                            className="mt-1 w-full rounded-md border border-white/15 bg-[#080A0C] px-3 py-2 text-sm text-white placeholder-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="pr-weight"
                            className="block text-xs font-medium text-[#D1D5DB]"
                          >
                            Carga (kg)
                          </label>
                          <input
                            id="pr-weight"
                            type="number"
                            step="0.5"
                            min="1"
                            max="500"
                            required
                            placeholder="Ex: 100"
                            value={prWeight}
                            onChange={(e) => setPrWeight(e.target.value)}
                            className="mt-1 w-full rounded-md border border-white/15 bg-[#080A0C] px-3 py-2 text-sm text-white tabular-nums placeholder-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="pr-reps"
                            className="block text-xs font-medium text-[#D1D5DB]"
                          >
                            Repetições (RM)
                          </label>
                          <input
                            id="pr-reps"
                            type="number"
                            min="1"
                            max="20"
                            required
                            value={prReps}
                            onChange={(e) => setPrReps(e.target.value)}
                            className="mt-1 w-full rounded-md border border-white/15 bg-[#080A0C] px-3 py-2 text-sm text-white tabular-nums focus:border-[#149CEA] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="pr-date"
                          className="block text-xs font-medium text-[#D1D5DB]"
                        >
                          Data do Recorde
                        </label>
                        <input
                          id="pr-date"
                          type="date"
                          required
                          value={prDate}
                          onChange={(e) => setPrDate(e.target.value)}
                          className="mt-1 w-full rounded-md border border-white/15 bg-[#080A0C] px-3 py-2 text-sm text-white tabular-nums focus:border-[#149CEA] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="pr-notes"
                          className="block text-xs font-medium text-[#D1D5DB]"
                        >
                          Observações (opcional)
                        </label>
                        <input
                          id="pr-notes"
                          type="text"
                          maxLength={200}
                          placeholder="Ex: Sem cinto, execução limpa"
                          value={prNotes}
                          onChange={(e) => setPrNotes(e.target.value)}
                          className="mt-1 w-full rounded-md border border-white/15 bg-[#080A0C] px-3 py-2 text-sm text-white placeholder-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                        />
                      </div>

                      {prFeedback && (
                        <p
                          role="status"
                          className="text-xs font-medium text-[#29A8F5]"
                        >
                          {prFeedback}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={prSaving}
                          aria-describedby="pr-form-heading pr-form-desc"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[#0C7EC8] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA] disabled:opacity-60"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {prSaving
                              ? 'Salvando...'
                              : editingPrId
                                ? 'Atualizar PR'
                                : 'Salvar PR'}
                          </span>
                        </button>
                        {editingPrId && (
                          <button
                            type="button"
                            onClick={handleCancelEditPr}
                            className="rounded-md border border-white/15 bg-[#080A0C] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#D1D5DB] hover:text-white"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>

                {/* Coluna Direita: Melhores Marcas + Histórico */}
                <div className="space-y-6 lg:col-span-7">
                  {/* Resumo de Melhores Cargas */}
                  <div className="rounded-xl border border-white/10 bg-[#0F1318] p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <div>
                        <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                          Minhas Melhores Cargas
                        </h3>
                        <p className="text-xs text-[#9AA3AF]">
                          Maior carga registrada por exercício
                        </p>
                      </div>

                      <div>
                        <label htmlFor="pr-filter-select" className="sr-only">
                          Filtrar histórico por exercício
                        </label>
                        <select
                          id="pr-filter-select"
                          value={prFilterMovement}
                          onChange={(e) => setPrFilterMovement(e.target.value)}
                          className="rounded-md border border-white/15 bg-[#080A0C] px-3 py-1.5 text-xs font-medium text-white focus:border-[#149CEA] focus:outline-none"
                        >
                          <option value="Todos">Todos os exercícios</option>
                          {bestPrByMovement.map((item) => (
                            <option key={item.movement} value={item.movement}>
                              {item.movement}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {prsError && (
                      <p
                        role="alert"
                        className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200"
                      >
                        {prsError}
                      </p>
                    )}

                    {prsLoading ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="h-20 animate-pulse rounded-lg bg-white/5" />
                        <div className="h-20 animate-pulse rounded-lg bg-white/5" />
                        <div className="h-20 animate-pulse rounded-lg bg-white/5" />
                      </div>
                    ) : bestPrByMovement.length === 0 ? (
                      <div className="mt-4 rounded-lg border border-dashed border-white/15 bg-[#080A0C] p-6 text-center">
                        <p className="text-sm font-medium text-white">
                          Você ainda não registrou nenhum PR.
                        </p>
                        <p className="mt-1 text-xs text-[#9AA3AF]">
                          Use o formulário ao lado para salvar seu primeiro
                          recorde pessoal.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {bestPrByMovement.map((best) => (
                          <button
                            key={best.movement}
                            type="button"
                            onClick={() =>
                              setPrFilterMovement((prev) =>
                                prev === best.movement ? 'Todos' : best.movement
                              )
                            }
                            className={`rounded-lg border p-3.5 text-left transition-colors ${
                              prFilterMovement === best.movement
                                ? 'border-[#149CEA] bg-[#149CEA]/15'
                                : 'border-white/10 bg-[#080A0C] hover:border-white/25'
                            }`}
                          >
                            <p className="truncate text-xs font-semibold uppercase tracking-wide text-[#B4BCC6]">
                              {best.movement}
                            </p>
                            <p className="mt-1 font-display text-2xl font-extrabold text-white tabular-nums">
                              {best.weightKg}{' '}
                              <span className="text-sm font-semibold text-[#29A8F5]">
                                kg
                              </span>
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#9AA3AF] tabular-nums">
                              {best.reps} RM · {formatDatePtBr(best.recordedDate)}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Lista cronológica */}
                    {filteredPrs.length > 0 && (
                      <div className="mt-6">
                        <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#9AA3AF]">
                          Histórico de Registros ({filteredPrs.length})
                        </h4>
                        <ul className="divide-y divide-white/10 rounded-lg border border-white/10 bg-[#080A0C]">
                          {filteredPrs.map((pr) => (
                            <li
                              key={pr.id}
                              className="flex items-center justify-between gap-3 px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">
                                  {pr.movement}{' '}
                                  <span className="ml-1.5 font-display text-base font-bold text-[#29A8F5] tabular-nums">
                                    {pr.weightKg} kg
                                  </span>{' '}
                                  <span className="text-xs font-normal text-[#9AA3AF] tabular-nums">
                                    ({pr.reps} RM)
                                  </span>
                                </p>
                                <p className="mt-0.5 text-xs text-[#9AA3AF] tabular-nums">
                                  {formatDatePtBr(pr.recordedDate)}
                                  {pr.notes ? ` · ${pr.notes}` : ''}
                                </p>
                              </div>

                              <div className="flex shrink-0 items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditPr(pr)}
                                  aria-label={`Editar PR de ${pr.movement}`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/10 text-[#B4BCC6] transition-colors hover:border-[#149CEA] hover:text-white"
                                >
                                  <Pencil
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeletePr(pr.id)}
                                  aria-label={`Excluir PR de ${pr.movement}`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/10 text-[#9AA3AF] transition-colors hover:border-red-400/50 hover:text-red-400"
                                >
                                  <Trash2
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
