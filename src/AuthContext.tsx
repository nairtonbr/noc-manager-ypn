import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'user' | 'pending' | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | 'pending' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check role in Firestore
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('./firebase');
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role || 'pending');
          } else {
            // Default admin for the main user
            const isDefaultAdmin = user.email?.toLowerCase() === "nairtonbraga00@gmail.com";
            const newRole = isDefaultAdmin ? 'admin' : 'pending';
            setRole(newRole);
            
            // Create the user doc
            const { setDoc } = await import('firebase/firestore');
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              displayName: user.displayName,
              role: newRole,
              createdAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error("Error fetching role:", error);
          setRole('pending');
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
