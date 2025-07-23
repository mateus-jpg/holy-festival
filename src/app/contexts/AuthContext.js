'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, facebookProvider, db } from '@/app/lib/firebase';

/* interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (profile: Partial<User>) => Promise<void>;
} */

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log(firebaseUser)
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({
            uid: firebaseUser.uid,
            ...userDoc.data(),
            createdAt: userDoc.data().createdAt?.toDate(),
            updatedAt: userDoc.data().updatedAt?.toDate()
          });
        } else {
          // Create new user document
          const newUser = {
            email: firebaseUser.email,
            isAdmin: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser({ uid: firebaseUser.uid, ...newUser });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);


  const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
  const signInWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signOut = () => firebaseSignOut(auth);
  const sendPasswordResetEmail = (email) => firebaseSendPasswordResetEmail(auth, email);

  const signUpWithEmail = async (email, password) => {
    await createUserWithEmailAndPassword(auth, email, password);

    await sendEmailVerification(userCredential.user);
    return userCredential;
  }



  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    } else {
      throw new Error("No user is currently signed in.");
    }
  };

  const updateUserProfile = async (profile) => {
    if (!user) return;

    const updatedData = {
      ...profile,
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
    setUser({ ...user, ...updatedData });
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};