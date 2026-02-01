'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

interface WidgetConfig {
  businessName: string;
  googleReviewUrl: string;
  thankYouMessage: string;
  surveyQuestion: string;
  positiveMessage: string;
  negativeMessage: string;
  completedMessage: string;
  surveyType: 'EMOJI' | 'STARS' | 'NPS';
  positiveThreshold: number;
  widgetColor: string;
  widgetPosition: 'bottom-right' | 'bottom-left';
  delaySeconds: number;
}

type Step = 'loading' | 'survey' | 'positive' | 'negative' | 'completed' | 'error' | 'already-responded';

function ReviewWidgetContent() {
  const searchParams = useSearchParams();
  const widgetId = searchParams.get('widgetId') || searchParams.get('id');
  
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [step, setStep] = useState<Step>('loading');
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    // Generate or retrieve session ID
    const storedSession = localStorage.getItem(`rb_session_${widgetId}`);
    if (storedSession) {
      setSessionId(storedSession);
    } else {
      const newSession = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(`rb_session_${widgetId}`, newSession);
      setSessionId(newSession);
    }

    // Check if already responded
    const hasResponded = localStorage.getItem(`rb_responded_${widgetId}`);
    if (hasResponded) {
      setStep('already-responded');
      return;
    }

    // Fetch config
    if (widgetId) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.chatbotstudio.io'}/api/review-widget/${widgetId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setConfig(data.data);
            setStep('survey');
            
            // Show widget after delay
            setTimeout(() => {
              setIsVisible(true);
            }, (data.data.delaySeconds || 2) * 1000);
          } else {
            setStep('error');
          }
        })
        .catch(() => setStep('error'));
    } else {
      setStep('error');
    }
  }, [widgetId]);

  const handleRating = (value: number) => {
    setRating(value);
    if (!config) return;

    if (value >= config.positiveThreshold) {
      setStep('positive');
    } else {
      setStep('negative');
    }

    // Submit initial rating
    submitResponse(value, null);
  };

  const submitResponse = async (ratingValue: number, feedbackText: string | null) => {
    if (!widgetId) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.chatbotstudio.io'}/api/review-widget/${widgetId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          rating: ratingValue,
          feedback: feedbackText,
          ratingType: config?.surveyType || 'STARS'
        })
      });

      if (feedbackText !== null) {
        localStorage.setItem(`rb_responded_${widgetId}`, 'true');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  const handleFeedbackSubmit = () => {
    if (rating) {
      submitResponse(rating, feedback);
      setStep('completed');
      setTimeout(() => setIsVisible(false), 3000);
    }
  };

  const handleGoogleClick = () => {
    if (!widgetId) return;
    
    // Track click
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.chatbotstudio.io'}/api/review-widget/${widgetId}/google-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    localStorage.setItem(`rb_responded_${widgetId}`, 'true');
    setStep('completed');
    setTimeout(() => setIsVisible(false), 3000);
  };

  if (step === 'loading' || !config) return null;

  if (step === 'error') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
        Widget unavailable
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed z-50 transition-all duration-500 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
      style={{
        bottom: '20px',
        [config.widgetPosition.includes('right') ? 'right' : 'left']: '20px'
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl overflow-hidden w-[320px] border-l-4"
        style={{ borderLeftColor: config.widgetColor }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">{config.businessName}</h3>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'survey' && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">{config.surveyQuestion}</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onClick={() => handleRating(i)}
                    className="text-2xl hover:scale-110 transition-transform focus:outline-none"
                  >
                    {config.surveyType === 'EMOJI'
                      ? ['\\u{1F620}', '\\u{1F641}', '\\u{1F610}', '\\u{1F642}', '\\u{1F604}'][i-1]
                      : '\\u2B50'
                    }
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'positive' && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">{config.positiveMessage}</p>
              <a
                href={config.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleGoogleClick}
                className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-opacity hover:opacity-90 w-full justify-center"
                style={{ backgroundColor: config.widgetColor }}
              >
                <ExternalLink size={18} />
                Lascia una recensione
              </a>
            </div>
          )}

          {step === 'negative' && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">{config.negativeMessage}</p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Dicci come possiamo migliorare..."
                className="w-full p-3 border border-gray-200 rounded-lg mb-3 text-sm focus:outline-none focus:border-purple-500 text-gray-800"
                rows={3}
              />
              <button
                onClick={handleFeedbackSubmit}
                className="w-full py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Invia Feedback
              </button>
            </div>
          )}

          {step === 'completed' && (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">❤️</div>
              <p className="text-gray-600">{config.completedMessage}</p>
            </div>
          )}

          {step === 'already-responded' && (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">Hai già inviato una risposta. Grazie!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 text-center border-t border-gray-100">
          <a 
            href="https://chatbotstudio.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-gray-400 hover:text-gray-600"
          >
            Powered by Omnical Studio
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ReviewWidgetPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReviewWidgetContent />
    </Suspense>
  );
}
