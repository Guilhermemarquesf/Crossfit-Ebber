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

interface PrDoc {
  id: string;
  userId: string;
  movement: string;
  weightKg: number;
  reps: number;
  recordedDate: string;
  notes: string;
}

const PR_MOVEMENTS = [
  'Snatch',
  'Clean & Jerk',
  'Back Squat',
  'Deadlift',
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

export function PersonalRecordsManager() {
  const { user, userProfile, authReady, authBusy, signInWithGoogle } =
    useAuth();
  const { currentStreak, markActiveDate } = useStreak();

  const [prs, setPrs] = useState<PrDoc[]>([]);
  const [prsLoading, setPrsLoading] = useState(false);
  const [prsError, setPrsError] = useState<string | null>(null);
  const [editingPrId, setEditingPrId] = useState<string | null>(null);
  const [prMovement, setPrMovement] = useState<string>('Snatch');
  const [customMovement, setCustomMovement] = useState<string>('');
  const [prWeight, setPrWeight] = useState<string>('');
  const [prReps, setPrReps] = useState<string>('1');
  const [prDate, setPrDate] = useState<string>(getTodayDateString);
  const [prNotes, setPrNotes] = useState<string>('');
  const [prSaving, setPrSaving] = useState(false);
  const [prFeedback, setPrFeedback] = useState<string | null>(null);
  const [prFilterMovement, setPrFilterMovement] = useState<string>('Todos');

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

  // Melhores marcas por movimento
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
          markActiveDate(prDate, 'workout');
          setPrFeedback('PR atualizado no seu perfil!');
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
          markActiveDate(prDate, 'workout');
          setPrFeedback('Novo PR salvo na sua ficha e foguinho atualizado!');
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
          Entre com sua conta Google para acessar seu perfil de atleta, acender
          seu foguinho diário e registrar suas cargas máximas em Snatch, Clean
          &amp; Jerk, Back Squat e Deadlift.
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
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`Foto de ${displayName}`}
              referrerPolicy="no-referrer"
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
                  {editingPrId ? 'Editar PR' : 'Registrar Novo PR'}
                </h3>
                <p id="pr-form-desc" className="text-xs text-[#9AA3AF]">
                  Adicione, edite ou exclua suas cargas máximas na coleção prs.
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
                  Use o formulário ao lado para salvar seu primeiro recorde
                  pessoal (Snatch, Clean &amp; Jerk, Back Squat, Deadlift...).
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
