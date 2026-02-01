'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, User, Check, ChevronRight, ChevronLeft, X, Loader2 } from 'lucide-react';

interface BookingWidgetProps {
  widgetId: string;
  apiUrl?: string; // Default to current domain
  onClose?: () => void;
  embedded?: boolean; // If true, shows as modal
}

interface WidgetConfig {
  widgetId: string;
  ownerName: string;
  config: {
    timezone: string;
    locale: string;
    slotDuration: number;
    minAdvanceBooking: number;
    maxAdvanceBooking: number;
    widgetTitle: string;
    widgetSubtitle: string;
    widgetPrimaryColor: string;
    widgetFontFamily: string;
    confirmationMessage: string;
    termsUrl?: string;
    privacyUrl?: string;
  };
}

interface TimeSlot {
  date: string;
  time: string;
  datetime: string;
}

export function BookingWidget({
  widgetId,
  apiUrl = '/api',
  onClose,
  embedded = true,
}: BookingWidgetProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Widget configuration
  const [config, setConfig] = useState<WidgetConfig | null>(null);

  // Step 1: Customer data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Date and time selection
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 3: Confirmation
  const [bookingReference, setBookingReference] = useState<string | null>(null);

  useEffect(() => {
    loadConfiguration();
  }, [widgetId]);

  useEffect(() => {
    if (config) {
      loadAvailableDates();
    }
  }, [config]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/booking/widget/${widgetId}/config`);

      if (!response.ok) {
        throw new Error('Failed to load booking configuration');
      }

      const data = await response.json();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDates = async () => {
    if (!config) return;

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + config.config.maxAdvanceBooking);

      const response = await fetch(`${apiUrl}/booking/widget/${widgetId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      const data = await response.json();

      // Extract unique dates from slots
      const dates = Array.from(
        new Set(data.slots.map((slot: TimeSlot) => slot.date as string))
      ) as string[];
      setAvailableDates(dates);
    } catch (err) {
      console.error('Failed to load available dates:', err);
    }
  };

  const loadAvailableSlots = async (date: string) => {
    if (!config) return;

    setLoadingSlots(true);
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const response = await fetch(`${apiUrl}/booking/widget/${widgetId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      const data = await response.json();

      // Filter slots for the selected date
      const slotsForDate = data.slots.filter((slot: TimeSlot) => slot.date === date);
      setAvailableSlots(slotsForDate);
    } catch (err) {
      console.error('Failed to load available slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleNext = () => {
    setError(null);

    if (step === 1) {
      // Validate customer data
      if (!firstName.trim()) {
        setError('Please enter your first name');
        return;
      }
      if (!lastName.trim()) {
        setError('Please enter your last name');
        return;
      }
      if (!phone.trim()) {
        setError('Please enter your phone number');
        return;
      }
      if (phone.length < 8) {
        setError('Please enter a valid phone number');
        return;
      }
    }

    if (step === 2) {
      if (!selectedSlot) {
        setError('Please select a date and time');
        return;
      }
    }

    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!selectedSlot) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/booking/widget/${widgetId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerFirstName: firstName,
          customerLastName: lastName,
          customerPhone: phone,
          appointmentDatetime: selectedSlot.datetime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      setBookingReference(data.booking.bookingReference);
      setStep(4); // Success step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(config?.config.locale || 'it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (time: string): string => {
    return time;
  };

  const primaryColor = config?.config.widgetPrimaryColor || '#10B981';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Failed to load booking widget</p>
      </div>
    );
  }

  return (
    <div
      className={`booking-widget ${embedded ? 'max-w-lg w-full' : 'w-full'}`}
      style={{ fontFamily: config.config.widgetFontFamily }}
    >
      <Card className="bg-white shadow-xl rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200" style={{ backgroundColor: `${primaryColor}10` }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{config.config.widgetTitle}</h2>
              {step < 4 && (
                <p className="text-sm text-gray-600 mt-1">{config.config.widgetSubtitle}</p>
              )}
            </div>
            {embedded && onClose && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Progress indicator */}
          {step < 4 && (
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: s <= step ? primaryColor : '#E5E7EB',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Customer Data */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5" style={{ color: primaryColor }} />
                <h3 className="font-semibold text-gray-900">Your Information</h3>
              </div>

              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="given-name"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Mario"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  required
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="family-name"
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Rossi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  name="tel"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 123 456 7890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll use this to confirm your appointment
                </p>
              </div>

              {(config.config.termsUrl || config.config.privacyUrl) && (
                <p className="text-xs text-gray-500 mt-4">
                  By continuing, you agree to our{' '}
                  {config.config.termsUrl && (
                    <a href={config.config.termsUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      Terms of Service
                    </a>
                  )}
                  {config.config.termsUrl && config.config.privacyUrl && ' and '}
                  {config.config.privacyUrl && (
                    <a href={config.config.privacyUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      Privacy Policy
                    </a>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                <h3 className="font-semibold text-gray-900">Choose Date & Time</h3>
              </div>

              {/* Date selection */}
              {!selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select a Date
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                    {availableDates.map((date) => (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className="p-3 rounded-lg border-2 text-center transition-colors hover:border-opacity-70"
                        style={{
                          borderColor: '#E5E7EB',
                          backgroundColor: 'white',
                        }}
                      >
                        <div className="text-xs text-gray-500">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {new Date(date).getDate()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Time slot selection */}
              {selectedDate && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {formatDate(selectedDate)} - Select Time
                    </label>
                    <button
                      onClick={() => {
                        setSelectedDate(null);
                        setSelectedSlot(null);
                      }}
                      className="text-sm underline"
                      style={{ color: primaryColor }}
                    >
                      Change Date
                    </button>
                  </div>

                  {loadingSlots ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: primaryColor }} />
                      <p className="text-sm text-gray-500 mt-2">Loading available times...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No available slots for this date</p>
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="mt-4 text-sm underline"
                        style={{ color: primaryColor }}
                      >
                        Choose Another Date
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.datetime}
                          onClick={() => setSelectedSlot(slot)}
                          className="p-3 rounded-lg border-2 text-center transition-colors"
                          style={{
                            borderColor: selectedSlot?.datetime === slot.datetime ? primaryColor : '#E5E7EB',
                            backgroundColor: selectedSlot?.datetime === slot.datetime ? `${primaryColor}10` : 'white',
                          }}
                        >
                          <Clock className="w-4 h-4 mx-auto mb-1" style={{ color: primaryColor }} />
                          <div className="text-sm font-medium text-gray-900">
                            {formatTime(slot.time)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && selectedSlot && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-5 h-5" style={{ color: primaryColor }} />
                <h3 className="font-semibold text-gray-900">Confirm Booking</h3>
              </div>

              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{firstName} {lastName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{phone}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Appointment</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedSlot.date)} at {formatTime(selectedSlot.time)}
                  </p>
                  <p className="text-sm text-gray-500">Duration: {config.config.slotDuration} minutes</p>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                You will receive a confirmation via phone. Please arrive 5 minutes early.
              </p>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && bookingReference && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                <Check className="w-8 h-8" style={{ color: primaryColor }} />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>

              <p className="text-gray-600 mb-4">{config.config.confirmationMessage}</p>

              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-1">Your booking reference</p>
                <p className="text-xl font-mono font-bold" style={{ color: primaryColor }}>
                  {bookingReference}
                </p>
              </div>

              <p className="text-sm text-gray-500">
                Please save this reference number for your records.
              </p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        {step < 4 && (
          <div className="p-6 border-t border-gray-200 flex justify-between gap-3">
            {step > 1 && (
              <Button
                onClick={() => setStep(step - 1)}
                variant="outline"
                disabled={submitting}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}

            <div className="flex-1" />

            {step < 3 && (
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && (!firstName || !lastName || !phone)) ||
                  (step === 2 && !selectedSlot)
                }
                style={{
                  backgroundColor: primaryColor,
                  color: 'white',
                }}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {step === 3 && (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  backgroundColor: primaryColor,
                  color: 'white',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="p-6 border-t border-gray-200">
            <Button
              onClick={onClose}
              className="w-full"
              style={{
                backgroundColor: primaryColor,
                color: 'white',
              }}
            >
              Close
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
