import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  Calendar,
  ClipboardEdit,
  Dumbbell,
  Flame,
  LogIn,
  Shield,
  Trophy,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { OperationType, db, handleFirestoreError } from '../services/firebase';
import { PersonalRecordTracker } from './PersonalRecordTracker';
import { ScrollReveal } from './ScrollReveal';
import { StreakCard } from './StreakCard';
import { WodLeaderboard } from './WodLeaderboard';

type WodModality = 'AMRAP' | 'For Time' | 'EMOM' | 'Força + Metcon';

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

const WOD_MODALITIES: WodModality[] = [
  'For Time',
  'AMRAP',
  'EMOM',
  'Força + Metcon',
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

export function WodCommunitySection() {
  const { user, userProfile, authReady, authBusy, signInWithGoogle } =
    useAuth();

  const [activeTab, setActiveTab] = useState<'wod' | 'prs'>('wod');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString);

  // Estado do WOD do Dia
  const [recentWods, setRecentWods] = useState<WodDoc[]>([]);
  const [selectedDateWod, setSelectedDateWod] = useState<WodDoc | null>(null);
  const [wodLoading, setWodLoading] = useState(true);
  const [wodError, setWodError] = useState<string | null>(null);
  const [wodRequiresAuth, setWodRequiresAuth] = useState(false);
  const [coachFormOpen, setCoachFormOpen] = useState(false);
  const [coachSaving, setCoachSaving] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState<string | null>(null);

  const [wodTitle, setWodTitle] = useState('');
  const [wodModality, setWodModality] = useState<WodModality>('For Time');
  const [wodWarmup, setWodWarmup] = useState('');
  const [wodWorkout, setWodWorkout] = useState('');
  const [wodNotes, setWodNotes] = useState('');

  const currentWod = useMemo(
    () =>
      recentWods.find((w) => w.date === selectedDate) ??
      (selectedDateWod?.date === selectedDate ? selectedDateWod : null),
    [recentWods, selectedDateWod, selectedDate]
  );

  const activeWodSummary = useMemo(
    () =>
      currentWod
        ? {
            id: currentWod.id,
            date: currentWod.date,
            title: currentWod.title,
            modality: currentWod.modality,
            workout: currentWod.workout,
          }
        : null,
    [currentWod]
  );

  const selectedDateRef = useRef(selectedDate);
  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

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

  // Listener contínuo para os 14 WODs mais recentes
  useEffect(() => {
    if (!authReady) return;

    setWodLoading(true);
    setWodError(null);
    setWodRequiresAuth(false);
    let settled = false;
    let active = true;

    const mapDocToWod = (
      id: string,
      d: Record<string, unknown>
    ): WodDoc => ({
      id,
      date: String(d.date || id),
      title: String(d.title || 'WOD do Dia'),
      modality: WOD_MODALITIES.includes(d.modality as WodModality)
        ? (d.modality as WodModality)
        : 'For Time',
      warmup: String(d.warmup || ''),
      workout: String(d.workout || ''),
      coachNotes: String(d.coachNotes || ''),
      authorUid: String(d.authorUid || ''),
      authorName: String(d.authorName || 'Coach Ebber'),
    });

    const loadingTimeout = window.setTimeout(() => {
      if (!settled && active) {
        setWodLoading(false);
        setWodError(
          'Conexão lenta ao carregar o quadro do WOD. Tente atualizar ou entrar com sua conta.'
        );
      }
    }, 8000);

    const wodsQuery = query(
      collection(db, 'wods'),
      orderBy('date', 'desc'),
      limit(14)
    );

    const unsubscribe = onSnapshot(
      wodsQuery,
      (snapshot) => {
        if (!active) return;
        settled = true;
        window.clearTimeout(loadingTimeout);
        const loaded = snapshot.docs.map((docSnap) =>
          mapDocToWod(docSnap.id, docSnap.data() as Record<string, unknown>)
        );
        setRecentWods(loaded);
        setWodError(null);
        setWodRequiresAuth(false);
        setWodLoading(false);
      },
      async (err) => {
        if (!active) return;
        settled = true;
        window.clearTimeout(loadingTimeout);

        // Fallback para getDoc por ID (funciona mesmo se allow list estiver restrito)
        try {
          const singleSnap = await getDoc(
            doc(db, 'wods', selectedDateRef.current)
          );
          if (!active) return;
          if (singleSnap.exists()) {
            const oneWod = mapDocToWod(
              singleSnap.id,
              singleSnap.data() as Record<string, unknown>
            );
            setSelectedDateWod(oneWod);
          } else {
            setSelectedDateWod(null);
          }
          setWodError(null);
          setWodRequiresAuth(false);
          setWodLoading(false);
          return;
        } catch (fallbackErr) {
          if (!active) return;
          if (!user) {
            setWodRequiresAuth(true);
            setWodError(null);
            setWodLoading(false);
            return;
          }
          try {
            handleFirestoreError(
              fallbackErr || err,
              OperationType.LIST,
              'wods'
            );
          } catch {
            setWodError(
              'Não foi possível carregar o WOD do dia no Firestore. Verifique as regras de segurança publicadas.'
            );
            setWodLoading(false);
          }
        }
      }
    );

    return () => {
      active = false;
      window.clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [authReady, user]);

  // Lookup pontual se o usuário escolher uma data fora dos 14 WODs recentes
  useEffect(() => {
    if (!authReady || (wodRequiresAuth && !user)) return;
    if (recentWods.some((w) => w.date === selectedDate)) {
      setSelectedDateWod(null);
      return;
    }

    let active = true;
    void getDoc(doc(db, 'wods', selectedDate))
      .then((snap) => {
        if (!active) return;
        if (snap.exists()) {
          const d = snap.data() as Record<string, unknown>;
          setSelectedDateWod({
            id: snap.id,
            date: String(d.date || snap.id),
            title: String(d.title || 'WOD do Dia'),
            modality: WOD_MODALITIES.includes(d.modality as WodModality)
              ? (d.modality as WodModality)
              : 'For Time',
            warmup: String(d.warmup || ''),
            workout: String(d.workout || ''),
            coachNotes: String(d.coachNotes || ''),
            authorUid: String(d.authorUid || ''),
            authorName: String(d.authorName || 'Coach Ebber'),
          });
        } else {
          setSelectedDateWod(null);
        }
      })
      .catch(() => {
        if (active) setSelectedDateWod(null);
      });

    return () => {
      active = false;
    };
  }, [authReady, wodRequiresAuth, user, selectedDate, recentWods]);

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
                Perfil &amp; PRs
              </h2>
              <p
                id="wod-section-subtitle"
                className="mt-3 max-w-2xl text-sm leading-relaxed text-[#B4BCC6] sm:text-base"
              >
                Mantenha seu foguinho aceso todos os dias, acompanhe o treino do
                box, lance seu placar por turma e gerencie seus recordes
                pessoais.
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
                id="tab-perfil-prs"
                aria-selected={activeTab === 'prs'}
                aria-controls="panel-perfil-prs"
                onClick={() => setActiveTab('prs')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors sm:flex-initial sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA] ${
                  activeTab === 'prs'
                    ? 'bg-[#0C7EC8] text-white'
                    : 'text-[#B4BCC6] hover:text-white'
                }`}
              >
                <User className="h-4 w-4" aria-hidden="true" />
                <span>Perfil &amp; PRs</span>
                <Dumbbell className="hidden h-3.5 w-3.5 sm:inline" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Foguinho / Ofensiva do Atleta */}
          <StreakCard />
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
                ) : wodRequiresAuth && !user ? (
                  <div className="mt-6 rounded-lg border border-dashed border-white/15 bg-[#080A0C] p-6 text-center">
                    <p className="text-sm font-semibold text-white">
                      Entre com sua conta Google para visualizar o WOD do Dia.
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#9AA3AF]">
                      O quadro completo de treinos, placar e PRs é sincronizado
                      com o seu perfil de atleta da Crossfit Ebber.
                    </p>
                    <button
                      type="button"
                      disabled={authBusy}
                      onClick={() => void signInWithGoogle()}
                      className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#0C7EC8] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA] disabled:opacity-60"
                    >
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {authBusy ? 'Conectando...' : 'Entrar com Google'}
                      </span>
                    </button>
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
                        ? 'Você está autenticado como Coach. Clique abaixo para publicar o treino completo desta data.'
                        : 'Selecione outra data acima ou registre seu resultado no placar ao lado informando o nome do treino.'}
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
                          O treino publicado aqui aparece em tempo real para
                          todos os alunos do box.
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
                          {coachSaving
                            ? 'Salvando WOD...'
                            : 'Salvar WOD no Quadro'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Direita: Componente WodLeaderboard */}
            <div className="lg:col-span-7">
              <WodLeaderboard
                selectedDate={selectedDate}
                currentWod={activeWodSummary}
              />
            </div>
          </div>
        )}

        {/* PAINEL 2: PERFIL DO ALUNO & PERSONAL RECORDS (PRs) */}
        {activeTab === 'prs' && (
          <div
            id="panel-perfil-prs"
            role="tabpanel"
            aria-labelledby="tab-perfil-prs"
            className="mt-8"
          >
            <PersonalRecordTracker />
          </div>
        )}
      </div>
    </section>
  );
}
