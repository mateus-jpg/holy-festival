'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Filter, Calendar, Euro, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // all, valid, expired, used
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
    
    if (now < validFrom || now > validUntil) return 'expired';
    return 'valid';
  };

  // Function to get ticket styling based on status
  const getTicketStyling = (status) => {
    switch (status) {
      case 'valid':
        return {
          badgeBg: 'bg-green-500/80',
          badgeText: 'Valido',
          icon: CheckCircle,
          borderColor: 'border-green-400/30',
          bgHover: 'hover:bg-green-500/10'
        };
      case 'expired':
        return {
          badgeBg: 'bg-orange-500/80',
          badgeText: 'Scaduto',
          icon: Clock,
          borderColor: 'border-orange-400/30',
          bgHover: 'hover:bg-orange-500/10'
        };
      case 'used':
        return {
          badgeBg: 'bg-red-500/80',
          badgeText: 'Utilizzato',
          icon: XCircle,
          borderColor: 'border-red-400/30',
          bgHover: 'hover:bg-red-500/10'
        };
      default:
        return {
          badgeBg: 'bg-gray-500/80',
          badgeText: 'Sconosciuto',
          icon: AlertTriangle,
          borderColor: 'border-gray-400/30',
          bgHover: 'hover:bg-gray-500/10'
        };
    }
  };

  const fetchTickets = async () => {
    try {
      console.log(user);
      let q;
      
      // If user is admin, fetch all tickets, otherwise only user's tickets
        q = query(
          collection(db, 'tickets'),
          where("userId", "==", user.uid))
      
      
      const querySnapshot = await getDocs(q);
      const ticketsData = [];

      querySnapshot.forEach((doc) => {
        console.log(doc)
        const ticket = { id: doc.id, ...doc.data() };
        ticketsData.push(ticket);
      });

      setTickets(ticketsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

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
        <div className="backdrop-blur-sm bg-white/10 p-8 rounded-2xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {user.isAdmin ? 'Gestione Biglietti' : 'I Miei Biglietti'}
          </h1>
          
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                statusFilter === 'all'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              <Filter className="w-4 h-4" />
              Tutti
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">{counts.all}</span>
            </button>
            
            <button
              onClick={() => setStatusFilter('valid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                statusFilter === 'valid'
                  ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                  : 'bg-white/10 text-white/80 hover:bg-green-500/10'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Validi
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">{counts.valid}</span>
            </button>
            
            <button
              onClick={() => setStatusFilter('expired')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                statusFilter === 'expired'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                  : 'bg-white/10 text-white/80 hover:bg-orange-500/10'
              }`}
            >
              <Clock className="w-4 h-4" />
              Scaduti
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">{counts.expired}</span>
            </button>
            
            <button
              onClick={() => setStatusFilter('used')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                statusFilter === 'used'
                  ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                  : 'bg-white/10 text-white/80 hover:bg-red-500/10'
              }`}
            >
              <XCircle className="w-4 h-4" />
              Utilizzati
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">{counts.used}</span>
            </button>
          </div>
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="backdrop-blur-md bg-white/10 rounded-3xl p-12 border border-white/20 shadow-2xl">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <p className="text-xl text-white/80">
                {statusFilter === 'all' 
                  ? (user.isAdmin ? 'Nessun biglietto trovato' : 'Non hai ancora acquistato biglietti')
                  : `Nessun biglietto ${
                      statusFilter === 'valid' ? 'valido' :
                      statusFilter === 'expired' ? 'scaduto' : 'utilizzato'
                    } trovato`
                }
              </p>
              <p className="text-white/60 mt-2">
                {statusFilter === 'all' && !user.isAdmin && 'I tuoi biglietti acquistati appariranno qui'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTickets.map((ticket) => {
              const status = getTicketStatus(ticket);
              const styling = getTicketStyling(status);
              const StatusIcon = styling.icon;

              return (
                <div
                  key={ticket.id}
                  className={`group backdrop-blur-md bg-white/10 rounded-2xl border-2 ${styling.borderColor} shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 ${styling.bgHover} overflow-hidden`}
                >
                  {/* Ticket Image */}
                  <div className="aspect-[4/3] relative bg-gradient-to-br from-white/20 to-white/5">
                    {ticket.imgUrl ? (
                      <Image
                        src={ticket.imgUrl}
                        alt={ticket.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {/* Enhanced Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`${styling.badgeBg} backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {styling.badgeText}
                      </span>
                    </div>

                    {/* Admin indicator if viewing all tickets */}
                    {user.isAdmin && ticket.userId !== user.uid && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-blue-500/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                          Utente
                        </span>
                      </div>
                    )}

                    {/* Status overlay for expired/used tickets */}
                    {status !== 'valid' && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="text-white text-center opacity-80">
                          <StatusIcon className="w-8 h-8 mx-auto mb-1" />
                          <div className="text-xs font-medium uppercase tracking-wide">
                            {styling.badgeText}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ticket Info */}
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-3 text-white line-clamp-2">
                      {ticket.name}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      {ticket.eventDate && (
                        <div className="flex items-center text-white/80">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-sm">
                            {formatDate(ticket.eventDate)}
                          </span>
                        </div>
                      )}

                      {ticket.price && (
                        <div className="flex items-center text-white/80">
                          <Euro className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">
                            €{ticket.price.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Validity period for expired tickets */}
                      {status === 'expired' && ticket.validUntil && (
                        <div className="flex items-center text-orange-300">
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="text-xs">
                            Scaduto il {formatDate(ticket.validUntil)}
                          </span>
                        </div>
                      )}

                      {/* Validation date for used tickets */}
                      {status === 'used' && ticket.validatedAt && (
                        <div className="flex items-center text-red-300">
                          <XCircle className="w-4 h-4 mr-2" />
                          <span className="text-xs">
                            Utilizzato il {formatDate(ticket.validatedAt)}
                          </span>
                        </div>
                      )}

                      {/* Valid until info for valid tickets */}
                      {status === 'valid' && ticket.validUntil && (
                        <div className="flex items-center text-green-300">
                          <CheckCircle className="w-4 h-4 mr-2" />
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
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                          : status === 'expired'
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white'
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
        {tickets.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Totali</p>
                  <p className="text-2xl font-bold text-white">{counts.all}</p>
                </div>
                <Filter className="w-8 h-8 text-white/60" />
              </div>
            </div>
            
            <div className="backdrop-blur-md bg-green-500/10 rounded-2xl p-6 border border-green-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm">Validi</p>
                  <p className="text-2xl font-bold text-green-300">{counts.valid}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <div className="backdrop-blur-md bg-orange-500/10 rounded-2xl p-6 border border-orange-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm">Scaduti</p>
                  <p className="text-2xl font-bold text-orange-300">{counts.expired}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
            </div>
            
            <div className="backdrop-blur-md bg-red-500/10 rounded-2xl p-6 border border-red-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-300 text-sm">Utilizzati</p>
                  <p className="text-2xl font-bold text-red-300">{counts.used}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>
        )}
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