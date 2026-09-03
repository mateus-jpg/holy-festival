'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { resolveLocalImage } from '@/app/lib/localImages';
import { useAuth } from '../contexts/AuthContext';
import { Filter, Calendar, Euro, Clock, CheckCircle, XCircle, AlertTriangle, Calendar as CalendarUpcoming } from 'lucide-react';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // all, valid, expired, used, upcoming
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  useEffect(() => {
    filterTickets();
  }, [tickets, statusFilter]);

  // Function to determine ticket status
  const getTicketStatus = (ticket) => {
    if (!ticket.valid) return 'used'; // Already validated/used
    
    if (!ticket.validFrom || !ticket.validUntil) return 'valid'; // No date constraints
    
    const now = new Date();
    const validFrom = ticket.validFrom.toDate ? ticket.validFrom.toDate() : new Date(ticket.validFrom);
    const validUntil = ticket.validUntil.toDate ? ticket.validUntil.toDate() : new Date(ticket.validUntil);
    
    if (now < validFrom) return 'upcoming'; // Not yet valid
    if (now > validUntil) return 'expired'; // Expired
    return 'valid'; // Currently valid
  };

  // Function to get ticket styling based on status
  const getTicketStyling = (status) => {
    switch (status) {
      case 'valid':
        return {
          badgeBg: 'bg-green-700',
          badgeText: 'Valido',
          icon: CheckCircle,
          borderColor: 'border-green-400/30',
          bgHover: 'hover:border-green-500/45'
        };
      case 'upcoming':
        return {
          badgeBg: 'bg-[#075652]',
          badgeText: 'In Arrivo',
          icon: CalendarUpcoming,
          borderColor: 'border-[#0a6f6a]/30',
          bgHover: 'hover:border-[#0a6f6a]/45'
        };
      case 'expired':
        return {
          badgeBg: 'bg-[#8f2f18]',
          badgeText: 'Scaduto',
          icon: Clock,
          borderColor: 'border-orange-400/30',
          bgHover: 'hover:border-orange-500/45'
        };
      case 'used':
        return {
          badgeBg: 'bg-red-700',
          badgeText: 'Utilizzato',
          icon: XCircle,
          borderColor: 'border-red-400/30',
          bgHover: 'hover:border-red-500/45'
        };
    
      default:
        return {
          badgeBg: 'bg-gray-700',
          badgeText: 'Sconosciuto',
          icon: AlertTriangle,
          borderColor: 'border-gray-400/30',
          bgHover: 'hover:border-gray-500/45'
        };
    }
  };

  const fetchTickets = async () => {
    try {
      let q;
      
      // If user is admin, fetch all tickets, otherwise only user's tickets
        q = query(
          collection(db, 'tickets'),
          where("userId", "==", user.uid))
      
      
      const querySnapshot = await getDocs(q);
      const ticketsData = [];
      const ticketReferences = new Set();

      querySnapshot.forEach((doc) => {
        console.log(doc)
        const ticket = { id: doc.id, ...doc.data() };
        ticketsData.push(ticket);
        ticketReferences.add(ticket.ticketId);
      });

        // Fetch ticket details for each unique ticketId

        // Merge ticket details into ticketsData



      setTickets(ticketsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;
          console.log(tickets);
    if (statusFilter !== 'all') {
      filtered = tickets.filter(ticket => {
        const status = getTicketStatus(ticket);
        return status === statusFilter;
      });
    }

    setFilteredTickets(filtered);
  };

  // Get ticket counts for filter badges
  const getTicketCounts = () => {
    const counts = {
      all: tickets.length,
      valid: 0,
      upcoming: 0,
      expired: 0,
      used: 0
    };

    tickets.forEach(ticket => {
      const status = getTicketStatus(ticket);
      counts[status]++;
    });

    return counts;
  };

  const counts = getTicketCounts();

  const formatDate = (timestamp) => {
    if (!timestamp) return null;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl border border-[#012136]/12 bg-white p-8 shadow-sm">
          <div role="status" className="animate-spin rounded-full h-12 w-12 border-2 border-[#012136]/20 border-t-[#c5471f]">
            <span className="sr-only">Caricamento biglietti</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="display-heading mb-4 text-4xl text-[#fffaff] md:text-5xl">
            {user.isAdmin ? 'Gestione Biglietti' : 'I Miei Biglietti'}
          </h1>
          
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                statusFilter === 'all'
                  ? 'bg-[#012136] text-white border border-[#012136]'
                  : 'bg-white text-[#012136] border border-[#012136]/16 hover:bg-[#012136]/8'
              }`}
            >
              <Filter className="w-4 h-4" aria-hidden="true" />
              Tutti
              <span className={statusFilter === 'all' ? 'bg-white/20 px-2 py-1 rounded-full text-xs' : 'bg-[#012136]/8 px-2 py-1 rounded-full text-xs'}>{counts.all}</span>
            </button>
            
            <button
              onClick={() => setStatusFilter('valid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                statusFilter === 'valid'
                  ? 'bg-green-700 text-white border border-green-700'
                  : 'bg-white text-[#012136] border border-[#012136]/16 hover:bg-green-700/8'
              }`}
            >
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
              Validi
              <span className={statusFilter === 'valid' ? 'bg-white/20 px-2 py-1 rounded-full text-xs' : 'bg-[#012136]/8 px-2 py-1 rounded-full text-xs'}>{counts.valid}</span>
            </button>
            
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                statusFilter === 'upcoming'
                  ? 'bg-[#075652] text-white border border-[#075652]'
                  : 'bg-white text-[#012136] border border-[#012136]/16 hover:bg-[#0a6f6a]/8'
              }`}
            >
              <CalendarUpcoming className="w-4 h-4" aria-hidden="true" />
              In Arrivo
              <span className={statusFilter === 'upcoming' ? 'bg-white/20 px-2 py-1 rounded-full text-xs' : 'bg-[#012136]/8 px-2 py-1 rounded-full text-xs'}>{counts.upcoming}</span>
            </button>
            
            <button
              onClick={() => setStatusFilter('expired')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                statusFilter === 'expired'
                  ? 'bg-[#8f2f18] text-white border border-[#8f2f18]'
                  : 'bg-white text-[#012136] border border-[#012136]/16 hover:bg-orange-500/8'
              }`}
            >
              <Clock className="w-4 h-4" aria-hidden="true" />
              Scaduti
              <span className={statusFilter === 'expired' ? 'bg-white/20 px-2 py-1 rounded-full text-xs' : 'bg-[#012136]/8 px-2 py-1 rounded-full text-xs'}>{counts.expired}</span>
            </button>
            
            <button
              onClick={() => setStatusFilter('used')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                statusFilter === 'used'
                  ? 'bg-red-700 text-white border border-red-700'
                  : 'bg-white text-[#012136] border border-[#012136]/16 hover:bg-red-700/8'
              }`}
            >
              <XCircle className="w-4 h-4" aria-hidden="true" />
              Utilizzati
              <span className={statusFilter === 'used' ? 'bg-white/20 px-2 py-1 rounded-full text-xs' : 'bg-[#012136]/8 px-2 py-1 rounded-full text-xs'}>{counts.used}</span>
            </button>
          </div>
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="rounded-2xl border border-[#012136]/12 bg-white p-12 shadow-sm">
              <div className="w-24 h-24 mx-auto mb-6 bg-[#012136]/8 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-[#012136]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-[#012136]">
                {statusFilter === 'all' 
                  ? (user.isAdmin ? 'Nessun biglietto trovato' : 'Non hai ancora acquistato biglietti')
                  : `Nessun biglietto ${
                      statusFilter === 'valid' ? 'valido' :
                      statusFilter === 'upcoming' ? 'in arrivo' :
                      statusFilter === 'expired' ? 'scaduto' : 'utilizzato'
                    } trovato`
                }
              </p>
              <p className="text-[#012136]/65 mt-2">
                {statusFilter === 'all' && !user.isAdmin && 'Le tue prenotazioni appariranno qui'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTickets.map((ticket) => {
              const status = getTicketStatus(ticket);
              const styling = getTicketStyling(status);
              const StatusIcon = styling.icon;
              const imageSrc = resolveLocalImage(ticket.imgUrl);

              return (
                <div
                  key={ticket.id}
                  className={`group rounded-2xl border-2 bg-white ${styling.borderColor} shadow-sm transition-all duration-300 hover:shadow-lg ${styling.bgHover} overflow-hidden`}
                >
                  {/* Ticket Image */}
                  <div className="aspect-[4/3] relative bg-[#012136]/8">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={ticket.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="w-16 h-16 bg-[#012136]/10 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-[#012136]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {/* Enhanced Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`${styling.badgeBg} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" aria-hidden="true" />
                        {styling.badgeText}
                      </span>
                    </div>

                    {/* Admin indicator if viewing all tickets */}
                    {user.isAdmin && ticket.userId !== user.uid && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-[#075652] text-white px-2 py-1 rounded-full text-xs font-medium">
                          Utente
                        </span>
                      </div>
                    )}

                    {/* Status overlay for non-valid tickets */}
                    {status !== 'valid' && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="text-white text-center">
                          <StatusIcon className="w-8 h-8 mx-auto mb-1" aria-hidden="true" />
                          <div className="text-xs font-medium uppercase tracking-wide">
                            {styling.badgeText}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ticket Info */}
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-3 text-[#012136] line-clamp-2">
                      {ticket.name}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      {ticket.eventDate && (
                        <div className="flex items-center text-[#012136]/75">
                          <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
                          <span className="text-sm">
                            {formatDate(ticket.eventDate)}
                          </span>
                        </div>
                      )}

                      {ticket.price && (
                        <div className="flex items-center text-[#012136]/75">
                          <Euro className="w-4 h-4 mr-2" aria-hidden="true" />
                          <span className="text-sm font-medium">
                            €{ticket.price.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Validity period for upcoming tickets */}
                      {status === 'upcoming' && ticket.validFrom && (
                        <div className="flex items-center text-[#075652]">
                          <CalendarUpcoming className="w-4 h-4 mr-2" aria-hidden="true" />
                          <span className="text-xs">
                            Valido dal {formatDate(ticket.validFrom)}
                          </span>
                        </div>
                      )}

                      {/* Validity period for expired tickets */}
                      {status === 'expired' && ticket.validUntil && (
                        <div className="flex items-center text-[#8f2f18]">
                          <Clock className="w-4 h-4 mr-2" aria-hidden="true" />
                          <span className="text-xs">
                            Scaduto il {formatDate(ticket.validUntil)}
                          </span>
                        </div>
                      )}

                      {/* Validation date for used tickets */}
                      {status === 'used' && ticket.validatedAt && (
                        <div className="flex items-center text-red-700">
                          <XCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                          <span className="text-xs">
                            Utilizzato il {formatDate(ticket.validatedAt)}
                          </span>
                        </div>
                      )}

                      {/* Valid until info for valid tickets */}
                      {status === 'valid' && ticket.validUntil && (
                        <div className="flex items-center text-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                          <span className="text-xs">
                            Valido fino al {formatDate(ticket.validUntil)}
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/tickets/${ticket.id}`}
                      className={`block w-full font-medium py-3 px-4 rounded-xl text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                        status === 'valid'
                          ? 'bg-[#012136] hover:bg-[#0a6f6a] text-white'
                          : status === 'upcoming'
                          ? 'bg-[#0a6f6a] hover:bg-[#075652] text-white'
                          : status === 'expired'
                          ? 'bg-[#8f2f18] hover:bg-[#6f2412] text-white'
                          : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white'
                      }`}
                    >
                      Visualizza Biglietto
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Statistics */}

      </div>
      
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
