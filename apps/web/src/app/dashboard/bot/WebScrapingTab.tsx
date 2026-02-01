"use client";

import { useState } from "react";
import { Globe, Eye, Loader2, Check, X, AlertCircle } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

interface WebScrapingTabProps {
  botId: string;
  apiBaseUrl: string;
}

interface ScrapedLink {
  url: string;
  text: string;
  title?: string;
  snippet?: string;
}

interface LinkPreview {
  url: string;
  title: string;
  description: string;
  content: string;
  contentPreview: string;
}

type ToastType = "success" | "error" | "info";

export default function WebScrapingTab({ botId, apiBaseUrl }: WebScrapingTabProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [isScrapingLinks, setIsScrapingLinks] = useState(false);
  const [isDiscoveringWithSitemap, setIsDiscoveringWithSitemap] = useState(false);
  const [links, setLinks] = useState<ScrapedLink[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Retry logic with exponential backoff
  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    maxRetries = 3
  ): Promise<Response> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, { ...options, credentials: 'include' });

        // If rate limited, retry with exponential backoff
        if (response.status === 429 || response.status === 403) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            showToast(t('bot.scraping.rateLimited').replace('{delay}', String(delay / 1000)), "info");
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        return response;
      } catch (err) {
        lastError = err as Error;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    throw lastError || new Error("Request failed after retries");
  };

  const handleScrapeLinks = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      showToast(t('bot.scraping.enterUrl'), "error");
      return;
    }

    // Validate URL format
    try {
      new URL(url.trim());
    } catch {
      showToast(t('bot.scraping.invalidUrl'), "error");
      return;
    }

    setIsScrapingLinks(true);
    setLinks([]);
    setSelectedUrls(new Set());

    try {
      const response = await fetchWithRetry(
        `${apiBaseUrl}/api/v1/scrape`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: url.trim() }),
        }
      );

      if (!response.ok) {
        let errorMessage = t('bot.scraping.failedToScrape').replace('{status}', String(response.status));
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setLinks(data.links || []);
      showToast(t('bot.scraping.foundLinks').replace('{count}', String(data.totalLinks)), "success");
    } catch (err: any) {
      showToast(err.message || t('bot.scraping.failedToScrape').replace('{status}', ''), "error");
    } finally {
      setIsScrapingLinks(false);
    }
  };

  const handleDiscoverWithSitemap = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      showToast(t('bot.scraping.enterUrl'), "error");
      return;
    }

    // Validate URL format
    try {
      new URL(url.trim());
    } catch {
      showToast(t('bot.scraping.invalidUrl'), "error");
      return;
    }

    setIsDiscoveringWithSitemap(true);
    setLinks([]);
    setSelectedUrls(new Set());

    try {
      const response = await fetchWithRetry(
        `${apiBaseUrl}/api/v1/bots/${botId}/discover-links`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: url.trim() }),
        }
      );

      if (!response.ok) {
        let errorMessage = t('bot.scraping.failedToDiscover').replace('{status}', String(response.status));
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Transform the response to match ScrapedLink interface
      const transformedLinks = (data.links || []).map((link: any) => ({
        url: link.url,
        text: link.title || link.url,
        title: link.title,
        snippet: link.snippet,
      }));
      setLinks(transformedLinks);

      const strategy = data.strategy === 'sitemap' ? 'sitemap' : 'full crawl';
      showToast(t('bot.scraping.foundLinksViaSitemap').replace('{count}', String(data.count)).replace('{strategy}', strategy), "success");
    } catch (err: any) {
      showToast(err.message || t('bot.scraping.failedToDiscover').replace('{status}', ''), "error");
    } finally {
      setIsDiscoveringWithSitemap(false);
    }
  };

  const handlePreview = async (linkUrl: string) => {
    setPreviewUrl(linkUrl);
    setPreview(null);
    setIsLoadingPreview(true);

    try {
      const response = await fetchWithRetry(
        `${apiBaseUrl}/api/v1/scrape?url=${encodeURIComponent(linkUrl)}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to preview (${response.status})`);
      }

      const data = await response.json();
      setPreview(data);
    } catch (err: any) {
      showToast(err.message || t('bot.scraping.failedToLoad'), "error");
      setPreviewUrl(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleToggleSelect = (linkUrl: string) => {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(linkUrl)) {
      newSelected.delete(linkUrl);
    } else {
      newSelected.add(linkUrl);
    }
    setSelectedUrls(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUrls.size === links.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(links.map(link => link.url)));
    }
  };

  const handleAddToTraining = async () => {
    if (selectedUrls.size === 0) {
      showToast(t('bot.scraping.selectAtLeastOne'), "error");
      return;
    }

    setIsSaving(true);
    const selectedLinks = links.filter(link => selectedUrls.has(link.url));
    let successCount = 0;
    let failCount = 0;

    try {
      for (const link of selectedLinks) {
        try {
          // First, get the content preview
          const previewResponse = await fetchWithRetry(
            `${apiBaseUrl}/api/v1/scrape?url=${encodeURIComponent(link.url)}`,
            {
              method: "GET",
            }
          );

          if (!previewResponse.ok) {
            failCount++;
            continue;
          }

          const previewData = await previewResponse.json();

          // Then save as Document
          const saveResponse = await fetchWithRetry(
            `${apiBaseUrl}/api/v1/bots/${botId}/documents`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                title: previewData.title || link.text || link.url,
                content: previewData.content || previewData.description || "",
                metadata: {
                  sourceUrl: link.url,
                  scrapedAt: new Date().toISOString(),
                },
              }),
            }
          );

          if (saveResponse.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;
        }
      }

      if (successCount > 0) {
        const plural = successCount > 1 ? 's' : '';
        showToast(
          t('bot.scraping.addedSuccessfully').replace('{count}', String(successCount)).replace('{plural}', plural),
          "success"
        );
        // Clear selection
        setSelectedUrls(new Set());
      }

      if (failCount > 0) {
        const plural = failCount > 1 ? 's' : '';
        showToast(t('bot.scraping.failedToAdd').replace('{count}', String(failCount)).replace('{plural}', plural), "error");
      }
    } catch (err: any) {
      showToast(err.message || t('bot.scraping.failedToAdd').replace('{count}', '0').replace('{plural}', 's'), "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
            toast.type === "success"
              ? "bg-green-500/10 border border-green-500/20 text-green-300"
              : toast.type === "error"
              ? "bg-red-500/10 border border-red-500/20 text-red-900"
              : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
          }`}
        >
          {toast.type === "success" && <Check size={20} />}
          {toast.type === "error" && <X size={20} />}
          {toast.type === "info" && <AlertCircle size={20} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-charcoal mb-2">{t('bot.scraping.title')}</h2>
        <p className="text-sm text-silver-600">
          {t('bot.scraping.subtitleDetailed')}
        </p>
      </div>

      {/* Scrape Form */}
      <form onSubmit={handleScrapeLinks} className="glass-effect backdrop-blur-md rounded-lg border p-6">
        <div className="flex flex-col gap-4">
          <label htmlFor="url" className="text-sm font-medium text-silver-600">
            {t('bot.scraping.url')}
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('bot.scraping.urlPlaceholder')}
              className="flex-1 px-3 py-2 border border-silver-200/70 rounded-lg text-sm text-charcoal placeholder:text-silver-400 focus:outline-none focus:ring-2 focus:ring-emerald/20 bg-pearl-50"
              disabled={isScrapingLinks || isDiscoveringWithSitemap}
            />
            <button
              type="submit"
              disabled={isScrapingLinks || isDiscoveringWithSitemap}
              className="px-6 py-2 bg-charcoal text-white rounded-lg text-sm font-medium hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isScrapingLinks ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('bot.scraping.scraping')}
                </>
              ) : (
                <>
                  <Globe size={16} />
                  {t('bot.scraping.findLinks')}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDiscoverWithSitemap}
              disabled={isScrapingLinks || isDiscoveringWithSitemap}
              className="px-6 py-2 bg-charcoal text-white rounded-lg text-sm font-medium hover:bg-charcoal/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDiscoveringWithSitemap ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('bot.scraping.discovering')}
                </>
              ) : (
                <>
                  <Globe size={16} />
                  {t('bot.scraping.findLinksWithSitemap')}
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-silver-500">
            {t('bot.scraping.instructions')}
          </p>
        </div>
      </form>

      {/* Links Table */}
      {links.length > 0 && (
        <div className="glass-effect backdrop-blur-md rounded-lg border">
          {/* Header with Select All and Add to Training */}
          <div className="px-6 py-4 border-b bg-pearl-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUrls.size === links.length && links.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-silver-700 rounded border-silver-200/70 focus:ring-emerald/20"
                />
                <span className="text-sm font-medium text-silver-600">
                  {t('bot.scraping.selectAll').replace('{count}', String(links.length))}
                </span>
              </label>
              <span className="text-sm text-silver-500">
                {t('bot.scraping.selected').replace('{count}', String(selectedUrls.size))}
              </span>
            </div>
            <button
              onClick={handleAddToTraining}
              disabled={selectedUrls.size === 0 || isSaving}
              className="px-4 py-2 bg-green-600 text-charcoal rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('bot.scraping.saving')}
                </>
              ) : (
                <>{t('bot.scraping.addToTraining')}</>
              )}
            </button>
          </div>

          {/* Links List */}
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {links.map((link, index) => (
              <div
                key={`${link.url}-${index}`}
                className="px-6 py-4 hover:bg-pearl-100/60 flex items-start gap-4"
              >
                <input
                  type="checkbox"
                  checked={selectedUrls.has(link.url)}
                  onChange={() => handleToggleSelect(link.url)}
                  className="mt-1 w-4 h-4 text-silver-700 rounded border-silver-200/70 focus:ring-emerald/20 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal break-words">
                    {link.title || link.text || "No title"}
                  </p>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline break-all"
                  >
                    {link.url}
                  </a>
                  {link.snippet && (
                    <p className="text-xs text-silver-600 mt-1 line-clamp-2">
                      {link.snippet}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handlePreview(link.url)}
                  className="flex-shrink-0 px-3 py-1.5 border border-silver-200/70 rounded-lg text-xs font-medium text-silver-600 hover:bg-pearl-100/60 flex items-center gap-1.5"
                >
                  <Eye size={14} />
                  {t('bot.scraping.preview')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="glass-effect backdrop-blur-md rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-charcoal">{t('bot.scraping.contentPreview')}</h3>
              <button
                onClick={() => setPreviewUrl(null)}
                className="p-2 hover:bg-pearl-100/60 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingPreview ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-silver-600" />
                </div>
              ) : preview ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <h4 className="text-xl font-semibold text-charcoal mb-2">
                      {preview.title}
                    </h4>
                    <a
                      href={preview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {preview.url}
                    </a>
                  </div>

                  {preview.description && (
                    <div>
                      <p className="text-sm font-medium text-silver-600 mb-1">Description</p>
                      <p className="text-sm text-silver-600">{preview.description}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-silver-600 mb-1">{t('bot.scraping.contentPreview')}</p>
                    <div className="text-sm text-silver-600 whitespace-pre-wrap bg-pearl-50 p-4 rounded-lg border">
                      {preview.contentPreview || t('bot.scraping.noContent')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-silver-600 py-12">
                  {t('bot.scraping.failedToLoad')}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-pearl-50 flex justify-end">
              <button
                onClick={() => setPreviewUrl(null)}
                className="px-4 py-2 bg-gray-200 text-charcoal rounded-lg text-sm font-medium hover:bg-gray-300"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-300 mb-2">{t('bot.scraping.howItWorks')}</p>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-300">
          <li>{t('bot.scraping.step1')}</li>
          <li>{t('bot.scraping.step2')}</li>
          <li>{t('bot.scraping.step3')}</li>
          <li>{t('bot.scraping.step4')}</li>
          <li>{t('bot.scraping.step5')}</li>
        </ul>
      </div>
    </div>
  );
}

