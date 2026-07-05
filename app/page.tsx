"use client";

import { useEffect, useState } from "react";

interface Highlight {
  id: string;
  text: string;
  url: string;
  title: string;
  timestamp: string;
  summary?: string;
}

interface Toast {
  id: string;
  title: string;
  description: string;
  variant: "default" | "destructive" | "success";
}

export default function Home() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showAlertClearAll, setShowAlertClearAll] = useState(false);
  const [highlightToDelete, setHighlightToDelete] = useState<string | null>(null);
  const [loadingSummaries, setLoadingSummaries] = useState<{ [key: string]: boolean }>({});
  const [savingKey, setSavingKey] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast Helper
  const addToast = (title: string, description: string, variant: "default" | "destructive" | "success" = "default") => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Fetch highlights
  const fetchHighlights = async () => {
    try {
      const res = await fetch("/api/highlights");
      if (res.ok) {
        const data = await res.json();
        setHighlights(data);
      }
    } catch (err) {
      console.error("Error fetching highlights:", err);
      addToast("Connection Error", "Could not load highlights from server.", "destructive");
    }
  };

  useEffect(() => {
    fetchHighlights();
    const storedKey = localStorage.getItem("openai_api_key");
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  // Save API key
  const handleSaveApiKey = () => {
    setSavingKey(true);
    localStorage.setItem("openai_api_key", apiKey);
    setTimeout(() => {
      setSavingKey(false);
      setShowSettings(false);
      addToast("Settings Saved", "Your OpenAI API key has been stored locally.", "success");
    }, 800);
  };

  // Delete highlight
  const handleDeleteHighlight = async (id: string) => {
    try {
      const res = await fetch(`/api/highlights?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setHighlights(prev => prev.filter(hl => hl.id !== id));
        addToast("Highlight Deleted", "The selected highlight has been removed.", "default");
      } else {
        throw new Error();
      }
    } catch (err) {
      addToast("Error", "Could not delete highlight. Please try again.", "destructive");
    }
  };

  // Clear all highlights
  const handleClearAll = async () => {
    try {
      const res = await fetch("/api/highlights", {
        method: "DELETE",
      });
      if (res.ok) {
        setHighlights([]);
        setShowAlertClearAll(false);
        addToast("All Cleared", "All saved highlights have been deleted.", "success");
      } else {
        throw new Error();
      }
    } catch (err) {
      addToast("Error", "Failed to delete highlights.", "destructive");
    }
  };

  // Generate summary
  const handleGenerateSummary = async (highlight: Highlight) => {
    if (loadingSummaries[highlight.id]) return;

    if (!apiKey) {
      setShowSettings(true);
      addToast("API Key Required", "Please enter your OpenAI API key to get AI summaries.", "destructive");
      return;
    }

    setLoadingSummaries(prev => ({ ...prev, [highlight.id]: true }));

    try {
      const res = await fetch("/api/highlights/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: highlight.id,
          text: highlight.text,
          apiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setHighlights(prev =>
        prev.map(hl => (hl.id === highlight.id ? { ...hl, summary: data.summary } : hl))
      );
      addToast("Summary Generated", "AI summary added successfully.", "success");
    } catch (err: any) {
      console.error(err);
      addToast("API Error", err.message || "Failed to call OpenAI service.", "destructive");
    } finally {
      setLoadingSummaries(prev => ({ ...prev, [highlight.id]: false }));
    }
  };

  // Filters
  const filteredHighlights = highlights.filter(hl =>
    hl.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hl.url.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_45%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_40%)] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-900 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">✨</span>
            <h1 className="text-xl font-bold bg-linear-to-r from-slate-100 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Highlighter Web
            </h1>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 hover:text-slate-100 text-slate-300 transition-all cursor-pointer shadow-sm"
          >
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            API Settings
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 mt-10">
        
        {/* Shadcn-like Dialog: Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowSettings(false)}
                className="absolute right-4 top-4 p-1.5 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              
              <div className="flex flex-col gap-1.5 mb-6">
                <h3 className="text-lg font-semibold text-slate-100">
                  OpenAI Configuration
                </h3>
                <p className="text-xs text-slate-400">
                  Configure your API key to request text highlights summaries.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="api-key" className="text-xs font-medium text-slate-300">
                    API Key
                  </label>
                  <input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 rounded-lg px-4 py-2 text-sm outline-none transition-colors"
                  />
                  <p className="text-[10px] text-slate-500">
                    Stored strictly in your local browser sandbox and never shared.
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveApiKey}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {savingKey ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shadcn-like Alert Dialog: Clear All Confirmation */}
        {showAlertClearAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex flex-col gap-1.5 mb-6">
                <h3 className="text-lg font-semibold text-slate-100">
                  Are you absolutely sure?
                </h3>
                <p className="text-sm text-slate-400">
                  This action cannot be undone. This will permanently delete all highlights from your local files and reset the list.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAlertClearAll(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-colors cursor-pointer"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shadcn-like Alert Dialog: Individual Delete Confirmation */}
        {highlightToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex flex-col gap-1.5 mb-6">
                <h3 className="text-lg font-semibold text-slate-100">
                  Delete Highlight?
                </h3>
                <p className="text-sm text-slate-400">
                  Are you sure you want to delete this highlight? This action cannot be undone.
                </p>
                <div className="mt-3 bg-slate-950 p-3 rounded-lg border border-slate-850 text-xs italic text-slate-400 max-h-24 overflow-y-auto font-serif">
                  "{highlights.find(h => h.id === highlightToDelete)?.text}"
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setHighlightToDelete(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteHighlight(highlightToDelete);
                    setHighlightToDelete(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/30 border border-slate-900/80 rounded-xl p-4 backdrop-blur-sm mb-8">
          <div className="relative grow max-w-xl">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search saved highlights..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 rounded-lg pl-10 pr-10 py-2 text-sm outline-none transition-all placeholder-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 px-1"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {filteredHighlights.length} of {highlights.length} clips
            </span>
            <button
              onClick={() => setShowAlertClearAll(true)}
              disabled={highlights.length === 0}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-rose-950/20 bg-rose-950/10 hover:bg-rose-900/20 hover:text-rose-300 text-rose-400 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Grid display */}
        {filteredHighlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 bg-slate-900/10 border border-slate-900/50 rounded-2xl">
            <div className="text-5xl mb-4 opacity-40">📂</div>
            <h3 className="text-md font-bold text-slate-300 mb-1">No highlights found</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              {searchQuery ? "No matching queries." : "Select and highlight text on Chrome tabs to populate this dashboard."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredHighlights.map(hl => {
              let hostname = "";
              try {
                hostname = new URL(hl.url).hostname;
              } catch (e) {
                hostname = hl.url;
              }

              const formattedDate = new Date(hl.timestamp).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div
                  key={hl.id}
                  className="flex flex-col justify-between bg-slate-900/20 border border-slate-900/50 rounded-xl p-5 hover:border-slate-800 hover:bg-slate-900/40 hover:-translate-y-0.5 transition-all shadow-lg"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex flex-col">
                        <a
                          href={hl.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                          {hostname}
                        </a>
                        <span className="text-[10px] text-slate-500 mt-0.5" title={hl.title}>{formattedDate}</span>
                      </div>
                      <button
                        onClick={() => setHighlightToDelete(hl.id)}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-rose-950/20 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete highlight"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>

                    <blockquote className="border-l border-indigo-500/70 pl-4 text-slate-200 text-sm leading-relaxed italic mb-4 whitespace-pre-wrap wrap-break-word font-serif">
                      "{hl.text}"
                    </blockquote>
                  </div>

                  {/* Summary Block */}
                  <div className="mt-4 pt-4 border-t border-slate-900/60">
                    {hl.summary ? (
                      <div className="bg-indigo-950/15 border border-indigo-900/20 rounded-lg p-3 text-xs">
                        <div className="flex items-center gap-1.5 text-indigo-400 font-bold uppercase tracking-wider text-[9px] mb-1">
                          <span>✨</span> AI Summary
                        </div>
                        <p className="text-slate-300">{hl.summary}</p>
                      </div>
                    ) : loadingSummaries[hl.id] ? (
                      <div className="space-y-2 py-1">
                        <div className="h-3 bg-slate-900 rounded animate-pulse w-full" />
                        <div className="h-3 bg-slate-900 rounded animate-pulse w-5/6" />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateSummary(hl)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600/10 border border-indigo-500/10 hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 transition-all cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        Summarize with AI
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Shadcn-like Toaster Notification Portal */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-sm animate-in slide-in-from-bottom-5 duration-300 ${
              toast.variant === "destructive"
                ? "bg-rose-950/80 border-rose-900 text-rose-100"
                : toast.variant === "success"
                ? "bg-emerald-950/80 border-emerald-900 text-emerald-100"
                : "bg-slate-900/90 border-slate-800 text-slate-100"
            }`}
          >
            <div className="grow">
              <h4 className="text-xs font-semibold">{toast.title}</h4>
              <p className="text-[11px] opacity-80 mt-1">{toast.description}</p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
