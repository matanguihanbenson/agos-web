'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  validating: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  validating: false,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  const fetchUserData = async (userId: string): Promise<UserData | null> => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);
        return data;
      } else {
        setUserData(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(null);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        const data = await fetchUserData(user.uid);
        // Enforce admin-only session even if signed in elsewhere
        if (!data || data.role !== 'admin') {
          await signOut(auth);
          setUserData(null);
          setUser(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setValidating(true);
    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user data from Firestore
      const userDocRef = doc(db, 'users', credentials.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      let data: UserData | null = null;
      if (userDoc.exists()) {
        data = userDoc.data() as UserData;
      }

      // Restrict login to admin role only
      if (!data || data.role !== 'admin') {
        await signOut(auth);
        setUserData(null);
        setUser(null);
        throw new Error('Only admin accounts can sign in.');
      }
      
      // If we get here, user is admin - set the data
      setUserData(data);
      setUser(credentials.user);
    } finally {
      setValidating(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  const value = {
    user,
    userData,
    loading,
    validating,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
