import { Check, Flame, LogIn, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStreak } from '../contexts/StreakContext';

export function StreakCard() {
  const { user, userProfile, authBusy, signInWithGoogle } = useAuth();
  const {
    currentStreak,
    bestStreak,
    totalActiveDays,
    isLitToday,
    hasWorkoutToday,
    streakLevelTitle,
    weekDays,
    justLitMessage,
    clearJustLitMessage,
  } = useStreak();

  if (!user) {
    return (
      <div className="mt-6 rounded-xl border border-white/10 bg-[#0F1318] p-5 sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#FF6B00]/30 bg-[#FF6B00]/10 text-[#FF8C1A]">
              <Flame className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                Acenda seu Foguinho de Treino
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-[#B4BCC6]">
                Entre com sua conta Google todos os dias ou registre seu WOD e
                PRs para manter sua ofensiva acesa no box.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={authBusy}
            onClick={() => void signInWithGoogle()}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#0C7EC8] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA] disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span>{authBusy ? 'Conectando...' : 'Entrar e Acender'}</span>
          </button>
        </div>
      </div>
    );
  }

  const firstName =
    (userProfile?.name || user.displayName || 'Atleta').trim().split(/\s+/)[0];

  return (
    <div
      aria-labelledby="streak-card-heading"
      className="mt-6 rounded-xl border border-[#FF7A00]/30 bg-gradient-to-br from-[#16120E] via-[#0F1318] to-[#0B0E12] p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Esquerda: Chama + Contador de Ofensiva */}
        <div className="flex items-start gap-4 sm:items-center">
          <div
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border transition-all ${
              isLitToday
                ? 'border-[#FF7A00]/60 bg-gradient-to-br from-[#FF6B00]/30 to-[#FF9F1C]/15 text-[#FF8C1A] shadow-[0_0_24px_rgba(255,107,0,0.28)]'
                : 'border-white/15 bg-[#12161B] text-[#6B7280]'
            }`}
          >
            <Flame
              className={`h-7 w-7 ${isLitToday ? 'fill-[#FF6B00] text-[#FFB347]' : ''}`}
              aria-hidden="true"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id="streak-card-heading"
                className="font-display text-2xl font-extrabold uppercase tracking-tight text-white tabular-nums"
              >
                {currentStreak}{' '}
                {currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
              </h3>
              <span className="rounded border border-[#FF7A00]/40 bg-[#FF6B00]/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#FFB347]">
                {streakLevelTitle}
              </span>
            </div>

            <p className="mt-1 text-xs leading-relaxed text-[#D1D5DB]">
              {hasWorkoutToday ? (
                <span>
                  <strong className="text-[#FFB347]">Fogo máximo hoje!</strong>{' '}
                  {firstName}, seu acesso e treino/PR já contaram na ofensiva.
                </span>
              ) : isLitToday ? (
                <span>
                  <strong className="text-[#FFB347]">Foguinho aceso hoje!</strong>{' '}
                  {firstName}, registre também seu WOD ou PR para completar o
                  dia.
                </span>
              ) : (
                <span>
                  Entre ou registre seu treino para não perder a sequência.
                </span>
              )}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#9AA3AF] tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-[#FFB347]" aria-hidden="true" />
                Recorde pessoal: <strong className="text-white">{bestStreak} dias</strong>
              </span>
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-[#29A8F5]" aria-hidden="true" />
                Total ativo: <strong className="text-white">{totalActiveDays} {totalActiveDays === 1 ? 'dia' : 'dias'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Direita: Barra Semanal Estilo Duolingo / Smart Fit */}
        <div
          aria-label="Frequência semanal do foguinho"
          className="grid grid-cols-7 gap-2 rounded-lg border border-white/10 bg-[#080A0C]/80 p-3 sm:gap-2.5"
        >
          {weekDays.map((day) => (
            <div
              key={day.date}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  day.isToday ? 'text-[#FFB347]' : 'text-[#9AA3AF]'
                }`}
              >
                {day.shortLabel}
              </span>

              <div
                title={
                  day.hasWorkout
                    ? `${day.shortLabel}: Treino/PR registrado`
                    : day.isActive
                      ? `${day.shortLabel}: Foguinho aceso`
                      : `${day.shortLabel}: Sem registro`
                }
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  day.hasWorkout
                    ? 'border-[#FF8C1A] bg-gradient-to-br from-[#FF6B00] to-[#FF9F1C] text-white shadow-[0_0_12px_rgba(255,107,0,0.4)]'
                    : day.isActive
                      ? 'border-[#FF7A00]/70 bg-[#FF6B00]/20 text-[#FFB347]'
                      : day.isFuture
                        ? 'border-dashed border-white/10 bg-transparent text-white/20'
                        : 'border-white/15 bg-[#12161B] text-[#4B5563]'
                }`}
              >
                {day.hasWorkout ? (
                  <Check className="h-4 w-4 stroke-[2.75]" aria-hidden="true" />
                ) : (
                  <Flame
                    className={`h-4 w-4 ${day.isActive ? 'fill-[#FF7A00]' : ''}`}
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {justLitMessage && (
        <div
          role="status"
          className="mt-4 flex items-center justify-between gap-3 rounded-md border border-[#FF7A00]/35 bg-[#FF6B00]/10 px-3.5 py-2 text-xs font-medium text-[#FFD39E]"
        >
          <span className="inline-flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 fill-[#FF7A00] text-[#FFB347]" aria-hidden="true" />
            {justLitMessage}
          </span>
          <button
            type="button"
            onClick={clearJustLitMessage}
            className="font-bold text-white/80 underline hover:text-white"
          >
            Ok
          </button>
        </div>
      )}
    </div>
  );
}
