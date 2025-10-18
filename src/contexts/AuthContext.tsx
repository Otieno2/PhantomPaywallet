import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth as firebaseAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, onAuthStateChanged } from '../config/firebase';
import { sendEmailLink, completeEmailLinkSignIn, isEmailLinkSignIn } from '../utils/emailLinkAuth';

// Mock User interface to match Firebase User
interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  currentUser: MockUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendEmailSignInLink: (email: string) => Promise<void>;
  completeEmailSignIn: (email?: string) => Promise<void>;
  isEmailLinkAuth: () => boolean;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock authentication for development
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Use Firebase onAuthStateChanged to manage user session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        // User is signed in
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
        // For demo purposes, also store in localStorage to simulate persistence across browser restarts
        localStorage.setItem('phantompay_user', JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName }));
      } else {
        // User is signed out
        setCurrentUser(null);
        localStorage.removeItem('phantompay_user');
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      // currentUser will be set by onAuthStateChanged listener
    } catch (error) {
      throw error; // Re-throw to be caught by UI
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      // currentUser will be set by onAuthStateChanged listener
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(firebaseAuth, provider);
      // currentUser will be set by onAuthStateChanged listener
    } catch (error) {
      throw error;
    }
  };

  const sendEmailSignInLink = async (email: string) => {
    try {
      await sendEmailLink(email);
    } catch (error) {
      throw error;
    }
  };

  const completeEmailSignIn = async (email?: string) => {
    try {
      await completeEmailLinkSignIn(email);
      // currentUser will be set by onAuthStateChanged listener
    } catch (error) {
      throw error;
    }
  };

  const isEmailLinkAuth = (): boolean => {
    return isEmailLinkSignIn();
  };
  const logout = async () => {
    try {
      await signOut(firebaseAuth);
      // currentUser will be set to null by onAuthStateChanged listener
    } catch (error) {
      throw error;
    }
  };


  const value = {
    currentUser,
    login,
    register,
    loginWithGoogle,
    sendEmailSignInLink,
    completeEmailSignIn,
    isEmailLinkAuth,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};