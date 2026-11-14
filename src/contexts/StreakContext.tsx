import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { OperationType, db, handleFirestoreError } from '../services/firebase';

export interface WeekDayStatus {
  date: string;
  shortLabel: string;
  isActive: boolean;
  hasWorkout: boolean;
  isToday: boolean;
  isFuture: boolean;
}

interface StreakContextValue {
  currentStreak: number;
  bestStreak: number;
  totalActiveDays: number;
  isLitToday: boolean;
  hasWorkoutToday: boolean;
  streakLevelTitle: string;
  weekDays: WeekDayStatus[];
  justLitMessage: string | null;
  markActiveDate: (dateStr?: string, reason?: 'visit' | 'workout') => void;
  clearJustLitMessage: () => void;
}

const StreakContext = createContext<StreakContextValue | null>(null);

function formatLocalYyyyMmDd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayLocalDate(): string {
  return formatLocalYyyyMmDd(new Date());
}

function addDaysToYyyyMmDd(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return formatLocalYyyyMmDd(dt);
}

function computeBestStreak(sortedUniqueDates: string[]): number {
  if (sortedUniqueDates.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedUniqueDates.length; i++) {
    const expectedNext = addDaysToYyyyMmDd(sortedUniqueDates[i - 1], 1);
    if (sortedUniqueDates[i] === expectedNext) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}

function computeCurrentStreak(activeSet: Set<string>, today: string): number {
  if (activeSet.size === 0) return 0;
  let cursor = activeSet.has(today) ? today : addDaysToYyyyMmDd(today, -1);
  if (!activeSet.has(cursor)) return 0;

  let streak = 0;
  while (activeSet.has(cursor)) {
    streak += 1;
    cursor = addDaysToYyyyMmDd(cursor, -1);
  }
  return streak;
}

function getLevelTitle(streak: number): string {
  if (streak >= 30) return 'Lenda do Box';
  if (streak >= 14) return 'Atleta Em Chamas';
  if (streak >= 7) return 'Semana Imbatível';
  if (streak >= 3) return 'Em Ritmo de Box';
  if (streak >= 1) return 'Fagulha Acesa';
  return 'Acenda seu Fogo';
}

const WEEKDAY_SHORT_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function readStoredDates(storageKey: string): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is string =>
        typeof item === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item)
    );
  } catch {
    return [];
  }
}

function writeStoredDates(storageKey: string, dates: string[]): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(dates));
  } catch {
    // Ignora falha caso localStorage esteja indisponível
  }
}

export function StreakProvider({ children }: { children: ReactNode }) {
  const { user, authReady } = useAuth();

  const [visitDates, setVisitDates] = useState<string[]>([]);
  const [scoreDates, setScoreDates] = useState<string[]>([]);
  const [prDates, setPrDates] = useState<string[]>([]);
  const [justLitMessage, setJustLitMessage] = useState<string | null>(null);

  const today = getTodayLocalDate();

  // Ao autenticar, registra automaticamente a visita de hoje para acender o foguinho
  useEffect(() => {
    if (!authReady || !user) {
      setVisitDates([]);
      setScoreDates([]);
      setPrDates([]);
      setJustLitMessage(null);
      return;
    }

    const storageKey = `cf_ebber_streak_${user.uid}`;
    const existing = readStoredDates(storageKey);
    const hasTodayAlready = existing.includes(today);
    const updated = hasTodayAlready
      ? existing
      : Array.from(new Set([...existing, today])).sort();

    if (!hasTodayAlready) {
      writeStoredDates(storageKey, updated);
      setJustLitMessage('Foguinho aceso hoje! Bom treino no box.');
    }

    setVisitDates(updated);
  }, [authReady, user, today]);

  // Escuta resultados de WOD do usuário no Firestore para contabilizar dias de treino
  useEffect(() => {
    if (!authReady || !user) return;

    const qScores = query(
      collection(db, 'scores'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      qScores,
      (snapshot) => {
        const dates = snapshot.docs
          .map((d) => String(d.data().wodDate || ''))
          .filter((dt) => /^\d{4}-\d{2}-\d{2}$/.test(dt));
        setScoreDates(Array.from(new Set(dates)));
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'scores');
        } catch {
          // Mantém dados locais caso ocorra falha de permissão
        }
      }
    );

    return () => unsubscribe();
  }, [authReady, user]);

  // Escuta PRs do usuário no Firestore para contabilizar dias de recordes
  useEffect(() => {
    if (!authReady || !user) return;

    const qPrs = query(collection(db, 'prs'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      qPrs,
      (snapshot) => {
        const dates = snapshot.docs
          .map((d) => String(d.data().recordedDate || ''))
          .filter((dt) => /^\d{4}-\d{2}-\d{2}$/.test(dt));
        setPrDates(Array.from(new Set(dates)));
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'prs');
        } catch {
          // Mantém dados locais caso ocorra falha de permissão
        }
      }
    );

    return () => unsubscribe();
  }, [authReady, user]);

  const markActiveDate = useCallback(
    (dateStr?: string, reason: 'visit' | 'workout' = 'workout') => {
      if (!user) return;
      const targetDate =
        dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : getTodayLocalDate();
      const storageKey = `cf_ebber_streak_${user.uid}`;

      setVisitDates((prev) => {
        const next = Array.from(new Set([...prev, targetDate])).sort();
        writeStoredDates(storageKey, next);
        return next;
      });

      if (reason === 'workout') {
        setJustLitMessage('Treino registrado e foguinho reforçado hoje!');
      } else {
        setJustLitMessage('Foguinho aceso hoje! Bom treino no box.');
      }
    },
    [user]
  );

  const computed = useMemo(() => {
    const workoutSet = new Set([...scoreDates, ...prDates]);
    const activeSet = new Set([...visitDates, ...scoreDates, ...prDates]);
    const sortedActive = Array.from(activeSet).sort();

    const currentStreak = computeCurrentStreak(activeSet, today);
    const bestStreak = Math.max(
      computeBestStreak(sortedActive),
      currentStreak
    );
    const isLitToday = activeSet.has(today);
    const hasWorkoutToday = workoutSet.has(today);

    // Constrói os 7 dias da semana atual (Segunda a Domingo)
    const now = new Date();
    const jsDay = now.getDay(); // 0 = Dom, 1 = Seg ... 6 = Sáb
    const offsetFromMonday = jsDay === 0 ? -6 : 1 - jsDay;
    const mondayDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offsetFromMonday
    );

    const weekDays: WeekDayStatus[] = WEEKDAY_SHORT_LABELS.map(
      (shortLabel, idx) => {
        const dayObj = new Date(
          mondayDate.getFullYear(),
          mondayDate.getMonth(),
          mondayDate.getDate() + idx
        );
        const dateKey = formatLocalYyyyMmDd(dayObj);
        return {
          date: dateKey,
          shortLabel,
          isActive: activeSet.has(dateKey),
          hasWorkout: workoutSet.has(dateKey),
          isToday: dateKey === today,
          isFuture: dateKey > today,
        };
      }
    );

    return {
      currentStreak,
      bestStreak,
      totalActiveDays: activeSet.size,
      isLitToday,
      hasWorkoutToday,
      streakLevelTitle: getLevelTitle(currentStreak),
      weekDays,
    };
  }, [visitDates, scoreDates, prDates, today]);

  return (
    <StreakContext.Provider
      value={{
        ...computed,
        justLitMessage,
        markActiveDate,
        clearJustLitMessage: () => setJustLitMessage(null),
      }}
    >
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  const ctx = useContext(StreakContext);
  if (!ctx) {
    throw new Error('useStreak deve ser usado dentro de StreakProvider.');
  }
  return ctx;
}
