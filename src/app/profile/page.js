'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { formatCodiceFiscale } from '@/app/utils/codiceFiscale';
import { profileSchema } from '@/app/lib/validation'; // Import the schema
import { User, CreditCard, LogOut } from 'lucide-react';


export default function ProfilePage() {
  const { user, updateUserProfile, signOut } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    codiceFiscale: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        surname: user.surname || '',
        codiceFiscale: user.codiceFiscale || '',
      });
      setIsComplete(!!(user.name && user.surname && user.codiceFiscale));
    }
  }, [user]);

  const validateForm = () => {
    const newErrors= {};

    if (!formData.name.trim()) {
      newErrors.name = 'Il nome è richiesto';
    }

    if (!formData.surname.trim()) {
      newErrors.surname = 'Il cognome è richiesto';
    }

    if (!formData.codiceFiscale.trim()) {
      newErrors.codiceFiscale = 'Il codice fiscale è richiesto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const validation = profileSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path[0]] = issue.message;
      }
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      await updateUserProfile({
        ...validation.data,
        codiceFiscale: formatCodiceFiscale(validation.data.codiceFiscale),
      });
      setIsComplete(true);
    } catch (err) {
      setErrors({ general: err.message || 'Errore durante il salvataggio' });
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  if (!user) {
    router.push('/auth');
    return null;
  }

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200">
      {/* Header with glassmorphism effect, now sticky */}
      <header className="">
        <div className="max-w-2xl mx-auto p-4 rounded-xl bg-white/50 dark:bg-black/50 backdrop-blur-lg shadow-lg border border-white/20 dark:border-white/10">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Profilo Utente</h1>
            <div className="flex gap-4">
              {isComplete && (
                <button
                  onClick={() => router.push('/tickets')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <CreditCard className="w-4 h-4" />
                  Biglietti
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-md"
              >
                <LogOut className="w-4 h-4" />
                Esci
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-2xl mx-auto p-6">
        {/* Main form container with the glass effect */}
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-white/20 dark:border-white/10">
          <div className="text-center mb-8">
            <User className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {isComplete ? 'Profilo Completo' : 'Completa il tuo Profilo'}
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {isComplete 
                ? 'Le tue informazioni sono state salvate correttamente.'
                : 'Per acquistare i biglietti, completa le tue informazioni.'
              }
            </p>
          </div>

          {isComplete && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 text-green-800 dark:text-green-300 rounded-lg">
              ✓ Profilo completato! Ora puoi acquistare i biglietti.
            </div>
          )}

          {errors.general && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-800 dark:text-red-300 rounded-lg">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 border border-gray-400/50 rounded-lg bg-gray-500/10 text-gray-500 dark:text-gray-400"
              />
            </div>

            {['name', 'surname', 'codiceFiscale'].map((field) => (
                <div key={field}>
                    <label className="block text-sm font-medium mb-2 capitalize">
                        {field === 'codiceFiscale' ? 'Codice Fiscale' : field} *
                    </label>
                    <input
                        type="text"
                        value={formData[field]}
                        onChange={(e) => setFormData({ ...formData, [field]: field === 'codiceFiscale' ? e.target.value.toUpperCase() : e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors[field] ? 'border-red-500/80' : 'border-gray-400/50'
                        }`}
                        placeholder={
                            field === 'name' ? 'Inserisci il tuo nome' :
                            field === 'surname' ? 'Inserisci il tuo cognome' :
                            'RSSMRA80A01H501U'
                        }
                        maxLength={field === 'codiceFiscale' ? 16 : undefined}
                    />
                    {errors[field] && <p className="mt-1 text-sm text-red-500">{errors[field]}</p>}
                </div>
            ))}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Salvataggio...' : 'Salva Profilo'}
            </button>
          </form>

          {isComplete && (
            <div className="mt-8 text-center">
              <button
                onClick={() => router.push('/shop')}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-lg"
              >
                <CreditCard className="w-5 h-5" />
                Acquista Biglietti
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}