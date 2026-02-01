'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, User, Mail, Phone, Check, ChevronRight, ChevronLeft } from 'lucide-react';

interface TimeSlot {
  start: string;
  end: string;
}

interface BookingWizardProps {
  botId?: string;
  connectionId?: string;
  conversationId?: string;
  onComplete: (eventId: string) => void;
  onCancel: () => void;
}

export function BookingWizard({ botId, connectionId: propConnectionId, conversationId, onComplete, onCancel }: BookingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(propConnectionId || null);

  // API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Step 1: Personal Information (NEW ORDER)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Step 2: Date selection
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  // Step 3: Time slot selection
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!connectionId && botId) {
      fetchCalendarConnection();
    }
    generateAvailableDates();
  }, [botId, connectionId]);

  useEffect(() => {
    if (selectedDate && connectionId) {
      fetchAvailableSlots();
    }
  }, [selectedDate, connectionId]);

  const fetchCalendarConnection = async () => {
    try {
      // Get the active calendar connection for this bot
      const response = await fetch(`/api/calendar/connections?botId=${botId}`);
      const data = await response.json();

      const activeConnection = data.connections?.find((c: any) => c.isActive && c.botId === botId);
      if (activeConnection) {
        setConnectionId(activeConnection.id);
      }
    } catch (error) {
      console.error('Failed to fetch calendar connection:', error);
    }
  };

  const generateAvailableDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate next 30 days
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Skip Sundays (optional - this should come from workingHours config)
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }

    setAvailableDates(dates);
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !connectionId) return;

    setLoadingSlots(true);
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const response = await fetch(`${apiUrl}/calendar/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
        }),
      });

      const data = await response.json();
      setAvailableSlots(data.slots || []);
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !firstName || !email || !connectionId) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/calendar/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          conversationId,
          summary: `Appointment with ${firstName} ${lastName}`,
          description: notes || 'Booked via widget',
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          attendeeEmail: email,
          attendeeName: `${firstName} ${lastName}`,
          attendeeFirstName: firstName,
          attendeeLastName: lastName,
          attendeePhone: phone,
          organizerEmail: 'your-email@example.com', // TODO: Get from connection config
          idempotencyKey: `${conversationId || connectionId}-${Date.now()}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onComplete(data.event.id);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Failed to book appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!connectionId) {
    return (
      <Card className="p-6 text-center">
        <Calendar className="w-12 h-12 text-muted-gray mx-auto mb-3" />
        <p className="text-charcoal/70">Calendar not configured</p>
        <Button variant="outline" onClick={onCancel} className="mt-4">
          Close
        </Button>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg w-full bg-white shadow-lg">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-charcoal">Prenota un Appuntamento</h3>
          <button onClick={onCancel} className="text-muted-gray hover:text-charcoal">
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                s <= step ? 'bg-emerald' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Personal Information (REVERSED ORDER) */}
      {step === 1 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-emerald" />
            <h4 className="font-medium text-charcoal">I Tuoi Dati</h4>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  name="given-name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Mario"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  Cognome *
                </label>
                <input
                  type="text"
                  name="family-name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Rossi"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Numero di Telefono *
              </label>
              <input
                type="tel"
                name="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+39 333 123 4567"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald"
                required
              />
              <p className="text-xs text-muted-gray mt-1">
                Formato: +39 seguito dal numero
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mario.rossi@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald"
                required
              />
              <p className="text-xs text-muted-gray mt-1">
                Riceverai una conferma via email
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Note (opzionale)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Argomenti specifici da discutere..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={onCancel}>
              Annulla
            </Button>
            <Button
              onClick={() => setStep(2)}
              disabled={!firstName || !lastName || !phone || !email}
              className="bg-emerald hover:bg-emerald/90 text-white"
            >
              Avanti <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Date Selection (REVERSED ORDER) */}
      {step === 2 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-emerald" />
            <h4 className="font-medium text-charcoal">Scegli il Giorno</h4>
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
            {availableDates.map((date, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  selectedDate?.toDateString() === date.toDateString()
                    ? 'border-emerald bg-emerald/10 text-emerald font-medium'
                    : 'border-slate-200 hover:border-emerald/50 text-charcoal'
                }`}
              >
                <div className="text-xs text-muted-gray">{date.toLocaleDateString('it-IT', { weekday: 'short' })}</div>
                <div className="text-lg font-semibold">{date.getDate()}</div>
                <div className="text-xs text-muted-gray">{date.toLocaleDateString('it-IT', { month: 'short' })}</div>
              </button>
            ))}
          </div>

          <div className="flex justify-between gap-2 mt-4 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!selectedDate}
              className="bg-emerald hover:bg-emerald/90 text-white"
            >
              Avanti <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Time Slot Selection (REVERSED ORDER) */}
      {step === 3 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-emerald" />
            <h4 className="font-medium text-charcoal">Scegli l'Orario</h4>
          </div>

          <div className="mb-4 p-3 bg-emerald/10 rounded-lg space-y-1">
            <p className="text-sm text-charcoal">
              <strong>{firstName} {lastName}</strong>
            </p>
            <p className="text-sm text-charcoal">
              {selectedDate && formatDate(selectedDate)}
            </p>
          </div>

          {loadingSlots ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald mx-auto mb-2"></div>
              <p className="text-sm text-muted-gray">Caricamento orari disponibili...</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-gray">Nessuno slot disponibile per questa data</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDate(null);
                  setStep(2);
                }}
                className="mt-4"
              >
                Scegli un'Altra Data
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      selectedSlot === slot
                        ? 'border-emerald bg-emerald/10 text-emerald font-medium'
                        : 'border-slate-200 hover:border-emerald/50 text-charcoal'
                    }`}
                  >
                    {formatTime(slot.start)}
                  </button>
                ))}
              </div>

              {/* Summary before confirmation */}
              {selectedSlot && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-2">
                  <h5 className="font-semibold text-charcoal mb-2">Riepilogo Prenotazione</h5>
                  <div className="text-sm space-y-1">
                    <p><strong>Nome:</strong> {firstName} {lastName}</p>
                    <p><strong>Telefono:</strong> {phone}</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Data:</strong> {selectedDate && formatDate(selectedDate)}</p>
                    <p><strong>Orario:</strong> {`${formatTime(selectedSlot.start)} - ${formatTime(selectedSlot.end)}`}</p>
                    {notes && <p><strong>Note:</strong> {notes}</p>}
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-2 mt-4 pt-4 border-t border-slate-200">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
                </Button>
                <Button
                  onClick={handleBookAppointment}
                  disabled={!selectedSlot || loading}
                  className="bg-emerald hover:bg-emerald/90 text-white"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Prenotazione...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Conferma Prenotazione
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
