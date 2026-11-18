import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../services/firebase';

export type UserRole = 'aluno' | 'coach';

export interface UserProfile {
  uid: string;
  name: string;
  photoURL: string;
  role: UserRole;
}

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  authReady: boolean;
  authBusy: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      setUser(firebaseUser);

      if (!firebaseUser) {
        setUserProfile(null);
        setAuthReady(true);
        return;
      }

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userPath = `users/${firebaseUser.uid}`;
      const safeName = (
        firebaseUser.displayName ||
        firebaseUser.email?.split('@')[0] ||
        'Atleta Ebber'
      )
        .trim()
        .slice(0, 100);
      const safePhoto = (firebaseUser.photoURL || '').slice(0, 500);

      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            name: safeName,
            photoURL: safePhoto,
            role: 'aluno',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const existingData = snap.data();
          if (
            existingData.name !== safeName ||
            existingData.photoURL !== safePhoto
          ) {
            await updateDoc(userRef, {
              name: safeName,
              photoURL: safePhoto,
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const isOfflineErr =
          errMsg.includes('offline') || errMsg.includes('unavailable');
        if (!isOfflineErr) {
          try {
            handleFirestoreError(err, OperationType.WRITE, userPath);
          } catch {
            setAuthError(
              'Não foi possível sincronizar seu perfil no Firestore. Verifique as permissões do projeto.'
            );
          }
        }
      }

      const isBootstrapCoach =
        firebaseUser.email?.toLowerCase() === 'guilhermecontas78@gmail.com' &&
        firebaseUser.emailVerified;

      unsubscribeProfile = onSnapshot(
        userRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile({
              uid: String(data.uid || firebaseUser.uid),
              name: String(data.name || safeName),
              photoURL: String(data.photoURL || safePhoto),
              role:
                data.role === 'coach' || isBootstrapCoach ? 'coach' : 'aluno',
            });
          } else {
            setUserProfile({
              uid: firebaseUser.uid,
              name: safeName,
              photoURL: safePhoto,
              role: isBootstrapCoach ? 'coach' : 'aluno',
            });
          }
          setAuthReady(true);
        },
        (err) => {
          try {
            handleFirestoreError(err, OperationType.GET, userPath);
          } catch {
            setUserProfile({
              uid: firebaseUser.uid,
              name: safeName,
              photoURL: safePhoto,
              role: isBootstrapCoach ? 'coach' : 'aluno',
            });
            setAuthReady(true);
          }
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError(null);
      } else if (code === 'auth/popup-blocked') {
        setAuthError(
          'O navegador bloqueou a janela de login. Permita pop-ups e tente novamente.'
        );
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError(
          'Este domínio ainda precisa ser autorizado no Firebase Authentication.'
        );
      } else {
        setAuthError(
          'Não foi possível entrar com sua conta Google agora. Tente novamente.'
        );
      }
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOut(auth);
    } catch {
      setAuthError('Erro ao encerrar a sessão.');
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const contextValue = useMemo(
    () => ({
      user,
      userProfile,
      authReady,
      authBusy,
      authError,
      signInWithGoogle,
      logout,
      clearAuthError,
    }),
    [
      user,
      userProfile,
      authReady,
      authBusy,
      authError,
      signInWithGoogle,
      logout,
      clearAuthError,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return ctx;
}
