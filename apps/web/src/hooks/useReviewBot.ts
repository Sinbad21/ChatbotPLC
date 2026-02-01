import { useState, useEffect, useCallback } from 'react';
import type {
  ReviewBot,
  ReviewBotStats,
  ReviewActivity,
  ReviewBotWizardConfig,
  ApiResponse,
} from '@/types/review-bot';

import { authFetch } from '@/lib/authHeaders';


// ============================================
// HOOK: useReviewBot
// ============================================

export function useReviewBot() {
  const [reviewBot, setReviewBot] = useState<ReviewBot | null>(null);
  const [reviewBots, setReviewBots] = useState<ReviewBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all review bots for organization
  const fetchReviewBots = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/review-bot`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      
      const data: ApiResponse<ReviewBot[]> = await res.json();
      
      if (data.success && data.data) {
        setReviewBots(data.data);
        // Set first bot as active if exists
        if (data.data.length > 0) {
          setReviewBot(data.data[0]);
        }
      } else {
        setError(data.error || 'Failed to fetch review bots');
      }
    } catch (err) {
      console.error('Error fetching review bots:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single review bot by ID
  const fetchReviewBot = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/review-bot/${id}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      const data: ApiResponse<ReviewBot> = await res.json();

      if (data.success && data.data) {
        setReviewBot(data.data);
        return data.data;
      } else {
        setError(data.error || 'Failed to fetch review bot');
        return null;
      }
    } catch (err) {
      console.error('Error fetching review bot:', err);
      setError('Network error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new review bot
  const createReviewBot = useCallback(async (config: ReviewBotWizardConfig) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/review-bot`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify(config),
      });
      
      const data: ApiResponse<ReviewBot> = await res.json();
      
      if (data.success && data.data) {
        setReviewBot(data.data);
        setReviewBots(prev => [...prev, data.data!]);
        return data.data;
      } else {
        setError(data.error || 'Failed to create review bot');
        return null;
      }
    } catch (err) {
      console.error('Error creating review bot:', err);
      setError('Network error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update review bot
  const updateReviewBot = useCallback(async (id: string, updates: Partial<ReviewBot>) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/review-bot/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      
      const data: ApiResponse<ReviewBot> = await res.json();
      
      if (data.success && data.data) {
        setReviewBot(data.data);
        setReviewBots(prev => prev.map(bot => bot.id === id ? data.data! : bot));
        return data.data;
      } else {
        setError(data.error || 'Failed to update review bot');
        return null;
      }
    } catch (err) {
      console.error('Error updating review bot:', err);
      setError('Network error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete review bot
  const deleteReviewBot = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/review-bot/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      
      const data: ApiResponse<void> = await res.json();
      
      if (data.success) {
        setReviewBot(null);
        setReviewBots(prev => prev.filter(bot => bot.id !== id));
        return true;
      } else {
        setError(data.error || 'Failed to delete review bot');
        return false;
      }
    } catch (err) {
      console.error('Error deleting review bot:', err);
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle active status
  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    return updateReviewBot(id, { isActive });
  }, [updateReviewBot]);

  // Initial fetch
  useEffect(() => {
    fetchReviewBots();
  }, [fetchReviewBots]);

  return {
    // State
    reviewBot,
    reviewBots,
    loading,
    error,
    
    // Actions
    fetchReviewBots,
    fetchReviewBot,
    createReviewBot,
    updateReviewBot,
    deleteReviewBot,
    toggleActive,
    
    // Setters
    setReviewBot,
    setError,
  };
}

// ============================================
// HOOK: useReviewBotStats
// ============================================

export function useReviewBotStats(reviewBotId: string | null) {
  const [stats, setStats] = useState<ReviewBotStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!reviewBotId) return;
    
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/review-bot/${reviewBotId}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      const data: ApiResponse<ReviewBot> = await res.json();
      
      if (data.success && data.data) {
        setStats({
          totalRequests: data.data.totalRequests || 0,
          totalResponses: data.data.totalResponses || 0,
          responseRate: data.data.responseRate || 0,
          totalPositive: data.data.totalPositive || 0,
          totalNegative: data.data.totalNegative || 0,
          positiveRate: data.data.positiveRate || 0,
          totalGoogleClicks: data.data.totalGoogleClicks || 0,
          googleClickRate: data.data.googleClickRate || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, [reviewBotId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

// ============================================
// HOOK: useReviewActivity
// ============================================

export function useReviewActivity(reviewBotId: string | null, limit = 10) {
  const [activities, setActivities] = useState<ReviewActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivity = useCallback(async () => {
    if (!reviewBotId) return;
    
    setLoading(true);
    
    try {
      const res = await fetch(
        `${API_BASE}/api/review-bot/${reviewBotId}?includeActivity=true&limit=${limit}`,
        { credentials: 'include', headers: getAuthHeaders() }
      );
      
      const data = await res.json();
      
      if (data.success && data.data?.reviewRequests) {
        const recentActivities: ReviewActivity[] = data.data.reviewRequests
          .filter((req: any) => req.responses?.length > 0)
          .map((req: any) => {
            const response = req.responses[0];
            return {
              id: response.id,
              rating: response.rating,
              customerName: req.customerName || 'Cliente',
              feedbackText: response.feedbackText,
              clickedGoogleReview: response.clickedGoogleReview,
              createdAt: response.createdAt,
            };
          });
        
        setActivities(recentActivities);
      }
    } catch (err) {
      console.error('Error fetching activity:', err);
    } finally {
      setLoading(false);
    }
  }, [reviewBotId, limit]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return { activities, loading, refetch: fetchActivity };
}

// Default export
export default useReviewBot;
