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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Profilo Utente</h1>
            <div className="flex gap-4">
              {isComplete && (
                <button
                  onClick={() => router.push('/tickets')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  I Miei Biglietti
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Esci
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <User className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isComplete ? 'Profilo Completo' : 'Completa il tuo Profilo'}
            </h2>
            <p className="text-gray-600">
              {isComplete 
                ? 'Le tue informazioni sono state salvate correttamente'
                : 'Per acquistare i biglietti, completa le tue informazioni'
              }
            </p>
          </div>

          {isComplete && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              ✓ Profilo completato! Ora puoi acquistare i biglietti.
            </div>
          )}

          {errors.general && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Inserisci il tuo nome"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cognome *
              </label>
              <input
                type="text"
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.surname ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Inserisci il tuo cognome"
              />
              {errors.surname && <p className="mt-1 text-sm text-red-600">{errors.surname}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Codice Fiscale *
              </label>
              <input
                type="text"
                value={formData.codiceFiscale}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  codiceFiscale: e.target.value.toUpperCase() 
                })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.codiceFiscale ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="RSSMRA80A01H501U"
                maxLength={16}
              />
              {errors.codiceFiscale && <p className="mt-1 text-sm text-red-600">{errors.codiceFiscale}</p>}
              <p className="mt-1 text-sm text-gray-500">
                Il codice fiscale italiano di 16 caratteri
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvataggio...' : 'Salva Profilo'}
            </button>
          </form>

          {isComplete && (
            <div className="mt-8 text-center">
              <button
                onClick={() => router.push('/shop')}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
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