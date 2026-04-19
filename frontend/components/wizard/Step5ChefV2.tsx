"use client";

import { useState } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { Button } from "../ui/Button";
import { LoadingBlock } from "../ui/Spinner";
import { RevisePanel } from "../ui/RevisePanel";
import { runParse, runChef, runEngineer } from "../../lib/api";
import { NutritionFactsTable } from "../chef/NutritionFactsTable";
import type { SyringeRecipe } from "../../lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Step5ChefV2 — redesigned Step 5 matching the screenshot layout:
//   • Forest-green syringe badge
//   • Shape Preview with name subtitle + thumbnail selector row
//   • Bottom bar: "Recipe feedback" + "Shape feedback" left, "Confirm" right
//   • Bookmark icon beside recipe title
// ─────────────────────────────────────────────────────────────────────────────

const BRAND_GREEN = "#354f22";

// ── Bookmark icon ─────────────────────────────────────────────────────────────

function BookmarkIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: "middle", color: "var(--fg3)" }}
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ── SyringeRecipeCard with forest-green badge ─────────────────────────────────

function SyringeRecipeCardV2({ recipe }: { recipe: SyringeRecipe }) {
  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <span
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: BRAND_GREEN,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {recipe.syringe_id}
          </span>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--fg)" }}>{recipe.title}</div>
            <div style={{ fontSize: "11px", color: "var(--fg3)" }}>{recipe.label}</div>
          </div>
        </div>

        <div
          style={{
            height: "1px",
            background: "var(--card-border)",
            margin: "0 0 12px",
          }}
        />

        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--fg3)",
              marginBottom: "6px",
            }}
          >
            Ingredients
          </div>
          <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
            {recipe.ingredients.map((ing, i) => (
              <li key={i} style={{ fontSize: "13px", color: "var(--fg2)", lineHeight: "1.7" }}>
                {ing}
              </li>
            ))}
          </ul>
        </div>

        {recipe.instructions.length > 0 && (
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--fg3)",
                marginBottom: "6px",
              }}
            >
              Preparation
            </div>
            <ol style={{ margin: 0, padding: "0 0 0 16px" }}>
              {recipe.instructions.map((step, i) => (
                <li key={i} style={{ fontSize: "13px", color: "var(--fg2)", lineHeight: "1.7" }}>
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

// ── ContourPreview with title, shape name, and thumbnail selector ─────────────

function ContourPreviewV2({
  b64,
  shapeName,
}: {
  b64: string | null;
  shapeName: string;
}) {
  const [selectedThumb, setSelectedThumb] = useState(1);

  const formattedName =
    shapeName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) + " Form";

  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--fg)" }}>
          Shape Preview
        </div>
        <div style={{ fontSize: "12px", color: "var(--fg3)", marginTop: "2px" }}>
          {formattedName}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px 0",
        }}
      >
        {b64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/png;base64,${b64}`}
            alt="Food silhouette contour"
            style={{ width: "100%", maxHeight: "180px", objectFit: "contain", imageRendering: "pixelated" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "160px",
              borderRadius: "8px",
              background: "var(--bg2)",
              border: "1px dashed var(--border)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              color: "var(--fg3)",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <ellipse cx="12" cy="14" rx="7" ry="6" />
              <circle cx="12" cy="7" r="3" />
              <path d="M9 7 Q7 5 8 3" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: "11px" }}>Shape preview</span>
          </div>
        )}
      </div>

      {/* Thumbnail selector */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        {[0, 1, 2].map((idx) => (
          <button
            key={idx}
            onClick={() => setSelectedThumb(idx)}
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "8px",
              border: selectedThumb === idx ? "2px solid var(--fg3)" : "1px solid var(--card-border)",
              background: "var(--bg2)",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {b64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${b64}`}
                alt={`Shape variant ${idx + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "pixelated" }}
              />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--fg3)" strokeWidth="1.5">
                <ellipse cx="12" cy="15" rx="6" ry="5" />
                <circle cx="12" cy="8" r="2.5" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Step5ChefV2() {
  const {
    dietitianOutput,
    chefOutput,
    prompt,
    parsedPrompt,
    getSelectedProfile,
    setParsedPrompt,
    setChefOutput,
    setEngineerOutput,
    setStepLoading,
    setStepError,
    stepLoading,
    stepError,
    appendLog,
    goToStep,
  } = useWizardStore();

  const profile = getSelectedProfile();

  const [showRevise, setShowRevise] = useState(false);

  const isLoading = stepLoading.chef || stepLoading.engineer;
  const error = stepError.chef || stepError.engineer;

  async function handleConfirm() {
    if (!chefOutput) return;
    setStepLoading("engineer", true);
    setStepError("engineer", null);
    const t0 = Date.now();
    try {
      const result = await runEngineer(
        prompt,
        chefOutput,
        profile?.age ?? 0,
        parsedPrompt?.meal_type ?? ""
      );
      appendLog({
        stage: "engineer",
        request: { prompt, chef_output: chefOutput },
        response: result as unknown as Record<string, unknown>,
        timestamp: t0,
        duration_ms: Date.now() - t0,
      });
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
    const revisedPrompt = `${prompt}\n\n[Revision request]: ${revision}`;
    const t0 = Date.now();
    try {
      const parsed = await runParse(revisedPrompt);
      setParsedPrompt(parsed);
      const result = await runChef(
        dietitianOutput.nutrition_targets,
        dietitianOutput.allergens,
        profile?.age ?? 0,
        profile?.sex ?? "",
        profile?.dietaryPreferences ?? [],
        parsed.shape,
        parsed.meal_type,
        parsed.ingredients,
        parsed.menu
      );
      appendLog({
        stage: "chef",
        request: { prompt: revisedPrompt, nutrition_targets: dietitianOutput.nutrition_targets },
        response: result as unknown as Record<string, unknown>,
        timestamp: t0,
        duration_ms: Date.now() - t0,
      });
      setChefOutput(result);
      setShowRevise(false);
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
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 24px",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxSizing: "border-box",
        }}
      >
        {/* Title with bookmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2
            style={{
              fontSize: "26px",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.02em",
              color: "var(--fg)",
            }}
          >
            {chefOutput.menu_name}
          </h2>
          <BookmarkIcon />
        </div>

        {/* Main 4-column row: recipe cards, shape preview, nutrition facts */}
        <div style={{ display: "flex", gap: "16px", alignItems: "stretch" }}>
          {/* Recipe cards */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(chefOutput.syringe_recipes.length, 2)}, minmax(0, 1fr))`,
              gap: "16px",
            }}
          >
            {chefOutput.syringe_recipes.map((recipe) => (
              <SyringeRecipeCardV2 key={recipe.syringe_id} recipe={recipe} />
            ))}
          </div>

          {/* Shape preview */}
          <div style={{ flexShrink: 0, width: "260px", display: "flex" }}>
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
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--fg3)",
                marginBottom: "8px",
              }}
            >
              After printing
            </div>
            <div style={{ fontSize: "13px", color: "var(--fg2)", lineHeight: "1.7" }}>
              {chefOutput.post_processing[0]}
            </div>
          </div>
        )}

        {/* Retrieved KB chunks */}
        {chefOutput.retrieved_chunks && chefOutput.retrieved_chunks.length > 0 && (
          <details style={{ marginTop: "4px" }}>
            <summary
              style={{
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--fg3)",
                userSelect: "none",
                marginBottom: "8px",
              }}
            >
              Retrieved KB Chunks ({chefOutput.retrieved_chunks.length})
            </summary>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {chefOutput.retrieved_chunks.map((chunk, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                    fontSize: "12px",
                    color: "var(--fg2)",
                    lineHeight: "1.6",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: "var(--fg3)",
                      marginBottom: "4px",
                      fontSize: "11px",
                    }}
                  >
                    score: {chunk.score.toFixed(4)}
                    {chunk.metadata?.source ? ` · ${chunk.metadata.source}` : ""}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{chunk.content}</div>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Revise panel */}
        {showRevise && (
          <RevisePanel
            onRevisePrompt={handleRevisePrompt}
            loading={stepLoading.chef}
            error={stepError.chef}
            onCancel={() => setShowRevise(false)}
          />
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "#fff0f0",
              border: "1px solid #fcc",
              color: "#c0392b",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      {!showRevise && (
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: "var(--bg)",
            borderTop: "1px solid var(--border)",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowRevise(true)}
              disabled={isLoading}
            >
              Recipe feedback
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowRevise(true)}
              disabled={isLoading}
            >
              Shape feedback
            </Button>
          </div>

          <Button
            variant="primary"
            size="md"
            loading={stepLoading.engineer}
            disabled={isLoading}
            onClick={handleConfirm}
          >
            Confirm
          </Button>
        </div>
      )}
    </div>
  );
}
