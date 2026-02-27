"use client";

import { useState } from "react";
import { FileText, RefreshCw, Loader2, AlertTriangle } from "lucide-react";

interface SessionSummaryManagerProps {
  sessionId: string;
  initialSummary?: {
    summary: string;
    safetyFlags?: string | null;
  } | null;
}

export default function SessionSummaryManager({
  sessionId,
  initialSummary,
}: SessionSummaryManagerProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSummarize = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/summary`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate summary");
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      {!summary ? (
        <div className="flex items-center justify-between p-4 rounded-lg border border-dashed border-gray-200 bg-background">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText size={16} />
            <span>No summary generated for this session.</span>
          </div>
          <button
            onClick={handleSummarize}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Summarize Session
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-700 bg-background p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center">
                <FileText size={14} className="text-white" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Clinical Note
              </span>
            </div>
            <button
              onClick={handleSummarize}
              disabled={loading}
              title="Refresh Summary"
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="prose prose-sm max-w-none text-white text-sm whitespace-pre-wrap leading-relaxed">
            {summary.summary}
          </div>

          {summary.safetyFlags && (
            <div className="mt-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-800 border border-red-100">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">
                  Safety Concern Detected
                </p>
                <p className="mt-0.5">{summary.safetyFlags}</p>
              </div>
            </div>
          )}
        </div>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}
