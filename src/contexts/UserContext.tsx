import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profileDoc = await getDoc(doc(db, 'users', u.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email || '',
            role: 'client',
            permissions: defaultClientPermissions,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', u.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
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
