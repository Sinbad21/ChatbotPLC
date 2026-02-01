'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileText,
  ExternalLink,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface MatchResult {
  id: string;
  matchedText: string;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'partial';
  sourceUrl?: string;
  sourceTitle?: string;
  sourceExcerpt?: string;
  addedToDocs: boolean;
  clicked: boolean;
}

interface OCRMatchResultsProps {
  ocrResultId: string;
  botId: string;
  onClose: () => void;
}

export function OCRMatchResults({ ocrResultId, botId, onClose }: OCRMatchResultsProps) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [ocrText, setOCRText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [addingToDocs, setAddingToDocs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOCRResult();
    fetchMatches();
  }, [ocrResultId]);

  const fetchOCRResult = async () => {
    try {
      const response = await fetch(`/api/ocr/results/${ocrResultId}`);
      const data = await response.json();
      setOCRText(data.result.text);
    } catch (err) {
      console.error('Failed to fetch OCR result:', err);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, check if matches already exist
      let response = await fetch(`/api/ocr/matches/${ocrResultId}`);
      let data = await response.json();

      // If no matches exist, perform matching
      if (!data.matches || data.matches.length === 0) {
        response = await fetch('/api/ocr/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ocrResultId,
            botId,
            threshold: 0.7,
            maxResults: 10,
            includePartialMatches: true,
          }),
        });
        data = await response.json();
      }

      setMatches(data.matches || []);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      setError('Failed to load match results');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToDocs = async (matchId: string) => {
    setAddingToDocs((prev) => new Set(prev).add(matchId));

    try {
      const response = await fetch(`/api/ocr/matches/${matchId}/add-to-docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId }),
      });

      if (response.ok) {
        // Update match in local state
        setMatches((prev) =>
          prev.map((m) =>
            m.id === matchId ? { ...m, addedToDocs: true } : m
          )
        );
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add to documents');
      }
    } catch (err) {
      console.error('Failed to add to docs:', err);
      alert('Failed to add to documents');
    } finally {
      setAddingToDocs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(matchId);
        return newSet;
      });
    }
  };

  const handleMatchClick = async (matchId: string, sourceUrl?: string) => {
    // Track click
    try {
      await fetch(`/api/ocr/matches/${matchId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clicked: true }),
      });

      // Update local state
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, clicked: true } : m))
      );
    } catch (err) {
      console.error('Failed to track feedback:', err);
    }

    // Open URL if available
    if (sourceUrl) {
      window.open(sourceUrl, '_blank');
    }
  };

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'exact':
        return 'bg-emerald text-white';
      case 'fuzzy':
        return 'bg-blue-500 text-white';
      case 'partial':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-emerald';
    if (score >= 0.75) return 'text-blue-600';
    if (score >= 0.6) return 'text-amber-600';
    return 'text-muted-gray';
  };

  if (loading) {
    return (
      <Card className="max-w-3xl w-full bg-white shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald mx-auto mb-4"></div>
        <p className="text-charcoal/70">Searching for matches...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-3xl w-full bg-white shadow-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-charcoal">Error</p>
            <p className="text-sm text-muted-gray mt-1">{error}</p>
          </div>
        </div>
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl w-full bg-white shadow-lg max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald" />
            <h3 className="text-xl font-semibold text-charcoal">Match Results</h3>
          </div>
          <button onClick={onClose} className="text-muted-gray hover:text-charcoal">
            ✕
          </button>
        </div>

        {/* OCR Text Preview */}
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs font-medium text-muted-gray mb-1">Extracted Text:</p>
          <p className="text-sm text-charcoal line-clamp-2">{ocrText}</p>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6">
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-muted-gray/50 mx-auto mb-4" />
            <p className="text-lg font-medium text-charcoal mb-2">No Matches Found</p>
            <p className="text-muted-gray max-w-md mx-auto">
              We couldn't find any similar content in your knowledge base. The extracted text may be unique or require different matching criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-gray">
                Found {matches.length} {matches.length === 1 ? 'match' : 'matches'}
              </p>
              <Badge variant="outline" className="bg-emerald/10 text-emerald border-emerald/20">
                Threshold: 70%
              </Badge>
            </div>

            {matches.map((match, index) => (
              <Card key={match.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getMatchTypeColor(match.matchType)}>
                        {match.matchType}
                      </Badge>
                      <span className={`text-sm font-semibold ${getScoreColor(match.score)}`}>
                        {(match.score * 100).toFixed(0)}% match
                      </span>
                      {match.sourceTitle && (
                        <span className="text-sm text-charcoal font-medium">
                          • {match.sourceTitle}
                        </span>
                      )}
                    </div>

                    {/* Matched Text Preview */}
                    <p className="text-sm text-charcoal bg-emerald/5 p-2 rounded border border-emerald/20 mb-2">
                      "{match.matchedText.slice(0, 150)}
                      {match.matchedText.length > 150 ? '...' : ''}"
                    </p>

                    {/* Source Excerpt (Expandable) */}
                    {match.sourceExcerpt && (
                      <div>
                        <button
                          onClick={() =>
                            setExpandedMatch(
                              expandedMatch === match.id ? null : match.id
                            )
                          }
                          className="flex items-center gap-1 text-sm text-emerald hover:underline mb-1"
                        >
                          {expandedMatch === match.id ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide context
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Show context
                            </>
                          )}
                        </button>

                        {expandedMatch === match.id && (
                          <div className="p-3 bg-slate-50 rounded text-sm text-charcoal border border-slate-200">
                            {match.sourceExcerpt}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {match.sourceUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMatchClick(match.id, match.sourceUrl)}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    )}

                    {match.addedToDocs ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="bg-emerald/10 text-emerald border-emerald/20"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Added
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToDocs(match.id)}
                        disabled={addingToDocs.has(match.id)}
                        className="hover:bg-emerald hover:text-white hover:border-emerald"
                      >
                        {addingToDocs.has(match.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1"></div>
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Add to Docs
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4 flex justify-between items-center flex-shrink-0">
        <p className="text-sm text-muted-gray">
          Matches are ranked by similarity score
        </p>
        <Button onClick={onClose} className="bg-emerald hover:bg-emerald/90 text-white">
          Done
        </Button>
      </div>
    </Card>
  );
}
