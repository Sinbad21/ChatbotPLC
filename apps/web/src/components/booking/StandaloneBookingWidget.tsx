'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, User, Check, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface TimeSlot {
  start: string;
  end: string;
}

interface StandaloneBookingWidgetProps {
  connectionId?: string; // For authenticated bot users
  widgetId?: string;     // For public widget embedding (standalone customers)
  onClose?: () => void;
}

export function StandaloneBookingWidget({ connectionId, widgetId, onClose }: StandaloneBookingWidgetProps) {
  const { t, locale } = useI18n();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  // API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Determine which identifier to use (prefer widgetId for public access)
  const identifier = widgetId || connectionId;
  const isPublicWidget = !!widgetId;

  // Widget configuration
  const [widgetTitle, setWidgetTitle] = useState(t('booking.title'));
  const [widgetSubtitle, setWidgetSubtitle] = useState(t('booking.subtitle'));
  const [confirmMessage, setConfirmMessage] = useState(t('booking.confirmationMessage'));

  // Step 1: Personal Information
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

  // Success state
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchWidgetConfig();
    generateAvailableDates();
  }, [identifier]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchWidgetConfig = async () => {
    try {
      setConfigLoading(true);

      // Use public widget endpoint if widgetId is provided, otherwise use authenticated endpoint
      const url = isPublicWidget
        ? `${apiUrl}/calendar/widget/${identifier}/config`
        : `${apiUrl}/calendar/connections/${identifier}`;

      const response = await fetch(url);
      const data = await response.json();

      const config = isPublicWidget ? data.config : data.connection;

      if (config) {
        setWidgetTitle(config.widgetTitle || widgetTitle);
        setWidgetSubtitle(config.widgetSubtitle || widgetSubtitle);
        setConfirmMessage(config.confirmMessage || confirmMessage);
      }
    } catch (error) {
      console.error('Failed to fetch widget config:', error);
    } finally {
      setConfigLoading(false);
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

      // Skip Sundays by default (should be based on workingHours)
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }

    setAvailableDates(dates);
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !identifier) return;

    setLoadingSlots(true);
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Use public widget endpoint if widgetId is provided
      const url = isPublicWidget
        ? `${apiUrl}/calendar/widget/${identifier}/availability`
        : `${apiUrl}/calendar/availability`;

      const body = isPublicWidget
        ? {
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString(),
          }
        : {
            connectionId: identifier,
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString(),
          };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    if (!selectedSlot || !firstName || !email || !phone) return;

    setLoading(true);
    try {
      // Use public widget endpoint if widgetId is provided
      const url = isPublicWidget
        ? `${apiUrl}/calendar/widget/${identifier}/events`
        : `${apiUrl}/calendar/events`;

      const body = isPublicWidget
        ? {
            summary: `Appuntamento con ${firstName} ${lastName}`,
            description: notes || 'Prenotato tramite widget',
            startTime: selectedSlot.start,
            endTime: selectedSlot.end,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            attendeeEmail: email,
            attendeeName: `${firstName} ${lastName}`,
            attendeeFirstName: firstName,
            attendeeLastName: lastName,
            attendeePhone: phone,
            notes: notes,
          }
        : {
            connectionId: identifier,
            summary: `Appuntamento con ${firstName} ${lastName}`,
            description: notes || 'Prenotato tramite widget',
            startTime: selectedSlot.start,
            endTime: selectedSlot.end,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            attendeeEmail: email,
            attendeeName: `${firstName} ${lastName}`,
            attendeeFirstName: firstName,
            attendeeLastName: lastName,
            attendeePhone: phone,
            organizerEmail: 'booking@example.com', // Will be set from connection config
            idempotencyKey: `${identifier}-${Date.now()}`,
          };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setBookingSuccess(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Impossibile completare la prenotazione');
      }
    } catch (error) {
      console.error('Failed to book appointment:', error);
      alert('Errore durante la prenotazione. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    const localeStr = locale === 'it' ? 'it-IT' : 'en-US';
    return date.toLocaleDateString(localeStr, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    const localeStr = locale === 'it' ? 'it-IT' : 'en-US';
    return date.toLocaleTimeString(localeStr, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (configLoading) {
    return (
      <Card className="max-w-lg w-full bg-white shadow-xl p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald mx-auto mb-4"></div>
          <p className="text-muted-gray">{t('booking.loading')}</p>
        </div>
      </Card>
    );
  }

  if (bookingSuccess) {
    return (
      <Card className="max-w-lg w-full bg-white shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-emerald/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald" />
        </div>
        <h3 className="text-2xl font-bold text-charcoal mb-3">{t('booking.confirmationTitle')}</h3>
        <p className="text-muted-gray mb-6">{confirmMessage}</p>
        <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-semibold text-charcoal mb-2">{t('booking.bookingDetails')}</h4>
          <div className="space-y-1 text-sm text-charcoal">
            <p><strong>{t('booking.firstName')}:</strong> {firstName} {lastName}</p>
            <p><strong>{t('booking.email')}:</strong> {email}</p>
            <p><strong>{t('booking.phone')}:</strong> {phone}</p>
            <p><strong>{t('booking.dateTime')}:</strong> {selectedDate && formatDate(selectedDate)}</p>
            <p><strong>{t('booking.selectTime')}:</strong> {selectedSlot && `${formatTime(selectedSlot.start)} - ${formatTime(selectedSlot.end)}`}</p>
          </div>
        </div>
        {onClose && (
          <Button onClick={onClose} className="bg-emerald hover:bg-emerald/90 text-white">
            {t('common.close')}
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card className="max-w-lg w-full bg-white shadow-xl relative">
      {/* Header */}
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-charcoal mb-1">{widgetTitle}</h3>
            <p className="text-sm text-muted-gray">{widgetSubtitle}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-gray hover:text-charcoal transition-colors"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-emerald' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Personal Information */}
      {step === 1 && (
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-emerald" />
            <h4 className="font-semibold text-charcoal">{t('booking.step1')}</h4>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">
                  {t('booking.firstName')} *
                </label>
                <input
                  type="text"
                  name="given-name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('booking.firstNamePlaceholder')}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">
                  {t('booking.lastName')} *
                </label>
                <input
                  type="text"
                  name="family-name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('booking.lastNamePlaceholder')}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                {t('booking.phone')} *
              </label>
              <input
                type="tel"
                name="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('booking.phonePlaceholder')}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                {t('booking.email')} *
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('booking.emailPlaceholder')}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                {t('booking.notes')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('booking.notesPlaceholder')}
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald resize-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-200">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
            )}
            <Button
              onClick={() => setStep(2)}
              disabled={!firstName || !lastName || !phone || !email}
              className="bg-emerald hover:bg-emerald/90 text-white"
            >
              {t('booking.continue')} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Date Selection */}
      {step === 2 && (
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-emerald" />
            <h4 className="font-semibold text-charcoal">{t('booking.step2')}</h4>
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
            {availableDates.map((date, index) => {
              const localeStr = locale === 'it' ? 'it-IT' : 'en-US';
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedDate?.toDateString() === date.toDateString()
                      ? 'border-emerald bg-emerald/10 text-emerald font-semibold shadow-sm'
                      : 'border-slate-200 hover:border-emerald/50 hover:bg-emerald/5 text-charcoal'
                  }`}
                >
                  <div className="text-xs text-muted-gray mb-0.5">{date.toLocaleDateString(localeStr, { weekday: 'short' })}</div>
                  <div className="text-xl font-bold">{date.getDate()}</div>
                  <div className="text-xs text-muted-gray mt-0.5">{date.toLocaleDateString(localeStr, { month: 'short' })}</div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between gap-3 mt-6 pt-5 border-t border-slate-200">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> {t('booking.back')}
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!selectedDate}
              className="bg-emerald hover:bg-emerald/90 text-white"
            >
              {t('booking.continue')} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Time Slot Selection */}
      {step === 3 && (
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-emerald" />
            <h4 className="font-semibold text-charcoal">{t('booking.step3')}</h4>
          </div>

          <div className="mb-4 p-3 bg-emerald/5 border border-emerald/20 rounded-lg">
            <p className="text-sm text-charcoal">
              <strong>{selectedDate && formatDate(selectedDate)}</strong>
            </p>
          </div>

          {loadingSlots ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald mx-auto mb-3"></div>
              <p className="text-sm text-muted-gray">{t('booking.loading')}</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-gray mb-4">{t('booking.noSlotsAvailable')}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDate(null);
                  setStep(2);
                }}
              >
                {t('booking.back')}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto mb-4">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedSlot === slot
                        ? 'border-emerald bg-emerald/10 text-emerald font-semibold shadow-sm'
                        : 'border-slate-200 hover:border-emerald/50 hover:bg-emerald/5 text-charcoal'
                    }`}
                  >
                    <div className="text-sm font-medium">{formatTime(slot.start)}</div>
                  </button>
                ))}
              </div>

              {/* Summary */}
              {selectedSlot && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h5 className="font-semibold text-charcoal mb-3">{t('booking.summary')}</h5>
                  <div className="text-sm space-y-1.5 text-charcoal">
                    <p><strong>{t('booking.firstName')}:</strong> {firstName} {lastName}</p>
                    <p><strong>{t('booking.phone')}:</strong> {phone}</p>
                    <p><strong>{t('booking.email')}:</strong> {email}</p>
                    <p><strong>{t('booking.dateTime')}:</strong> {selectedDate && formatDate(selectedDate)}</p>
                    <p><strong>{t('booking.selectTime')}:</strong> {`${formatTime(selectedSlot.start)} - ${formatTime(selectedSlot.end)}`}</p>
                    {notes && <p><strong>{t('booking.notes')}:</strong> {notes}</p>}
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-3 mt-6 pt-5 border-t border-slate-200">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> {t('booking.back')}
                </Button>
                <Button
                  onClick={handleBookAppointment}
                  disabled={!selectedSlot || loading}
                  className="bg-emerald hover:bg-emerald/90 text-white"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('booking.loading')}...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {t('booking.confirm')}
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
