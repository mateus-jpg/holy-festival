'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { TicketCheck, Clock, AlertTriangle, Calendar, X, Check } from 'lucide-react';
// Importa react-hot-toast
import toast, { Toaster } from 'react-hot-toast';

export default function SingleTicket() {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validating, setValidating] = useState(false);
  const { user, getUserIdToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const ticketId = params.ticketId;

  useEffect(() => {
    if (user && ticketId) {
      fetchTicket();
    }
  }, [user, ticketId]);

  // Enhanced date validation function
  const isTicketDateValid = () => {
    if (!ticket || !ticket.validFrom || !ticket.validUntil) return true;
    
    const now = new Date();
    const validFrom = ticket.validFrom.toDate ? ticket.validFrom.toDate() : new Date(ticket.validFrom);
    const validUntil = ticket.validUntil.toDate ? ticket.validUntil.toDate() : new Date(ticket.validUntil);
    
    return now >= validFrom && now <= validUntil;
  };

  // Check if ticket is upcoming (not yet valid)
  const isTicketUpcoming = () => {
    if (!ticket || !ticket.validFrom) return false;
    
    const now = new Date();
    const validFrom = ticket.validFrom.toDate ? ticket.validFrom.toDate() : new Date(ticket.validFrom);
    
    return now < validFrom;
  };

  // Get ticket status for visual representation
  const getTicketStatus = () => {
    if (!ticket) return 'unknown';
    
    if (!ticket.valid) return 'used';
    
    if (isTicketUpcoming()) return 'upcoming';
    if (!isTicketDateValid()) return 'expired';
    
    return 'valid';
  };

  // Get visual styling based on ticket status
  const getTicketStyling = () => {
    const status = getTicketStatus();
    
    switch (status) {
      case 'valid':
        return {
          qrBg: 'bg-green-600',
          qrColor: '#16a34a',
          statusBadge: 'bg-green-500/90',
          statusText: 'Valido',
          borderColor: 'border-green-400/50'
        };
      case 'upcoming':
        return {
          qrBg: 'bg-blue-600',
          qrColor: '#2563eb',
          statusBadge: 'bg-blue-500/90',
          statusText: 'In Arrivo',
          borderColor: 'border-blue-400/50'
        };
      case 'expired':
        return {
          qrBg: 'bg-orange-600',
          qrColor: '#ea580c',
          statusBadge: 'bg-orange-500/90',
          statusText: 'Scaduto',
          borderColor: 'border-orange-400/50'
        };
      case 'used':
        return {
          qrBg: 'bg-red-700',
          qrColor: '#dc2626',
          statusBadge: 'bg-red-500/90',
          statusText: 'Utilizzato',
          borderColor: 'border-red-400/50'
        };
      default:
        return {
          qrBg: 'bg-gray-600',
          qrColor: '#6b7280',
          statusBadge: 'bg-gray-500/90',
          statusText: 'Sconosciuto',
          borderColor: 'border-gray-400/50'
        };
    }
  };

  // Confirmation Modal Component
  const ConfirmationModal = () => {
    if (!showConfirmModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Conferma Convalida</h3>
            <p className="text-white/80 mb-6">
              Sei sicuro di voler validare questo biglietto?<br />
              <span className="text-sm text-white/60">Questa azione non può essere annullata.</span>
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={validating}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Annulla
              </button>
              
              <button
                onClick={confirmValidation}
                disabled={validating}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                {validating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Validazione...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Conferma
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleValidate = async () => {
    if (!user || !user.isAdmin) {
      toast.error('Solo gli amministratori possono validare i biglietti', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
        },
        icon: '🚫',
      });
      return;
    }

    if (!ticket.valid) {
      toast.error('Questo biglietto è già stato validato', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
        },
        icon: '❌',
      });
      return;
    }

    // Check if ticket is upcoming or expired
    if (isTicketUpcoming()) {
      const validFrom = ticket.validFrom.toDate ? ticket.validFrom.toDate() : new Date(ticket.validFrom);
      toast.error(
        `Biglietto non validabile: non è ancora valido (valido dal ${formatDate(ticket.validFrom)})`,
        {
          duration: 6000,
          position: 'top-center',
          style: {
            background: '#F59E0B',
            color: '#fff',
          },
          icon: '📅',
        }
      );
      return;
    }

    if (!isTicketDateValid()) {
      const validUntil = ticket.validUntil.toDate ? ticket.validUntil.toDate() : new Date(ticket.validUntil);
      toast.error(
        `Biglietto non validabile: è scaduto (scaduto il ${formatDate(ticket.validUntil)})`,
        {
          duration: 6000,
          position: 'top-center',
          style: {
            background: '#F59E0B',
            color: '#fff',
          },
          icon: '⏰',
        }
      );
      return;
    }

    // Show confirmation modal instead of alert
    setShowConfirmModal(true);
  };

  const confirmValidation = async () => {
    setValidating(true);

    try {
      const idToken = await getUserIdToken();

      const response = await fetch(`/api/tickets/${ticketId}/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTicket(prevTicket => ({
          ...prevTicket,
          valid: false,
          status: 'validated',
          validatedAt: data.ticket.validatedAt
        }));

        toast.success('Biglietto validato con successo! ✅', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#10B981',
            color: '#fff',
            fontWeight: '500',
          },
          icon: '🎫',
        });
        
        setShowConfirmModal(false);
      } else {
        toast.error(`Errore nella validazione: ${data.error}`, {
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#EF4444',
            color: '#fff',
          },
          icon: '❌',
        });
      }
    } catch (error) {
      console.error('Error validating ticket:', error);
      toast.error('Errore durante la validazione del biglietto', {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
        },
        icon: '⚠️',
      });
    } finally {
      setValidating(false);
    }
  };

  // Enhanced validation check function
  const canValidateTicket = () => {
    return user && 
           user.isAdmin && 
           ticket && 
           ticket.valid && 
           ticket.status !== 'validated' && 
           !isTicketUpcoming() && 
           isTicketDateValid();
  };

   const fetchTicket = async () => {
    setLoading(true);
    setError('');

    try {
      const ticketDocRef = doc(db, 'tickets', ticketId);
      const ticketDoc = await getDoc(ticketDocRef);

      if (ticketDoc.exists()) {
        const ticketData = { id: ticketDoc.id, ...ticketDoc.data() };

        if (ticketData.userId !== user.uid && !user.isAdmin) {
          setError('Non puoi vedere questo biglietto');
          toast.error('Accesso negato a questo biglietto', {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#EF4444',
              color: '#fff',
            },
            icon: '🚫',
          });
        } else {
          setTicket(ticketData);
          // Show success toast when ticket loads successfully
          toast.success('Biglietto caricato con successo', {
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#10B981',
              color: '#fff',
            },
            icon: '🎫',
          });
        }
      } else {
        setError('Biglietto non trovato');
        toast.error('Biglietto non trovato', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#EF4444',
            color: '#fff',
          },
          icon: '❌',
        });
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);

      if (error.code === 'permission-denied') {
        setError('Non puoi vedere questo biglietto');
        toast.error('Permessi insufficienti', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#EF4444',
            color: '#fff',
          },
          icon: '🚫',
        });
      } else {
        setError('Errore nel caricamento del biglietto');
        toast.error('Errore nel caricamento del biglietto', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#EF4444',
            color: '#fff',
          },
          icon: '⚠️',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Non specificato';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (timestamp) => {
    if (!timestamp) return 'Non specificato';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const qrCodeUrl = `https://holy-festival.onebridgeto.com/tickets/${ticketId}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="backdrop-blur-sm bg-white/10 p-8 rounded-2xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="backdrop-blur-md bg-white/10 rounded-3xl p-12 border border-white/20 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Errore</h2>
          <p className="text-white/80 mb-6">{error}</p>
          <Link
            href="/tickets"
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300"
          >
            Torna ai Biglietti
          </Link>
        </div>
      </div>
    );
  }

  const styling = getTicketStyling();
  const status = getTicketStatus();

  return (
    <div className="min-h-screen">
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/tickets"
            className="inline-flex items-center text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Torna ai Biglietti
          </Link>
        </div>

        {/* Ticket Card with dynamic border */}
        <div className={`backdrop-blur-md bg-white/10 rounded-3xl border-2 ${styling.borderColor} shadow-2xl overflow-hidden`}>
          {/* Header */}
          <div className="relative">
            {ticket.imgUrl && (
              <div className="h-48 relative">
                <Image
                  src={ticket.imgUrl}
                  alt={ticket.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
            )}
            
            {/* Enhanced Status Badge */}
            <div className="absolute top-4 right-4 flex gap-2">
              <span className={`${styling.statusBadge} backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2`}>
                {status === 'upcoming' && <Calendar className="w-4 h-4" />}
                {status === 'expired' && <Clock className="w-4 h-4" />}
                {status === 'used' && <AlertTriangle className="w-4 h-4" />}
                {status === 'valid' && <TicketCheck className="w-4 h-4" />}
                {styling.statusText}
              </span>
            </div>

            {/* Date validation warning for admins */}
            {user.isAdmin && status === 'upcoming' && (
              <div className="absolute top-16 right-4 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
                Non ancora valido
              </div>
            )}

            {user.isAdmin && status === 'expired' && (
              <div className="absolute top-16 right-4 bg-orange-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
                Fuori periodo validità
              </div>
            )}
          </div>

          <div className=" p-8">
            {/* Ticket Title */}
            <h1 className="text-3xl font-cuanky md:text-4xl font-bold text-white mb-6 text-center">
              {ticket.name}
            </h1>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Ticket Details */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">Dettagli Biglietto</h2>
                
                <div className="space-y-4">
                  {ticket.description && (
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">Descrizione</label>
                      <p className="text-white bg-white/10 p-3 rounded-lg">{ticket.description}</p>
                    </div>
                  )}

                  {ticket.price && (
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">Prezzo</label>
                      <p className="text-white bg-white/10 p-3 rounded-lg">€{ticket.price.toFixed(2)}</p>
                    </div>
                  )}

                  {ticket.validFrom && (
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">Valido Da</label>
                      <p className={`text-white p-3 rounded-lg ${
                        status === 'upcoming' ? 'bg-blue-500/20' : 
                        status === 'expired' ? 'bg-orange-500/20' : 'bg-white/10'
                      }`}>
                        {formatDate(ticket.validFrom)}
                      </p>
                    </div>
                  )}

                  {ticket.validUntil && (
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">Valido Fino</label>
                      <p className={`text-white p-3 rounded-lg ${
                        status === 'upcoming' ? 'bg-blue-500/20' : 
                        status === 'expired' ? 'bg-orange-500/20' : 'bg-white/10'
                      }`}>
                        {formatDate(ticket.validUntil)}
                      </p>
                    </div>
                  )}

                  {ticket.eventDate && (
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">Data Evento</label>
                      <p className="text-white bg-white/10 p-3 rounded-lg">{formatDateOnly(ticket.eventDate)}</p>
                    </div>
                  )}

                  {ticket.location && (
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">Luogo</label>
                      <p className="text-white bg-white/10 p-3 rounded-lg">{ticket.location}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">ID Biglietto</label>
                    <p className="text-white bg-white/10 p-3 rounded-lg break-all font-mono text-sm">{ticket.id}</p>
                  </div>
                </div>
              </div>

              {/* Enhanced QR Code with visual status */}
              <div className="flex flex-col items-center w-full justify-center">
                <h2 className="text-xl font-semibold text-white mb-6">Codice QR</h2>
                
                <div className={`p-3 rounded-2xl shadow-lg mb-4 ${styling.qrBg} relative`}>
                  <QRCodeSVG
                    value={qrCodeUrl}
                    size={200}
                    bgColor={styling.qrColor}
                    fgColor="#ffffff"
                    level="M"
                    includeMargin={true}
                  />
                  
                  {/* Overlay for non-valid tickets */}
                  {status !== 'valid' || status!== 'upcoming' && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-2xl font-bold mb-1">
                          {status === 'upcoming' ? '📅' : 
                           status === 'expired' ? '⏰' : '❌'}
                        </div>
                        <div className="text-sm font-medium">
                          {status === 'upcoming' ? 'IN ARRIVO' :
                           status === 'expired' ? 'SCADUTO' : 'UTILIZZATO'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-white/80 text-sm text-center max-w-xs mb-4">
                  Mostra questo codice QR per validare il tuo biglietto
                </p>

                {/* Status indicator text */}
                <div className={`p-3 rounded-lg text-center mb-4 ${
                  status === 'valid' ? 'bg-green-500/20 text-green-300' :
                  status === 'upcoming' ? 'bg-blue-500/20 text-blue-300' :
                  status === 'expired' ? 'bg-orange-500/20 text-orange-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  <p className="text-sm font-medium">
                    {status === 'valid' && '✅ Biglietto valido e utilizzabile'}
                    {status === 'upcoming' && '📅 Biglietto non ancora valido'}
                    {status === 'expired' && '⏰ Biglietto scaduto'}
                    {status === 'used' && '❌ Biglietto già utilizzato'}
                  </p>
                  {status === 'upcoming' && ticket.validFrom && (
                    <p className="text-xs mt-1 opacity-80">
                      Diventerà valido il {formatDate(ticket.validFrom)}
                    </p>
                  )}
                </div>

                <div className="mt-2 p-4 bg-white/10 rounded-lg">
                  <p className="text-white/80 text-xs text-center">
                    Link: <span className="font-mono break-all">{qrCodeUrl}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              {user.isAdmin && (
                <button
                  onClick={handleValidate}
                  disabled={!canValidateTicket()}
                  className={`flex items-center justify-center space-x-2 font-medium py-3 px-6 rounded-xl transition-all duration-300 transform ${
                    canValidateTicket()
                      ? 'bg-white text-black hover:scale-105 hover:bg-gray-100'
                      : 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-50'
                  }`}
                >
                  <TicketCheck className="w-5 h-5" />
                  <span>
                    {isTicketUpcoming() && ticket.valid ? 'Non Validabile (Non Ancora Valido)' : 
                     !isTicketDateValid() && ticket.valid ? 'Non Validabile (Scaduto)' : 
                     !ticket.valid ? 'Già Validato' : 'Convalida'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmationModal />
      
      {/* Toast Container */}
      <Toaster />
    </div>
  );
}