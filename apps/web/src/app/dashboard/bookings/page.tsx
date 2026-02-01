'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Trash2,
  Filter,
  Download,
  Search,
  ChevronDown,
} from 'lucide-react';

interface Booking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED';
  attendeeFirstName?: string;
  attendeeLastName?: string;
  attendeeEmail?: string;
  attendeePhone?: string;
  description?: string;
  createdAt: string;
  connection: {
    calendarName: string;
  };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionId, setConnectionId] = useState<string>('');

  // API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // TODO: Get from auth context
  const organizationId = 'cmi4xuoi80001hs74layh08yz'; // Real organization ID

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      // First get the user's calendar connection
      const connectionsResponse = await fetch(`${apiUrl}/calendar/connections?organizationId=${organizationId}`);
      const connectionsData = await connectionsResponse.json();

      if (connectionsData.connections && connectionsData.connections.length > 0) {
        const activeConnection = connectionsData.connections[0];
        setConnectionId(activeConnection.id);

        // Then fetch events for that connection
        const eventsResponse = await fetch(`${apiUrl}/calendar/events?connectionId=${activeConnection.id}`);
        const eventsData = await eventsResponse.json();

        let filteredBookings = eventsData.events || [];

        // Apply filters
        const now = new Date();
        if (filter === 'upcoming') {
          filteredBookings = filteredBookings.filter((b: Booking) =>
            new Date(b.startTime) > now && b.status !== 'CANCELLED'
          );
        } else if (filter === 'past') {
          filteredBookings = filteredBookings.filter((b: Booking) =>
            new Date(b.startTime) <= now
          );
        } else if (filter === 'cancelled') {
          filteredBookings = filteredBookings.filter((b: Booking) =>
            b.status === 'CANCELLED'
          );
        }

        setBookings(filteredBookings);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/calendar/events/${bookingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBookings();
      } else {
        alert('Impossibile cancellare la prenotazione');
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Errore durante la cancellazione');
    }
  };

  const exportBookings = () => {
    // Create CSV
    const csv = [
      ['Data', 'Ora', 'Nome', 'Cognome', 'Email', 'Telefono', 'Stato', 'Note'].join(','),
      ...bookings.map(b => [
        new Date(b.startTime).toLocaleDateString('it-IT'),
        new Date(b.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        b.attendeeFirstName || '',
        b.attendeeLastName || '',
        b.attendeeEmail || '',
        b.attendeePhone || '',
        b.status,
        (b.description || '').replace(/,/g, ';'),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prenotazioni-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredBookings = bookings.filter(b => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.attendeeFirstName?.toLowerCase().includes(query) ||
      b.attendeeLastName?.toLowerCase().includes(query) ||
      b.attendeeEmail?.toLowerCase().includes(query) ||
      b.attendeePhone?.includes(query)
    );
  });

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (isoString: string): string => {
    return new Date(isoString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-emerald text-charcoal">Confermato</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="text-red-600 border-red-600">Cancellato</Badge>;
      case 'RESCHEDULED':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Riprogrammato</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/60 mx-auto mb-4"></div>
          <p className="text-silver-600">Caricamento prenotazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-effect border border-silver-200/70 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-silver-600 mb-1">Totali</p>
              <p className="text-2xl font-bold text-charcoal">{bookings.length}</p>
            </div>
            <div className="w-12 h-12 bg-pearl-50 rounded-xl border border-silver-200/70 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-charcoal" />
            </div>
          </div>
        </div>

        <div className="glass-effect border border-silver-200/70 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-silver-600 mb-1">Prossime</p>
              <p className="text-2xl font-bold text-emerald-400">
                {bookings.filter(b => new Date(b.startTime) > new Date() && b.status !== 'CANCELLED').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="glass-effect border border-silver-200/70 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-silver-600 mb-1">Completate</p>
              <p className="text-2xl font-bold text-blue-400">
                {bookings.filter(b => new Date(b.startTime) <= new Date() && b.status !== 'CANCELLED').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl border border-blue-500/30 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="glass-effect border border-silver-200/70 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-silver-600 mb-1">Cancellate</p>
              <p className="text-2xl font-bold text-red-400">
                {bookings.filter(b => b.status === 'CANCELLED').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-xl border border-red-500/30 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-effect border border-silver-200/70 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-silver-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per nome, email o telefono..."
              className="w-full pl-10 pr-4 py-2 bg-pearl-50 border border-silver-200/70 rounded-lg focus:outline-none focus:border-white/30 text-charcoal placeholder-white/40"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-white text-black' : 'border border-silver-200/70 text-silver-600 hover:bg-pearl-100/60'}`}
            >
              Tutte
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'upcoming' ? 'bg-white text-black' : 'border border-silver-200/70 text-silver-600 hover:bg-pearl-100/60'}`}
            >
              Prossime
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'past' ? 'bg-white text-black' : 'border border-silver-200/70 text-silver-600 hover:bg-pearl-100/60'}`}
            >
              Passate
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'cancelled' ? 'bg-white text-black' : 'border border-silver-200/70 text-silver-600 hover:bg-pearl-100/60'}`}
            >
              Cancellate
            </button>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="glass-effect border border-silver-200/70 rounded-2xl p-12 text-center backdrop-blur-md">
          <Calendar className="w-16 h-16 text-charcoal/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-charcoal mb-2">
            Nessuna prenotazione
          </h3>
          <p className="text-silver-600">
            {searchQuery ? 'Nessun risultato per la ricerca' : 'Non ci sono prenotazioni in questa categoria'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="glass-effect border border-silver-200/70 rounded-2xl p-5 backdrop-blur-md hover:bg-pearl-100/60 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 border border-silver-200/70 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-charcoal" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-charcoal">
                        {booking.attendeeFirstName} {booking.attendeeLastName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-silver-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(booking.startTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    {booking.attendeeEmail && (
                      <div className="flex items-center gap-2 text-silver-700">
                        <Mail className="w-4 h-4 text-silver-400" />
                        <a href={`mailto:${booking.attendeeEmail}`} className="hover:text-charcoal">
                          {booking.attendeeEmail}
                        </a>
                      </div>
                    )}
                    {booking.attendeePhone && (
                      <div className="flex items-center gap-2 text-silver-700">
                        <Phone className="w-4 h-4 text-silver-400" />
                        <a href={`tel:${booking.attendeePhone}`} className="hover:text-charcoal">
                          {booking.attendeePhone}
                        </a>
                      </div>
                    )}
                  </div>

                  {booking.description && (
                    <div className="mt-3 p-3 bg-pearl-50 border border-silver-200/70 rounded-lg">
                      <p className="text-sm text-silver-700"><strong className="text-charcoal">Note:</strong> {booking.description}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                    booking.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    booking.status === 'CANCELLED' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                    'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {booking.status === 'CONFIRMED' ? 'Confermato' : booking.status === 'CANCELLED' ? 'Cancellato' : 'Riprogrammato'}
                  </span>

                  {booking.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="p-2 border border-silver-200/70 rounded-lg text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
