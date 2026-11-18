import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  Award,
  Clock,
  Dumbbell,
  Flame,
  LogIn,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStreak } from '../contexts/StreakContext';
import { OperationType, db, handleFirestoreError } from '../services/firebase';

export type RecordType = 'weight' | 'time';

export interface PrDoc {
  id: string;
  userId: string;
  movement: string;
  recordType: RecordType;
  weightKg: number;
  reps: number;
  timeDisplay: string;
  timeSeconds: number | null;
  recordedDate: string;
  notes: string;
}

const WEIGHT_MOVEMENTS = [
  'Snatch',
  'Clean & Jerk',
  'Back Squat',
  'Deadlift',
  'Front Squat',
  'Overhead Squat',
  'Shoulder Press',
  'Thruster',
];

const TIME_WORKOUTS = [
  'Fran',
  'Murph',
  'Grace',
  'Helen',
  'Isabel',
  'Annie',
  'Karen',
  'Corrida 5km',
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

function parseTimeToSeconds(input: string): {
  seconds: number;
  formatted: string;
} | null {
  const cleaned = input.trim();
  // Aceita HH:MM:SS
  const hhmmss = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/.exec(cleaned);
  if (hhmmss) {
    const h = Number(hhmmss[1]);
    const m = Number(hhmmss[2]);
    const s = Number(hhmmss[3]);
    const total = h * 3600 + m * 60 + s;
    if (total <= 0 || total > 30000) return null;
    const formatted = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return { seconds: total, formatted };
  }

  // Aceita MM:SS
  const mmss = /^(\d{1,3}):([0-5]\d)$/.exec(cleaned);
  if (mmss) {
    const m = Number(mmss[1]);
    const s = Number(mmss[2]);
    const total = m * 60 + s;
    if (total <= 0 || total > 30000) return null;
    const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return { seconds: total, formatted };
  }

  return null;
}

function parsePrNotes(rawNotes: string): {
  recordType: RecordType;
  timeDisplay: string;
  timeSeconds: number | null;
  cleanNotes: string;
} {
  const trimmed = rawNotes.trim();
  const match = /^\[Tempo:\s*(\d{1,3}:[0-5]\d(?::[0-5]\d)?)\]\s*(.*)$/i.exec(
    trimmed
  );
  if (match) {
    const parsed = parseTimeToSeconds(match[1]);
    if (parsed) {
      return {
        recordType: 'time',
        timeDisplay: parsed.formatted,
        timeSeconds: parsed.seconds,
        cleanNotes: match[2].trim(),
      };
    }
  }
  return {
    recordType: 'weight',
    timeDisplay: '',
    timeSeconds: null,
    cleanNotes: trimmed,
  };
}

function encodePrTimeNotes(formattedTime: string, notes: string): string {
  const cleanNotes = notes.trim();
  const prefix = `[Tempo: ${formattedTime}]`;
  const combined = cleanNotes ? `${prefix} ${cleanNotes}` : prefix;
  return combined.slice(0, 200);
}

export function PersonalRecordTracker() {
  const { user, userProfile, authReady, authBusy, signInWithGoogle } =
    useAuth();
  const { currentStreak, markActiveDate } = useStreak();

  const [prs, setPrs] = useState<PrDoc[]>([]);
  const [prsLoading, setPrsLoading] = useState(false);
  const [prsError, setPrsError] = useState<string | null>(null);

  // Estado do Formulário
  const [editingPrId, setEditingPrId] = useState<string | null>(null);
  const [recordType, setRecordType] = useState<RecordType>('weight');
  const [prMovement, setPrMovement] = useState<string>('Snatch');
  const [customMovement, setCustomMovement] = useState<string>('');
  const [prWeight, setPrWeight] = useState<string>('');
  const [prReps, setPrReps] = useState<string>('1');
  const [prTime, setPrTime] = useState<string>('');
  const [prDate, setPrDate] = useState<string>(getTodayDateString);
  const [prNotes, setPrNotes] = useState<string>('');
  const [prSaving, setPrSaving] = useState(false);
  const [prFeedback, setPrFeedback] = useState<string | null>(null);

  // Filtros
  const [prTypeFilter, setPrTypeFilter] = useState<'all' | RecordType>('all');
  const [prFilterMovement, setPrFilterMovement] = useState<string>('Todos');
  const [avatarError, setAvatarError] = useState(false);

  const prAvatarUrl = userProfile?.photoURL || user?.photoURL || '';
  useEffect(() => {
    setAvatarError(false);
  }, [prAvatarUrl]);

  const movementPresets =
    recordType === 'weight' ? WEIGHT_MOVEMENTS : TIME_WORKOUTS;

  const handleSwitchRecordType = (nextType: RecordType) => {
    if (nextType === recordType) return;
    setRecordType(nextType);
    setPrFeedback(null);
    if (!editingPrId) {
      setPrMovement(nextType === 'weight' ? WEIGHT_MOVEMENTS[0] : TIME_WORKOUTS[0]);
      setCustomMovement('');
    }
  };

  // Listener autenticado em tempo real da coleção 'prs'
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
            const parsed = parsePrNotes(String(d.notes || ''));
            return {
              id: docSnap.id,
              userId: String(d.userId || user.uid),
              movement: String(d.movement || ''),
              recordType: parsed.recordType,
              weightKg: Number(d.weightKg || 0),
              reps: Number(d.reps || 1),
              timeDisplay: parsed.timeDisplay,
              timeSeconds: parsed.timeSeconds,
              recordedDate: String(d.recordedDate || ''),
              notes: parsed.cleanNotes,
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

  // Melhores marcas por movimento/treino (maior carga em kg ou menor tempo em MM:SS)
  const bestPrByMovement = useMemo(() => {
    const map = new Map<string, PrDoc>();
    for (const pr of prs) {
      if (prTypeFilter !== 'all' && pr.recordType !== prTypeFilter) {
        continue;
      }
      const key = `${pr.recordType}::${pr.movement.toLowerCase()}`;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, pr);
        continue;
      }
      if (pr.recordType === 'weight') {
        if (pr.weightKg > prev.weightKg) {
          map.set(key, pr);
        }
      } else if (
        pr.timeSeconds !== null &&
        (prev.timeSeconds === null || pr.timeSeconds < prev.timeSeconds)
      ) {
        map.set(key, pr);
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.movement.localeCompare(b.movement)
    );
  }, [prs, prTypeFilter]);

  const filteredPrs = useMemo(() => {
    return prs.filter((p) => {
      const matchesType =
        prTypeFilter === 'all' || p.recordType === prTypeFilter;
      const matchesMovement =
        prFilterMovement === 'Todos' || p.movement === prFilterMovement;
      return matchesType && matchesMovement;
    });
  }, [prs, prTypeFilter, prFilterMovement]);

  const handleSavePr = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const resolvedMovement = (
      prMovement === 'Outro' ? customMovement : prMovement
    ).trim();

    if (resolvedMovement.length < 2 || resolvedMovement.length > 60) {
      setPrFeedback(
        'Informe o nome do exercício ou treino (entre 2 e 60 caracteres).'
      );
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(prDate)) {
      setPrFeedback('Selecione uma data válida para o recorde.');
      return;
    }

    let payloadWeightKg = 0;
    let payloadReps = 1;
    let payloadNotes = prNotes.trim().slice(0, 200);

    if (recordType === 'weight') {
      const normalizedWeight = prWeight.replace(',', '.').trim();
      const parsedWeight = /^\d+(\.\d+)?$/.test(normalizedWeight)
        ? Number(normalizedWeight)
        : Number.NaN;
      const parsedReps = Number.parseInt(prReps, 10);

      if (
        Number.isNaN(parsedWeight) ||
        parsedWeight <= 0 ||
        parsedWeight > 500
      ) {
        setPrFeedback('Informe uma carga válida em kg (entre 1 e 500).');
        return;
      }
      if (Number.isNaN(parsedReps) || parsedReps < 1 || parsedReps > 20) {
        setPrFeedback(
          'Informe o número de repetições entre 1 e 20 (ex: 1 RM).'
        );
        return;
      }

      payloadWeightKg = parsedWeight;
      payloadReps = parsedReps;
    } else {
      const parsedTime = parseTimeToSeconds(prTime);
      if (!parsedTime) {
        setPrFeedback(
          'Informe um tempo válido no formato MM:SS (ex: 04:15) ou H:MM:SS (ex: 1:02:30).'
        );
        return;
      }
      // Compatibilidade com a regra numérica de weightKg (> 0 e <= 500) no Firestore
      payloadWeightKg = Math.min(
        500,
        Math.max(0.5, Number((parsedTime.seconds / 60).toFixed(2)))
      );
      payloadReps = 1;
      payloadNotes = encodePrTimeNotes(parsedTime.formatted, prNotes);
    }

    setPrSaving(true);
    setPrFeedback(null);

    try {
      if (editingPrId) {
        const prPath = `prs/${editingPrId}`;
        try {
          await updateDoc(doc(db, 'prs', editingPrId), {
            movement: resolvedMovement,
            weightKg: payloadWeightKg,
            reps: payloadReps,
            recordedDate: prDate,
            notes: payloadNotes,
            updatedAt: serverTimestamp(),
          });
          setEditingPrId(null);
          markActiveDate(prDate, 'workout');
          setPrFeedback('Recorde pessoal atualizado no seu perfil!');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, prPath);
        }
      } else {
        try {
          await addDoc(collection(db, 'prs'), {
            userId: user.uid,
            movement: resolvedMovement,
            weightKg: payloadWeightKg,
            reps: payloadReps,
            recordedDate: prDate,
            notes: payloadNotes,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          markActiveDate(prDate, 'workout');
          setPrFeedback(
            'Novo recorde pessoal salvo na sua ficha e foguinho atualizado!'
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'prs');
        }
      }
      setPrWeight('');
      setPrTime('');
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
    setRecordType(pr.recordType);

    const presets =
      pr.recordType === 'weight' ? WEIGHT_MOVEMENTS : TIME_WORKOUTS;
    if (presets.includes(pr.movement)) {
      setPrMovement(pr.movement);
      setCustomMovement('');
    } else {
      setPrMovement('Outro');
      setCustomMovement(pr.movement);
    }

    if (pr.recordType === 'weight') {
      setPrWeight(String(pr.weightKg));
      setPrReps(String(pr.reps));
      setPrTime('');
    } else {
      setPrTime(pr.timeDisplay);
      setPrWeight('');
      setPrReps('1');
    }

    setPrDate(pr.recordedDate);
    setPrNotes(pr.notes);
    setPrFeedback(null);
  };

  const handleCancelEditPr = () => {
    setEditingPrId(null);
    setPrWeight('');
    setPrTime('');
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

  if (!user) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0F1318] p-8 text-center">
        <Award
          className="mx-auto h-10 w-10 text-[#29A8F5]"
          aria-hidden="true"
        />
        <h3
          id="login-prompt-prs-title"
          className="mt-3 font-display text-2xl font-bold uppercase tracking-wide text-white"
        >
          Perfil do Aluno &amp; Recordes Pessoais (PRs)
        </h3>
        <p
          id="login-prompt-prs-desc"
          className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#B4BCC6]"
        >
          Entre com sua conta Google para salvar e acompanhar suas cargas máximas
          (Snatch, Clean &amp; Jerk, Back Squat, Deadlift) e melhores tempos de
          WOD (Fran, Murph, Grace e mais).
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
          <span>{authBusy ? 'Conectando...' : 'Entrar com Google'}</span>
        </button>
      </div>
    );
  }

  const displayName = userProfile?.name || user.displayName || 'Atleta Ebber';
  const avatarUrl = userProfile?.photoURL || user.photoURL || '';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'A';

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Perfil do Aluno */}
      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#0F1318] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {avatarUrl && !avatarError ? (
            <img
              src={avatarUrl}
              alt={`Foto de ${displayName}`}
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
              className="h-14 w-14 rounded-full border border-[#149CEA]/40 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#149CEA]/40 bg-[#149CEA]/15 font-display text-xl font-bold text-[#29A8F5]">
              {initial}
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                {displayName}
              </h3>
              <span className="rounded border border-[#149CEA]/40 bg-[#149CEA]/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#29A8F5]">
                {userProfile?.role === 'coach' ? 'Coach' : 'Aluno'}
              </span>
            </div>
            <p className="text-xs text-[#9AA3AF]">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="rounded-lg border border-white/10 bg-[#080A0C] px-3.5 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA3AF]">
              PRs Registrados
            </p>
            <p className="font-display text-lg font-extrabold text-white tabular-nums">
              {prs.length}
            </p>
          </div>
          <div className="rounded-lg border border-[#FF7A00]/30 bg-[#16120E] px-3.5 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#FFB347]">
              Foguinho
            </p>
            <p className="inline-flex items-center gap-1 font-display text-lg font-extrabold text-white tabular-nums">
              <Flame
                className="h-4 w-4 fill-[#FF6B00] text-[#FFB347]"
                aria-hidden="true"
              />
              {currentStreak} {currentStreak === 1 ? 'dia' : 'dias'}
            </p>
          </div>
        </div>
      </div>

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
                  {editingPrId ? 'Editar Recorde (PR)' : 'Registrar Novo PR'}
                </h3>
                <p id="pr-form-desc" className="text-xs text-[#9AA3AF]">
                  Salve suas cargas máximas (kg) ou melhores tempos de treino no
                  Firestore.
                </p>
              </div>
              {recordType === 'weight' ? (
                <Dumbbell
                  className="h-5 w-5 text-[#29A8F5]"
                  aria-hidden="true"
                />
              ) : (
                <Clock className="h-5 w-5 text-[#29A8F5]" aria-hidden="true" />
              )}
            </div>

            <div className="mt-4 space-y-3.5">
              {/* Seletor de Tipo: Carga Máxima vs Tempo de Treino */}
              <div role="group" aria-labelledby="pr-type-selector-label">
                <span
                  id="pr-type-selector-label"
                  className="block text-xs font-medium text-[#D1D5DB]"
                >
                  Tipo de Recorde
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-pressed={recordType === 'weight'}
                    aria-describedby="pr-type-selector-label"
                    onClick={() => handleSwitchRecordType('weight')}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                      recordType === 'weight'
                        ? 'border-[#149CEA] bg-[#0C7EC8] text-white'
                        : 'border-white/15 bg-[#080A0C] text-[#B4BCC6] hover:text-white'
                    }`}
                  >
                    <Dumbbell className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Carga (kg)</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={recordType === 'time'}
                    aria-describedby="pr-type-selector-label"
                    onClick={() => handleSwitchRecordType('time')}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                      recordType === 'time'
                        ? 'border-[#149CEA] bg-[#0C7EC8] text-white'
                        : 'border-white/15 bg-[#080A0C] text-[#B4BCC6] hover:text-white'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Tempo (WOD)</span>
                  </button>
                </div>
              </div>

              <div>
                <label
                  id="pr-movement-label"
                  htmlFor="pr-movement"
                  className="block text-xs font-medium text-[#D1D5DB]"
                >
                  {recordType === 'weight'
                    ? 'Movimento / Levantamento'
                    : 'Treino / Benchmark'}
                </label>
                <select
                  id="pr-movement"
                  aria-labelledby="pr-movement-label"
                  aria-describedby="pr-form-desc"
                  value={prMovement}
                  onChange={(e) => setPrMovement(e.target.value)}
                  className="mt-1 w-full rounded-md border border-white/15 bg-[#080A0C] px-3 py-2 text-sm text-white focus:border-[#149CEA] focus:outline-none"
                >
                  {movementPresets.map((mov) => (
                    <option key={mov} value={mov}>
                      {mov}
                    </option>
                  ))}
                  <option value="Outro">
                    {recordType === 'weight'
                      ? 'Outro movimento...'
                      : 'Outro treino / WOD...'}
                  </option>
                </select>
              </div>

              {prMovement === 'Outro' && (
                <div>
                  <label
                    id="pr-custom-movement-label"
                    htmlFor="pr-custom-movement"
                    className="block text-xs font-medium text-[#D1D5DB]"
                  >
                    {recordType === 'weight'
                      ? 'Nome do Movimento'
                      : 'Nome do Treino / Benchmark'}
                  </label>
                  <input
                    id="pr-custom-movement"
                    type="text"
                    required
                    maxLength={60}
                    aria-labelledby="pr-custom-movement-label"
                    aria-describedby="pr-form-desc"
                    placeholder={
                      recordType === 'weight'
                        ? 'Ex: Push Jerk ou Power Clean'
                        : 'Ex: Diane ou Corrida 2km'
                    }
                    value={customMovement}
                    onChange={(e) => setCustomMovement(e.target.value)}
                    className="mt-1 w-full rounded-md border border-white/15 bg-[#080A0C] px-3 py-2 text-sm text-white placeholder-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                  />
                </div>
              )}

              {recordType === 'weight' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      id="pr-weight-label"
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
                      aria-labelledby="pr-weight-label"
                      aria-describedby="pr-form-desc"
                      placeholder="Ex: 100"
                      value={prWeight}
                      onChange={(e) => setPrWeight(e.target.value)}
                      className="mt-1 w-full rounded-md border border-white/15 bg-[#080A0C] px-3 py-2 text-sm text-white tabular-nums placeholder-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      id="pr-reps-label"
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
                      aria-labelledby="pr-reps-label"
                      aria-describedby="pr-form-desc"
                      value={prReps}
                      onChange={(e) => setPrReps(e.target.value)}
                      className="mt-1 w-full rounded-md border border-white/15 bg-[#080A0C] px-3 py-2 text-sm text-white tabular-nums focus:border-[#149CEA] focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    id="pr-time-label"
                    htmlFor="pr-time"
                    className="block text-xs font-medium text-[#D1D5DB]"
                  >
                    Tempo Final (MM:SS ou H:MM:SS)
                  </label>
                  <input
                    id="pr-time"
                    type="text"
                    required
                    maxLength={12}
                    aria-labelledby="pr-time-label"
                    aria-describedby="pr-form-desc"
                    placeholder="Ex: 04:15 ou 39:40"
                    value={prTime}
                    onChange={(e) => setPrTime(e.target.value)}
                    className="mt-1 w-full rounded-md border border-white/15 bg-[#080A0C] px-3 py-2 text-sm text-white tabular-nums placeholder-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label
                  id="pr-date-label"
                  htmlFor="pr-date"
                  className="block text-xs font-medium text-[#D1D5DB]"
                >
                  Data do Recorde
                </label>
                <input
                  id="pr-date"
                  type="date"
                  required
                  aria-labelledby="pr-date-label"
                  aria-describedby="pr-form-desc"
                  value={prDate}
                  onChange={(e) => setPrDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-white/15 bg-[#080A0C] px-3 py-2 text-sm text-white tabular-nums focus:border-[#149CEA] focus:outline-none"
                />
              </div>

              <div>
                <label
                  id="pr-notes-label"
                  htmlFor="pr-notes"
                  className="block text-xs font-medium text-[#D1D5DB]"
                >
                  Observações (opcional)
                </label>
                <input
                  id="pr-notes"
                  type="text"
                  maxLength={180}
                  aria-labelledby="pr-notes-label"
                  aria-describedby="pr-form-desc"
                  placeholder={
                    recordType === 'weight'
                      ? 'Ex: Sem cinto, execução limpa'
                      : 'Ex: RX com colete 9kg / Unbroken'
                  }
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
                  aria-labelledby="pr-submit-label"
                  aria-describedby="pr-form-heading pr-form-desc"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[#0C7EC8] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA] disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span id="pr-submit-label">
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
          <div className="rounded-xl border border-white/10 bg-[#0F1318] p-6">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                  Meus Melhores Recordes
                </h3>
                <p className="text-xs text-[#9AA3AF]">
                  Maior carga (kg) e menor tempo por treino
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="group"
                  aria-label="Filtrar tipo de recorde"
                  className="inline-flex rounded-md border border-white/15 bg-[#080A0C] p-0.5"
                >
                  {(
                    [
                      { id: 'all', label: 'Todos' },
                      { id: 'weight', label: 'Cargas' },
                      { id: 'time', label: 'Tempos' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setPrTypeFilter(opt.id);
                        setPrFilterMovement('Todos');
                      }}
                      className={`rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                        prTypeFilter === opt.id
                          ? 'bg-[#0C7EC8] text-white'
                          : 'text-[#B4BCC6] hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label htmlFor="pr-filter-select" className="sr-only">
                    Filtrar histórico por exercício ou treino
                  </label>
                  <select
                    id="pr-filter-select"
                    value={prFilterMovement}
                    onChange={(e) => setPrFilterMovement(e.target.value)}
                    className="rounded-md border border-white/15 bg-[#080A0C] px-3 py-1.5 text-xs font-medium text-white focus:border-[#149CEA] focus:outline-none"
                  >
                    <option value="Todos">Todos os exercícios</option>
                    {Array.from(
                      new Set(bestPrByMovement.map((item) => item.movement))
                    ).map((mov) => (
                      <option key={mov} value={mov}>
                        {mov}
                      </option>
                    ))}
                  </select>
                </div>
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
                  {prs.length > 0
                    ? 'Nenhum recorde encontrado nesta categoria.'
                    : 'Você ainda não registrou nenhum PR.'}
                </p>
                <p className="mt-1 text-xs text-[#9AA3AF]">
                  {prs.length > 0
                    ? 'Altere o filtro acima ou adicione um novo recorde ao lado.'
                    : 'Use o formulário ao lado para salvar seu primeiro recorde de carga (Snatch, Clean & Jerk, Back Squat) ou tempo (Fran, Murph...).'}
                </p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {bestPrByMovement.map((best) => (
                  <button
                    key={`${best.recordType}-${best.movement}`}
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
                    {best.recordType === 'weight' ? (
                      <>
                        <p className="mt-1 font-display text-2xl font-extrabold text-white tabular-nums">
                          {best.weightKg}{' '}
                          <span className="text-sm font-semibold text-[#29A8F5]">
                            kg
                          </span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#9AA3AF] tabular-nums">
                          {best.reps} RM · {formatDatePtBr(best.recordedDate)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-1 font-display text-2xl font-extrabold text-white tabular-nums">
                          {best.timeDisplay}{' '}
                          <span className="text-xs font-semibold uppercase text-[#29A8F5]">
                            min
                          </span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#9AA3AF] tabular-nums">
                          Tempo · {formatDatePtBr(best.recordedDate)}
                        </p>
                      </>
                    )}
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
                          {pr.recordType === 'weight' ? (
                            <>
                              <span className="ml-1.5 font-display text-base font-bold text-[#29A8F5] tabular-nums">
                                {pr.weightKg} kg
                              </span>{' '}
                              <span className="text-xs font-normal text-[#9AA3AF] tabular-nums">
                                ({pr.reps} RM)
                              </span>
                            </>
                          ) : (
                            <span className="ml-1.5 font-display text-base font-bold text-[#29A8F5] tabular-nums">
                              {pr.timeDisplay}
                            </span>
                          )}
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
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeletePr(pr.id)}
                          aria-label={`Excluir PR de ${pr.movement}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/10 text-[#9AA3AF] transition-colors hover:border-red-400/50 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
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
    </div>
  );
}
