'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { z } from 'zod';
import { LogIn, Mail, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

// Define schemas outside component to prevent recreation
const emailSchema = z.string().email({ message: 'Indirizzo email non valido' });
const passwordSchema = z.string().min(6, { message: 'La password deve contenere almeno 6 caratteri' });
const loginSchema = z.object({ email: emailSchema, password: passwordSchema });
const signupSchema = z.object({ email: emailSchema, password: passwordSchema });

// Memoized Google Icon Component to prevent re-renders
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

// Loading Spinner Component
const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
);

export default function AuthPage() {
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [firebaseError, setFirebaseError] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    const { user, loading: authLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordResetEmail } = useAuth();
    const router = useRouter();

    // Redirect if user is already logged in
    useEffect(() => {
        if (!authLoading && user) {
            if (!user.isComplete) {
                router.push('/profile');
            } else {
                router.push('/shop');
            }
        }
    }, [user, authLoading, router]);

    // Memoized computed values to prevent unnecessary calculations
    const isPageBusy = useMemo(() => authLoading || loading, [authLoading, loading]);

    // Memoized error mapping function
    const getFirebaseErrorMessage = useCallback((errorCode) => {
        switch (errorCode) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'Email o password non corrette.';
            case 'auth/email-already-in-use':
                return 'Questa email è già stata registrata.';
            case 'auth/popup-closed-by-user':
                return 'Accesso annullato.';
            case 'auth/popup-blocked':
                return 'Popup bloccato dal browser. Abilita i popup e riprova.';
            case 'auth/cancelled-popup-request':
                return 'Richiesta di accesso annullata.';
            default:
                return 'Si è verificato un errore. Riprova.';
        }
    }, []);

    // Optimized input change handler with useCallback
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear specific field error on change
        setErrors(prev => {
            if (prev[name]) {
                const { [name]: removed, ...rest } = prev;
                return rest;
            }
            return prev;
        });
    }, []);

    // Optimized form submission handler
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true);
        setFirebaseError('');
        setErrors({});

        const schema = mode === 'login' ? loginSchema : signupSchema;
        const validation = schema.safeParse(formData);

        if (!validation.success) {
            const fieldErrors = {};
            validation.error.issues.forEach(issue => {
                fieldErrors[issue.path[0]] = issue.message;
            });
            setErrors(fieldErrors);
            setLoading(false);
            return;
        }

        try {
            if (mode === 'login') {
                await signInWithEmail(formData.email, formData.password);
            } else {
                await signUpWithEmail(formData.email, formData.password);
            }
            router.push('/profile');
        } catch (err) {
            setFirebaseError(getFirebaseErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    }, [mode, formData, signInWithEmail, signUpWithEmail, router, getFirebaseErrorMessage]);

    // Optimized password reset handler
    const handlePasswordReset = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true);
        setFirebaseError('');
        setResetSuccess(false);
        setErrors({});

        const validation = emailSchema.safeParse(formData.email);
        if (!validation.success) {
            setErrors({ email: validation.error.issues[0].message });
            setLoading(false);
            return;
        }

        try {
            await sendPasswordResetEmail(formData.email);
            setResetSuccess(true);
        } catch (err) {
            setFirebaseError('Impossibile inviare l\'email. Controlla che l\'indirizzo sia corretto.');
        } finally {
            setLoading(false);
        }
    }, [formData.email, sendPasswordResetEmail]);

    // Fixed Google Sign In handler with proper error handling
    const handleGoogleSignIn = useCallback(async () => {
        setLoading(true);
        setFirebaseError('');

        try {
            await signInWithGoogle();
            router.push('/profile');
        } catch (err) {
            console.error('Google sign-in error:', err);
            setFirebaseError(getFirebaseErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    }, [signInWithGoogle, router, getFirebaseErrorMessage]);

    // Optimized mode switching with useCallback
    const switchMode = useCallback((newMode) => {
        setMode(newMode);
        setFormData({ email: '', password: '' });
        setErrors({});
        setFirebaseError('');
        setResetSuccess(false);
    }, []);

    // Memoized form components to prevent unnecessary re-renders
    const AuthForm = useMemo(() => (
        <>
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                    {mode === 'login' ? 
                        <LogIn className="w-8 h-8 text-blue-400" /> : 
                        <UserPlus className="w-8 h-8 text-blue-400" />
                    }
                </div>
                <h1 className="text-3xl font-bold text-gray-200 mb-2">
                    {mode === 'login' ? 'Accedi' : 'Registrati'}
                </h1>
                <p className="text-gray-400">
                    {mode === 'login' ? 'Accedi al tuo account' : 'Crea un nuovo account'}
                </p>
            </div>

            <div className="space-y-4 mb-6">
                <button
                    onClick={handleGoogleSignIn}
                    disabled={isPageBusy}
                    className="w-full flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 text-gray-200 p-3 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                    <GoogleIcon />
                    Continua con Google
                </button>
            </div>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-400/30" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-black/30 text-gray-400">o</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={isPageBusy}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-black/20 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-500/20 transition-colors ${errors.email ? 'border-red-500/80' : 'border-gray-400/50'
                                }`}
                            placeholder="tua@email.com"
                            autoComplete="email"
                        />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <div className="relative">
                        <LogIn className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            disabled={isPageBusy}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-black/20 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-500/20 transition-colors ${errors.password ? 'border-red-500/80' : 'border-gray-400/50'
                                }`}
                            placeholder="Password"
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        />
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isPageBusy}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-lg"
                >
                    {loading ? <LoadingSpinner /> : (mode === 'login' ? 'Accedi' : 'Registrati')}
                </button>
            </form>

            <div className="flex justify-between items-center mt-6 text-sm">
                <button
                    onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-blue-400 hover:text-blue-300 hover:underline disabled:opacity-50 transition-colors"
                    disabled={isPageBusy}
                >
                    {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
                </button>
                {mode === 'login' && (
                    <button
                        onClick={() => switchMode('reset')}
                        className="text-gray-400 hover:text-gray-300 hover:underline disabled:opacity-50 transition-colors"
                        disabled={isPageBusy}
                    >
                        Password dimenticata?
                    </button>
                )}
            </div>
        </>
    ), [mode, formData, errors, isPageBusy, loading, handleSubmit, handleInputChange, handleGoogleSignIn, switchMode]);

    const ResetForm = useMemo(() => (
        <>
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-200 mb-2">Recupera Password</h1>
                <p className="text-gray-400">Inserisci la tua email per ricevere un link di recupero.</p>
            </div>

            {resetSuccess ? (
                <div className="p-4 bg-green-500/20 border border-green-500/30 text-green-300 rounded-lg text-center flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Email di recupero inviata!
                </div>
            ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={isPageBusy}
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-black/20 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-500/20 transition-colors ${errors.email ? 'border-red-500/80' : 'border-gray-400/50'
                                    }`}
                                placeholder="tua@email.com"
                                autoComplete="email"
                            />
                        </div>
                        {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isPageBusy}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-lg"
                    >
                        {loading ? <LoadingSpinner /> : 'Invia Email di Recupero'}
                    </button>
                </form>
            )}

            <div className="text-center mt-6">
                <button
                    onClick={() => switchMode('login')}
                    className="text-blue-400 hover:text-blue-300 hover:underline disabled:opacity-50 transition-colors"
                    disabled={isPageBusy}
                >
                    Torna al Login
                </button>
            </div>
        </>
    ), [formData.email, errors.email, isPageBusy, loading, resetSuccess, handlePasswordReset, handleInputChange, switchMode]);

    // Show loading spinner while auth is initializing
    if (authLoading && !user) {
        return (
            <div className="h-100% flex items-center align-middle justify-center text-gray-200">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="h-100% content-center text-gray-200 flex align-middle items-start  justify-center mt-12 sm:pt-0 sm:items-center p-4">
            <div className="max-w-md w-full bg-black/30 backdrop-blur-lg rounded-2xl shadow-lg border border-white/10 p-8">
                {firebaseError && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        {firebaseError}
                    </div>
                )}
                {mode === 'reset' ? ResetForm : AuthForm}
            </div>
        </div>
    );
}