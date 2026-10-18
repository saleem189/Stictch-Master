import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';
import { onAuthStateChanged } from 'firebase/auth';

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  isClient: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const defaultClientPermissions = {
  canEditMeasurements: false,
  canApprovePayroll: false,
  canProcessPayments: false,
  canAdjustInventory: false,
  canDeleteOrders: false,
  canViewFinancialReports: false,
  canManageEmployees: false,
  canManageSystemSettings: false,
  canManageInventory: false,
  canManageClients: false,
  canManageAccounting: false,
  canManageOrders: false,
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let requestVersion = 0;
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      const currentRequest = ++requestVersion;
      setUser(u);
      setLoading(true);

      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }

      void (async () => {
        try {
          const profileRef = doc(db, 'users', u.uid);
          const cachedProfile = await getDoc(profileRef);
          const resolvedProfile = cachedProfile.exists()
            ? cachedProfile.data() as UserProfile
            : await runTransaction(db, async transaction => {
              const profileDoc = await transaction.get(profileRef);
              if (profileDoc.exists()) return profileDoc.data() as UserProfile;

              const newProfile: UserProfile = {
                uid: u.uid,
                email: u.email || '',
                role: 'client',
                permissions: defaultClientPermissions,
                createdAt: new Date().toISOString(),
              };
              transaction.set(profileRef, newProfile);
              return newProfile;
            });

          if (isMounted && currentRequest === requestVersion) setProfile(resolvedProfile);
        } catch (error) {
          if (isMounted && currentRequest === requestVersion) {
            setProfile(null);
            console.error(
              'Unable to load the signed-in user profile.',
              error instanceof Error ? error.message : 'Unknown error'
            );
          }
        } finally {
          if (isMounted && currentRequest === requestVersion) setLoading(false);
        }
      })();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isEmployee: profile?.role === 'employee',
    isClient: profile?.role === 'client'
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
