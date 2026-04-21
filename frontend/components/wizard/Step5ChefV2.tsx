"use client";

import { useState, useEffect, useRef } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { LoadingBlock } from "../ui/Spinner";
import { runParse, runChef, runEngineer } from "../../lib/api";
import { NutritionFactsTable } from "../chef/NutritionFactsTable";
import type { SyringeRecipe } from "../../lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — matches homepage / profile page aesthetic
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  ink:        "#1A1410",
  muted:      "#6B5D50",
  card:       "#FFFFFF",
  border:     "rgba(26, 20, 16, 0.12)",
  forest:     "rgb(21, 60, 54)",
  forestInk:  "#FFF4E6",
  cream:      "rgb(244, 244, 232)",
  badge:      "#354f22",
  danger:     "#c0392b",
  dangerBg:   "#fff0f0",
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────────────────────

function BookmarkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={T.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20"
      style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path d="M10 2 A8 8 0 0 1 18 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SyringeRecipeCard
// ─────────────────────────────────────────────────────────────────────────────

function SyringeRecipeCardV2({ recipe }: { recipe: SyringeRecipe }) {
  return (
    <div style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "18px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{
            width: 30, height: 30, borderRadius: "50%",
            background: T.badge, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, flexShrink: 0,
            fontFamily: "'Geist Mono', monospace",
          }}>
            {recipe.syringe_id}
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, fontFamily: "'Geist', sans-serif" }}>
              {recipe.title}
            </div>
            <div style={{ fontSize: 11, color: T.muted, fontFamily: "'Geist Mono', monospace",
              textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 1 }}>
              {recipe.label}
            </div>
          </div>
        </div>

        <div style={{ height: "1px", background: T.border, margin: "0 0 14px" }} />

        {/* Ingredients */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
            color: T.muted, marginBottom: 6, fontFamily: "'Geist Mono', monospace" }}>
            Ingredients
          </div>
          <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
            {recipe.ingredients.map((ing, i) => (
              <li key={i} style={{ fontSize: 13, color: T.ink, lineHeight: 1.7, fontFamily: "'Geist', sans-serif" }}>
                {ing}
              </li>
            ))}
          </ul>
        </div>

        {/* Preparation */}
        {recipe.instructions.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
              color: T.muted, marginBottom: 6, fontFamily: "'Geist Mono', monospace" }}>
              Preparation
            </div>
            <ol style={{ margin: 0, padding: "0 0 0 16px" }}>
              {recipe.instructions.map((step, i) => (
                <li key={i} style={{ fontSize: 13, color: T.ink, lineHeight: 1.7, fontFamily: "'Geist', sans-serif" }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shape preview
// ─────────────────────────────────────────────────────────────────────────────

const SHAPE_VARIANTS = [
  { label: "Standard", imgStyle: { transform: "none",       filter: "none" }, thumbStyle: { transform: "none",       filter: "none" } },
  { label: "Mirror",   imgStyle: { transform: "scaleX(-1)", filter: "none" }, thumbStyle: { transform: "scaleX(-1)", filter: "none" } },
  { label: "Outline",  imgStyle: { transform: "none",       filter: "opacity(0.12)" },
                       thumbStyle: { transform: "none",       filter: "opacity(0.12)" } },
];

function ContourPreviewV2({ b64, shapeName }: { b64: string | null; shapeName: string }) {
  const [selected, setSelected] = useState(0);

  const formattedName = shapeName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) + " Form";

  const active = SHAPE_VARIANTS[selected];

  return (
    <div style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 16,
      padding: 16, display: "flex", flexDirection: "column", gap: 10,
      height: "100%", boxSizing: "border-box" }}>

      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.ink, fontFamily: "'Geist', sans-serif" }}>
          Shape Preview
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2,
          fontFamily: "'Geist Mono', monospace", letterSpacing: "0.04em" }}>
          {formattedName} · {active.label}
        </div>
      </div>

      {/* Main image */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {b64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${b64}`}
            alt={`Food silhouette — ${active.label}`}
            style={{ width: "100%", maxHeight: 180, objectFit: "contain",
              imageRendering: "pixelated",
              transition: "transform 0.25s ease, filter 0.25s ease",
              ...active.imgStyle }}
          />
        ) : (
          <div style={{ width: "100%", height: 160, borderRadius: 10,
            background: T.cream, border: `1.5px dashed ${T.border}`,
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 8, color: T.muted }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <ellipse cx="12" cy="14" rx="7" ry="6" />
              <circle cx="12" cy="7" r="3" />
              <path d="M9 7 Q7 5 8 3" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace" }}>Shape preview</span>
          </div>
        )}
      </div>

      {/* Thumbnail row */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {SHAPE_VARIANTS.map((v, idx) => (
          <button key={idx} onClick={() => setSelected(idx)} title={v.label}
            style={{
              width: 68, height: 68, borderRadius: 10, cursor: "pointer",
              border: selected === idx ? `2px solid ${T.forest}` : `1.5px solid ${T.border}`,
              background: selected === idx ? T.cream : T.card,
              padding: 6, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 3,
              transition: "border 0.15s, background 0.15s",
            }}>
            {b64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`data:image/png;base64,${b64}`} alt={v.label}
                style={{ width: 40, height: 40, objectFit: "contain",
                  imageRendering: "pixelated", ...v.thumbStyle }} />
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.5">
                <ellipse cx="12" cy="15" rx="6" ry="5" /><circle cx="12" cy="8" r="2.5" />
              </svg>
            )}
            <span style={{ fontSize: 9, color: selected === idx ? T.forest : T.muted,
              fontWeight: selected === idx ? 700 : 400,
              fontFamily: "'Geist Mono', monospace", letterSpacing: "0.04em" }}>
              {v.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feedback modal — overlay with backdrop dismiss + Escape key + Prompt/Manual tabs
// ─────────────────────────────────────────────────────────────────────────────

type FeedbackKind = "recipe" | "shape";

const FEEDBACK_CONFIG: Record<FeedbackKind, { title: string; placeholder: string; promptLabel: string; manualLabel: string }> = {
  recipe: {
    title: "Recipe feedback",
    placeholder: 'e.g. "Make it less spicy and increase protein content"',
    promptLabel: "Describe the recipe change you want:",
    manualLabel: "Adjust nutrition targets manually:",
  },
  shape: {
    title: "Shape feedback",
    placeholder: 'e.g. "Make the shape smaller" or "Try a star shape instead"',
    promptLabel: "Describe the shape change you want:",
    manualLabel: "Adjust shape parameters:",
  },
};

function FeedbackModal({
  kind,
  loading,
  error,
  onSubmit,
  onClose,
}: {
  kind: FeedbackKind;
  loading: boolean;
  error: string | null;
  onSubmit: (text: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"prompt" | "manual">("prompt");
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cfg = FEEDBACK_CONFIG[kind];

  // Focus textarea on open
  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  // Escape key closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, onClose]);

  const tabBtn = (active: boolean) => ({
    padding: "9px 18px",
    fontSize: 13, fontWeight: 500,
    border: "none",
    borderBottom: active ? `2px solid ${T.forest}` : "2px solid transparent",
    background: "transparent",
    color: active ? T.forest : T.muted,
    cursor: "pointer",
    fontFamily: "'Geist', sans-serif",
    transition: "color 0.15s",
  } as React.CSSProperties);

  return (
    /* Backdrop */
    <div
      onClick={() => { if (!loading) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(26, 20, 16, 0.35)",
        backdropFilter: "blur(2px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 0 0",
      }}
    >
      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 100%)",
          background: T.card,
          borderRadius: "20px 20px 0 0",
          border: `1.5px solid ${T.border}`,
          borderBottom: "none",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 0",
        }}>
          <h3 style={{
            margin: 0, fontSize: 22,
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400, color: T.ink,
          }}>
            {cfg.title}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              width: 32, height: 32, borderRadius: 999,
              border: `1.5px solid ${T.border}`,
              background: "transparent", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: T.muted, fontSize: 16, opacity: loading ? 0.4 : 1,
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = T.cream; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, padding: "0 16px", marginTop: 4 }}>
          <button style={tabBtn(tab === "prompt")} onClick={() => setTab("prompt")}>Prompt</button>
          <button style={tabBtn(tab === "manual")} onClick={() => setTab("manual")}>Manual</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px" }}>
          {tab === "prompt" ? (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: T.muted, fontFamily: "'Geist', sans-serif" }}>
                {cfg.promptLabel}
              </p>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={cfg.placeholder}
                rows={3}
                disabled={loading}
                style={{
                  width: "100%", padding: "12px 14px", fontSize: 14,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 12, background: T.cream, color: T.ink,
                  resize: "vertical", fontFamily: "'Geist', sans-serif",
                  outline: "none", lineHeight: 1.5,
                  opacity: loading ? 0.6 : 1,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = T.forest; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = T.border; }}
              />
              {error && (
                <p style={{ margin: "8px 0 0", fontSize: 12, color: T.danger, fontFamily: "'Geist', sans-serif" }}>
                  {error}
                </p>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
                <button
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    padding: "10px 18px", borderRadius: 12, fontSize: 14, fontWeight: 500,
                    background: "transparent", color: T.muted,
                    border: `1.5px solid ${T.border}`, cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "'Geist', sans-serif", opacity: loading ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => text.trim() && onSubmit(text.trim())}
                  disabled={!text.trim() || loading}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                    background: !text.trim() || loading ? T.border : T.forest,
                    color: !text.trim() || loading ? T.muted : T.forestInk,
                    border: "none", cursor: !text.trim() || loading ? "not-allowed" : "pointer",
                    fontFamily: "'Geist', sans-serif", transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {loading && <Spinner />}
                  {loading ? "Revising…" : "Revise"}
                </button>
              </div>
            </>
          ) : (
            <div style={{
              padding: "32px 0", textAlign: "center", color: T.muted,
              fontFamily: "'Geist', sans-serif", fontSize: 14,
            }}>
              <p style={{ margin: 0 }}>
                Manual sliders coming soon — use the Prompt tab to describe your changes.
              </p>
              <button
                onClick={() => setTab("prompt")}
                style={{
                  marginTop: 16, padding: "8px 18px", borderRadius: 999,
                  background: T.forest, color: T.forestInk,
                  border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                  fontFamily: "'Geist', sans-serif",
                }}
              >
                Switch to Prompt
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function Step5ChefV2() {
  const {
    dietitianOutput, chefOutput, prompt, parsedPrompt,
    getSelectedProfile, setParsedPrompt, setChefOutput,
    setEngineerOutput, setStepLoading, setStepError,
    stepLoading, stepError, appendLog, goToStep,
  } = useWizardStore();

  const profile = getSelectedProfile();
  const [feedback, setFeedback] = useState<FeedbackKind | null>(null);

  const isLoading = stepLoading.chef || stepLoading.engineer;
  const error = stepError.engineer;

  async function handleConfirm() {
    if (!chefOutput) return;
    setStepLoading("engineer", true);
    setStepError("engineer", null);
    const t0 = Date.now();
    try {
      const result = await runEngineer(prompt, chefOutput, profile?.age ?? 0, parsedPrompt?.meal_type ?? "");
      appendLog({ stage: "engineer",
        request: { prompt, chef_output: chefOutput },
        response: result as unknown as Record<string, unknown>,
        timestamp: t0, duration_ms: Date.now() - t0 });
      setEngineerOutput(result);
      goToStep(6);
    } catch (err) {
      setStepError("engineer", err instanceof Error ? err.message : "Failed to run engineer.");
    } finally {
      setStepLoading("engineer", false);
    }
  }

  async function handleRevise(revision: string) {
    if (!dietitianOutput) return;
    setStepLoading("chef", true);
    setStepError("chef", null);
    const tag = feedback === "shape" ? "[Shape revision]" : "[Recipe revision]";
    const revisedPrompt = `${prompt}\n\n${tag}: ${revision}`;
    const t0 = Date.now();
    try {
      const parsed = await runParse(revisedPrompt);
      setParsedPrompt(parsed);
      const result = await runChef(
        dietitianOutput.nutrition_targets, dietitianOutput.allergens,
        profile?.age ?? 0, profile?.sex ?? "", profile?.dietaryPreferences ?? [],
        parsed.shape, parsed.meal_type, parsed.ingredients, parsed.menu
      );
      appendLog({ stage: "chef",
        request: { prompt: revisedPrompt, nutrition_targets: dietitianOutput.nutrition_targets },
        response: result as unknown as Record<string, unknown>,
        timestamp: t0, duration_ms: Date.now() - t0 });
      setChefOutput(result);
      setFeedback(null);
    } catch (err) {
      setStepError("chef", err instanceof Error ? err.message : "Revision failed.");
    } finally {
      setStepLoading("chef", false);
    }
  }

  if (!chefOutput && stepLoading.chef) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingBlock label="Designing your recipe..." />
      </div>
    );
  }
  if (!chefOutput) return null;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden",
        background: "var(--bg)" }}>

        {/* Scrollable content */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "32px 28px",
          maxWidth: 1240, margin: "0 auto", width: "100%",
          display: "flex", flexDirection: "column", gap: 24,
          boxSizing: "border-box",
        }}>

          {/* Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{
              margin: 0, fontSize: 32,
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400, color: T.ink,
              letterSpacing: "-0.01em",
            }}>
              {chefOutput.menu_name}
            </h2>
            <BookmarkIcon />
          </div>

          {/* 4-column row */}
          <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
            {/* Recipe cards */}
            <div style={{
              flex: 1, minWidth: 0, display: "grid",
              gridTemplateColumns: `repeat(${Math.min(chefOutput.syringe_recipes.length, 2)}, minmax(0, 1fr))`,
              gap: 16,
            }}>
              {chefOutput.syringe_recipes.map((r) => (
                <SyringeRecipeCardV2 key={r.syringe_id} recipe={r} />
              ))}
            </div>

            {/* Shape preview */}
            <div style={{ flexShrink: 0, width: 260, display: "flex" }}>
              <ContourPreviewV2
                b64={chefOutput.silhouette_image_b64}
                shapeName={parsedPrompt?.shape ?? ""}
              />
            </div>

            {/* Nutrition facts */}
            {chefOutput.nutrition_facts && (
              <div style={{ flexShrink: 0, display: "flex" }}>
                <NutritionFactsTable facts={chefOutput.nutrition_facts} />
              </div>
            )}
          </div>

          {/* Post-processing */}
          {chefOutput.post_processing?.length > 0 && (
            <div style={{
              padding: "14px 18px", borderRadius: 14,
              background: T.card, border: `1.5px solid ${T.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.08em", color: T.muted, marginBottom: 6,
                fontFamily: "'Geist Mono', monospace" }}>
                After printing
              </div>
              <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.7,
                fontFamily: "'Geist', sans-serif" }}>
                {chefOutput.post_processing[0]}
              </div>
            </div>
          )}

          {/* KB chunks */}
          {chefOutput.retrieved_chunks && chefOutput.retrieved_chunks.length > 0 && (
            <details>
              <summary style={{
                cursor: "pointer", fontSize: 12, fontWeight: 600, color: T.muted,
                userSelect: "none", marginBottom: 8,
                fontFamily: "'Geist Mono', monospace",
              }}>
                Retrieved KB Chunks ({chefOutput.retrieved_chunks.length})
              </summary>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {chefOutput.retrieved_chunks.map((chunk, i) => (
                  <div key={i} style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: T.card, border: `1.5px solid ${T.border}`,
                    fontSize: 12, color: T.ink, lineHeight: 1.6,
                    fontFamily: "'Geist', sans-serif",
                  }}>
                    <div style={{ fontWeight: 600, color: T.muted, marginBottom: 4, fontSize: 11,
                      fontFamily: "'Geist Mono', monospace" }}>
                      score: {chunk.score.toFixed(4)}
                      {chunk.metadata?.source ? ` · ${chunk.metadata.source}` : ""}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{chunk.content}</div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Engineer error */}
          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: T.dangerBg, border: `1px solid #fcc`,
              color: T.danger, fontSize: 13, fontFamily: "'Geist', sans-serif",
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{
          flexShrink: 0,
          background: T.card,
          borderTop: `1.5px solid ${T.border}`,
          padding: "14px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", gap: 10 }}>
            {(["recipe", "shape"] as FeedbackKind[]).map((kind) => (
              <button
                key={kind}
                onClick={() => setFeedback(kind)}
                disabled={isLoading}
                style={{
                  padding: "10px 18px", borderRadius: 12, fontSize: 14, fontWeight: 500,
                  background: "transparent", color: T.ink,
                  border: `1.5px solid ${T.border}`,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontFamily: "'Geist', sans-serif",
                  opacity: isLoading ? 0.5 : 1,
                  transition: "background 0.12s, border-color 0.12s",
                }}
                onMouseEnter={(e) => { if (!isLoading) { (e.currentTarget as HTMLElement).style.background = T.cream; (e.currentTarget as HTMLElement).style.borderColor = T.muted; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = T.border; }}
              >
                {kind === "recipe" ? "Recipe feedback" : "Shape feedback"}
              </button>
            ))}
          </div>

          <button
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 26px", borderRadius: 14,
              background: isLoading ? T.border : T.forest,
              color: isLoading ? T.muted : T.forestInk,
              border: "none", fontSize: 15, fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "'Geist', sans-serif",
              transition: "background 0.15s",
            }}
          >
            {stepLoading.engineer && <Spinner />}
            {stepLoading.engineer ? "Generating…" : "Confirm"}
          </button>
        </div>
      </div>

      {/* Feedback modal */}
      {feedback && (
        <FeedbackModal
          kind={feedback}
          loading={stepLoading.chef}
          error={stepError.chef}
          onSubmit={handleRevise}
          onClose={() => { if (!stepLoading.chef) { setFeedback(null); setStepError("chef", null); } }}
        />
      )}
    </>
  );
}
