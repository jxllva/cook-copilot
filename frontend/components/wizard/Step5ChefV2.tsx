"use client";

import { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { LoadingBlock } from "../ui/Spinner";
import { Button } from "../ui/Button";
import { RevisePanel } from "../ui/RevisePanel";
import { runParse, runChef, runEngineer, runSilhouettes } from "../../lib/api";
import { NutritionFactsTable } from "../chef/NutritionFactsTable";
import type { SyringeRecipe } from "../../lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — matches homepage / profile page aesthetic
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  ink:       "#1A1410",
  muted:     "#6B5D50",
  card:      "#FFFFFF",
  border:    "rgba(26, 20, 16, 0.12)",
  forest:    "rgb(21, 60, 54)",
  forestInk: "#FFF4E6",
  cream:     "rgb(244, 244, 232)",
  badge:     "#354f22",
  danger:    "#c0392b",
  dangerBg:  "#fff0f0",
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
// Form Selection — 3 AI-generated silhouette variants
// ─────────────────────────────────────────────────────────────────────────────

type ShapeVariant = { label: string; description: string; b64: string | null };

const SKELETON_BG = `linear-gradient(90deg, #ebebeb 25%, #f5f5f5 50%, #ebebeb 75%)`;

function ShimmerBlock({ width, height, radius = 8 }: { width: number | string; height: number | string; radius?: number }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: SKELETON_BG, backgroundSize: "300% 100%",
      animation: "shimmer 1.6s ease infinite",
    }} />
  );
}

function ContourPreviewV2({ defaultB64, shapeName }: { defaultB64: string | null; shapeName: string }) {
  const [selected, setSelected] = useState(0);
  const [variants, setVariants] = useState<ShapeVariant[]>([
    { label: "Classic",   description: "Standard form",   b64: defaultB64 },
    { label: "Rounded",   description: "Soft & bubbly",   b64: null },
    { label: "Geometric", description: "Angular & bold",  b64: null },
  ]);
  const [fetching, setFetching] = useState(!!shapeName);

  const displayName = shapeName
    ? shapeName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Shape";

  useEffect(() => {
    if (!shapeName) { setFetching(false); return; }
    setFetching(true);
    runSilhouettes(shapeName)
      .then(({ variants: fetched }) =>
        setVariants(fetched.map((v) => ({ label: v.label, description: v.description, b64: v.b64 })))
      )
      .catch(() => { /* keep seeded default */ })
      .finally(() => setFetching(false));
  }, [shapeName]);

  const active = variants[selected];
  const activeSrc = active?.b64 ? `data:image/png;base64,${active.b64}` : null;

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid rgba(0,0,0,0.07)",
      borderRadius: 20,
      padding: "20px 20px 16px",
      display: "flex", flexDirection: "column", gap: 16,
      height: "100%", boxSizing: "border-box",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, fontFamily: "'Geist', sans-serif", letterSpacing: "-0.01em" }}>
          Choose Form
        </div>
        <div style={{ fontSize: 11, color: T.muted, fontFamily: "'Geist Mono', monospace", letterSpacing: "0.04em" }}>
          {displayName} · {active?.label ?? "—"}
        </div>
      </div>

      {/* Main preview */}
      <div style={{
        flex: 1, minHeight: 160,
        borderRadius: 14,
        background: "#F7F7F5",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", padding: 16,
        position: "relative",
      }}>
        {activeSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${selected}-${activeSrc.slice(-12)}`}
            src={activeSrc}
            alt={`${displayName} — ${active?.label}`}
            style={{
              maxWidth: "100%", maxHeight: 200, objectFit: "contain",
              imageRendering: "pixelated",
              animation: "fadeIn 0.2s ease",
            }}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {fetching ? (
              <ShimmerBlock width={120} height={120} radius={12} />
            ) : (
              <div style={{ textAlign: "center", color: "#BBBBBB" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
                  <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div style={{ fontSize: 11, marginTop: 8, fontFamily: "'Geist', sans-serif" }}>No shape</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form gallery */}
      <div style={{ display: "flex", gap: 8 }}>
        {variants.map((v, idx) => {
          const isActive = selected === idx;
          const hasImg = !!v.b64;
          const src = hasImg ? `data:image/png;base64,${v.b64}` : null;

          return (
            <button
              key={idx}
              onClick={() => hasImg && setSelected(idx)}
              style={{
                flex: 1, minWidth: 0,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                padding: "10px 6px 10px",
                borderRadius: 14,
                border: isActive ? `2px solid ${T.forest}` : "1.5px solid rgba(0,0,0,0.07)",
                background: isActive ? "rgba(21,60,54,0.03)" : "#FAFAFA",
                cursor: hasImg ? "pointer" : "default",
                transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
                boxShadow: isActive ? `0 2px 12px rgba(21,60,54,0.12)` : "none",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive && hasImg) {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(21,60,54,0.3)";
                  (e.currentTarget as HTMLElement).style.background = "#F5F5F3";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)";
                  (e.currentTarget as HTMLElement).style.background = "#FAFAFA";
                }
              }}
            >
              {/* Thumbnail image */}
              <div style={{
                width: 52, height: 52,
                borderRadius: 10,
                background: "#F0F0EE",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}>
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={v.label}
                    style={{ width: 40, height: 40, objectFit: "contain", imageRendering: "pixelated" }} />
                ) : (
                  <ShimmerBlock width={40} height={40} radius={6} />
                )}
              </div>

              {/* Labels */}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  color: isActive ? T.forest : T.ink,
                  fontFamily: "'Geist', sans-serif",
                  letterSpacing: "-0.01em",
                }}>
                  {v.label}
                </div>
                <div style={{
                  fontSize: 9, color: T.muted, marginTop: 1,
                  fontFamily: "'Geist Mono', monospace", letterSpacing: "0.03em",
                }}>
                  {v.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

type ReviseKind = "recipe" | "shape";

export function Step5ChefV2() {
  const {
    dietitianOutput, chefOutput, prompt, parsedPrompt,
    getSelectedProfile, setParsedPrompt, setChefOutput,
    setEngineerOutput, setStepLoading, setStepError,
    stepLoading, stepError, appendLog, goToStep,
  } = useWizardStore();

  const profile = getSelectedProfile();
  const [showRevise, setShowRevise] = useState<ReviseKind | null>(null);

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

  async function handleRevisePrompt(revision: string) {
    if (!dietitianOutput) return;
    setStepLoading("chef", true);
    setStepError("chef", null);
    const tag = showRevise === "shape" ? "[Shape revision]" : "[Recipe revision]";
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
      setShowRevise(null);
    } catch (err) {
      setStepError("chef", err instanceof Error ? err.message : "Revision failed.");
    } finally {
      setStepLoading("chef", false);
    }
  }

  // Manual slider overrides: build a descriptive prompt and route through AI
  async function handleReviseManual(overrides: Record<string, number>) {
    if (showRevise === "recipe") {
      const parts: string[] = [];
      if (overrides.calories !== undefined) parts.push(`${overrides.calories} kcal`);
      if (overrides.protein !== undefined) parts.push(`${overrides.protein}g protein`);
      if (overrides.sugar !== undefined) parts.push(`max ${overrides.sugar}g sugar`);
      await handleRevisePrompt(`Adjust the recipe to target: ${parts.join(", ")}.`);
    } else if (showRevise === "shape") {
      const scale = overrides.scale ?? 1;
      const desc = scale < 1 ? "smaller" : scale > 1 ? "larger" : "the same size";
      await handleRevisePrompt(`Adjust the printed shape to be ${desc} (scale ${scale}x).`);
    }
  }

  // Derive slider fields from current chef output
  const recipeSliders = chefOutput?.nutrition_facts ? [
    { key: "calories", label: "Calories", min: 50, max: 500, step: 5,
      value: Math.round(chefOutput.nutrition_facts.calories ?? 150), unit: "kcal" },
    { key: "protein", label: "Protein", min: 0, max: 40, step: 0.5,
      value: parseFloat((chefOutput.nutrition_facts.protein_g ?? 5).toFixed(1)), unit: "g" },
    { key: "sugar", label: "Sugar", min: 0, max: 30, step: 0.5,
      value: parseFloat((chefOutput.nutrition_facts.total_sugars_g ?? 3).toFixed(1)), unit: "g" },
  ] : [];

  const shapeSliders = [
    { key: "scale", label: "Scale", min: 0.5, max: 2.0, step: 0.1, value: 1.0, unit: "×" },
  ];

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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } } @keyframes shimmer { 0% { background-position: -300% 0; } 100% { background-position: 300% 0; } } @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }`}</style>

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
                defaultB64={chefOutput.silhouette_image_b64}
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

          {/* ── Inline RevisePanel (replaces modal overlay) ── */}
          {showRevise && (
            <div style={{ animation: "fadeUp 0.2s ease" }}>
              <RevisePanel
                onRevisePrompt={handleRevisePrompt}
                onReviseManual={handleReviseManual}
                sliderFields={showRevise === "recipe" ? recipeSliders : shapeSliders}
                loading={stepLoading.chef}
                error={stepError.chef}
                onCancel={() => { setShowRevise(null); setStepError("chef", null); }}
              />
            </div>
          )}
        </div>

        {/* Bottom bar — hidden while RevisePanel is open (matches Step 4 pattern) */}
        {!showRevise && (
          <div style={{
            flexShrink: 0,
            background: T.card,
            borderTop: `1.5px solid ${T.border}`,
            padding: "14px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", gap: 10 }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowRevise("recipe")}
                disabled={isLoading}
              >
                Recipe feedback
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowRevise("shape")}
                disabled={isLoading}
              >
                Shape feedback
              </Button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 13, color: T.muted, fontFamily: "'Geist', sans-serif" }}>
                Review the recipe, then confirm to generate print instructions.
              </p>
              <Button
                variant="primary"
                size="md"
                loading={stepLoading.engineer}
                disabled={isLoading}
                onClick={handleConfirm}
                style={{
                  background: isLoading ? undefined : T.forest,
                  borderColor: isLoading ? undefined : T.forest,
                  color: isLoading ? undefined : T.forestInk,
                  borderRadius: 12,
                  fontWeight: 600,
                  padding: "11px 24px",
                }}
              >
                {stepLoading.engineer ? "Generating…" : "Confirm →"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
