"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export function AiReplyAssistant({
  leadId,
  hasOpenAI,
}: {
  leadId: string;
  hasOpenAI: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = (await res.json()) as { draft?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to generate draft.");
      setDraft(data.draft ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function copyDraft() {
    if (!draft) return;
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          AI reply assistant
        </h2>
        {!hasOpenAI && (
          <span className="text-xs text-muted-foreground">
            OPENAI_API_KEY not configured
          </span>
        )}
      </div>

      {/* Generate / Regenerate button */}
      {!draft && (
        <>
          <button
            onClick={generate}
            disabled={!hasOpenAI || loading}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            <Sparkles size={14} aria-hidden />
            {loading ? "Generating…" : "Generate safe reply draft"}
          </button>
          {!hasOpenAI && (
            <p className="text-xs text-muted-foreground">
              Set <code className="rounded bg-muted px-1 font-mono">OPENAI_API_KEY</code> in your environment to enable this feature.
            </p>
          )}
        </>
      )}

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {draft !== null && (
        <div className="space-y-3">
          {/* Mandatory safety warning */}
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800/60 dark:bg-amber-950/40">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Review before use. Do not use AI text for clinical advice.
            </p>
          </div>

          {/* Editable draft */}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={10}
            className="input resize-y text-sm leading-relaxed"
            aria-label="Reply draft — editable"
          />

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copyDraft}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>

            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
            >
              <Sparkles size={12} aria-hidden />
              {loading ? "Generating…" : "Regenerate"}
            </button>

            <button
              onClick={() => { setDraft(null); setError(null); }}
              className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
