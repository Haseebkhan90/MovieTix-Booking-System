import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, hasFirebaseConfig } from '../lib/firebase';
import { profileFromData } from '../lib/firestore';
import { toApiError } from '../api/client';
import { AuthUser } from '../types';

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isStaff: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setUser(null);
      setLoading(false);
      return;
    }
    let unsubProfile: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      unsubProfile?.();
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      const ref = doc(db, 'users', fbUser.uid);
      unsubProfile = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) setUser(profileFromData(fbUser.uid, snap.data(), fbUser.email));
          else {
            setUser({
              id: fbUser.uid,
              email: fbUser.email ?? '',
              name: fbUser.displayName ?? 'Guest',
              role: 'CUSTOMER',
              tenantId: null,
            });
          }
          setLoading(false);
        },
        () => {
          setUser({
            id: fbUser.uid,
            email: fbUser.email ?? '',
            name: fbUser.displayName ?? 'Guest',
            role: 'CUSTOMER',
            tenantId: null,
          });
          setLoading(false);
        }
      );
    });
    return () => {
      unsubAuth();
      unsubProfile?.();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!hasFirebaseConfig) {
      throw toApiError({ code: 'auth/invalid-api-key' });
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    } catch (err) {
      throw toApiError(err);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    if (!hasFirebaseConfig) {
      throw toApiError({ code: 'auth/invalid-api-key' });
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      const existing = await getDoc(doc(db, 'users', cred.user.uid));
      if (!existing.exists()) {
        await setDoc(doc(db, 'users', cred.user.uid), {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role: 'CUSTOMER',
          tenantId: null,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      throw toApiError(err);
    }
  }, []);

  const logout = useCallback(async () => {
    if (hasFirebaseConfig) await signOut(auth);
    setUser(null);
  }, []);

  const isStaff = Boolean(user && ['STAFF', 'MANAGER', 'TENANT_ADMIN', 'PLATFORM_ADMIN'].includes(user.role));

  const value = useMemo(
    () => ({ user, loading, login, register, logout, isStaff }),
    [user, loading, login, register, logout, isStaff]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
