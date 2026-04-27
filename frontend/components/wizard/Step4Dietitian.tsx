"use client";

import { useState, useEffect } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { Button } from "../ui/Button";
import { StageLoader } from "../ui/StageLoader";
import { runChef, refineDietitian } from "../../lib/api";
import { ProfileSidebar } from "../dietitian/ProfileSidebar";

const T = {
  cream: "rgb(244, 244, 232)",
  card: "#FFFFFF",
  border: "rgba(26,20,16,0.1)",
  ink: "#1A1410",
  muted: "#6B5D50",
  forest: "rgb(21, 60, 54)",
  forestInk: "#FFF4E6",
  orange: "#D15200",
  teal: "#29787C",
  amber: "#FFB341",
  warnBg: "#FFFBEB",
  warnBorder: "#FDE68A",
  errorBg: "#FFF0F0",
  errorBorder: "#FECACA",
  errorText: "#C0392B",
} as const;

const ALL_ALLERGENS = [
  { key: "peanuts", label: "Peanuts" },
  { key: "tree_nuts", label: "Tree Nuts" },
  { key: "dairy", label: "Dairy" },
  { key: "eggs", label: "Eggs" },
  { key: "wheat_gluten", label: "Wheat / Gluten" },
  { key: "soy", label: "Soy" },
  { key: "fish", label: "Fish" },
  { key: "shellfish", label: "Shellfish" },
  { key: "sesame", label: "Sesame" },
];

const ALL_DIETARY = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "halal", label: "Halal" },
  { key: "kosher", label: "Kosher" },
  { key: "gluten_free", label: "Gluten-free" },
  { key: "low_sodium", label: "Low sodium" },
  { key: "low_sugar", label: "Low sugar" },
  { key: "nut_free", label: "Nut-free" },
];

function EditRestrictionsModal({
  allergens,
  onSave,
  onClose,
}: {
  allergens: string[];
  onSave: (updated: string[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(allergens));

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const chipBase: React.CSSProperties = {
    padding: "8px 16px", borderRadius: 999, fontSize: 13,
    fontFamily: "'Geist', sans-serif", fontWeight: 500,
    cursor: "pointer", transition: "all 0.15s", border: "1.5px solid",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(26,20,16,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: T.card, borderRadius: 20, padding: "32px 32px 24px", width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 6px", fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, color: T.ink }}>
          Dietary Restrictions
        </h2>
        <p style={{ margin: "0 0 28px", fontSize: 13, color: T.muted, fontFamily: "'Geist', sans-serif" }}>
          Toggle restrictions to include or exclude from your recipe.
        </p>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: T.muted, marginBottom: 12, fontFamily: "'Geist', sans-serif" }}>
            Allergens
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
            {ALL_ALLERGENS.map(({ key, label }) => {
              const active = selected.has(key);
              return (
                <button key={key} onClick={() => toggle(key)} style={{ ...chipBase, borderColor: active ? T.orange : T.border, background: active ? "#FDF0E8" : T.card, color: active ? T.orange : T.muted }}>
                  {active ? "✕ " : "+ "}{label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: T.muted, marginBottom: 12, fontFamily: "'Geist', sans-serif" }}>
            Dietary Preferences
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
            {ALL_DIETARY.map(({ key, label }) => {
              const active = selected.has(key);
              return (
                <button key={key} onClick={() => toggle(key)} style={{ ...chipBase, borderColor: active ? T.forest : T.border, background: active ? "rgba(21,60,54,0.08)" : T.card, color: active ? T.forest : T.muted }}>
                  {active ? "✓ " : "+ "}{label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 999, fontSize: 13, fontWeight: 500, fontFamily: "'Geist', sans-serif", cursor: "pointer", border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted }}>
            Cancel
          </button>
          <button onClick={() => onSave([...selected])} style={{ padding: "10px 24px", borderRadius: 999, fontSize: 13, fontWeight: 600, fontFamily: "'Geist', sans-serif", cursor: "pointer", border: `1.5px solid ${T.forest}`, background: T.forest, color: T.forestInk }}>
            Save restrictions
          </button>
        </div>
      </div>
    </div>
  );
}

export function Step4Dietitian() {
  const {
    dietitianOutput,
    parsedPrompt,
    getSelectedProfile,
    prompt,
    setChefOutput,
    setStepLoading,
    setStepError,
    setDietitianOutput,
    stepLoading,
    stepError,
    appendLog,
    goToStep,
  } = useWizardStore();

  const [showEditRestrictions, setShowEditRestrictions] = useState(false);
  const [refineText, setRefineText] = useState("");
  const profile = getSelectedProfile();

  const isLoading = stepLoading.dietitian || stepLoading.chef;
  const error = stepError.dietitian || stepError.chef;

  // ── Fixed daily target (no slider)
  const effectiveDailyTarget = dietitianOutput?.daily_reference?.daily_target ?? 2000;
  const displayKcalMin = dietitianOutput?.nutrition_targets.kcal.min ?? 0;
  const displayKcalMax = dietitianOutput?.nutrition_targets.kcal.max ?? 0;

  // ── Confirm
  async function handleConfirm() {
    if (!dietitianOutput) return;
    setStepLoading("chef", true);
    setStepError("chef", null);
    const t0 = Date.now();
    try {
      const result = await runChef(
        dietitianOutput.nutrition_targets, dietitianOutput.allergens,
        profile?.age ?? 0, profile?.sex ?? "", profile?.dietaryPreferences ?? [],
        parsedPrompt?.shape ?? "", parsedPrompt?.meal_type ?? dietitianOutput.meal_type,
        parsedPrompt?.ingredients ?? [], parsedPrompt?.menu ?? ""
      );
      appendLog({ stage: "chef", request: { prompt, nutrition_targets: dietitianOutput.nutrition_targets }, response: result as unknown as Record<string, unknown>, timestamp: t0, duration_ms: Date.now() - t0 });
      setChefOutput(result);
      goToStep(5);
    } catch (err) {
      setStepError("chef", err instanceof Error ? err.message : "Failed to run chef.");
    } finally {
      setStepLoading("chef", false);
    }
  }

  // ── Refine nutrition targets via free-text
  async function handleRefine() {
    if (!dietitianOutput || !refineText.trim()) return;
    setStepLoading("dietitian", true);
    setStepError("dietitian", null);
    const t0 = Date.now();
    try {
      const result = await refineDietitian(dietitianOutput, refineText.trim());
      appendLog({ stage: "dietitian", request: { refinement: refineText, current: dietitianOutput }, response: result as unknown as Record<string, unknown>, timestamp: t0, duration_ms: Date.now() - t0 });
      setDietitianOutput(result);
      setRefineText("");
    } catch (err) {
      setStepError("dietitian", err instanceof Error ? err.message : "Refinement failed.");
    } finally {
      setStepLoading("dietitian", false);
    }
  }

  function handleSaveRestrictions(updated: string[]) {
    if (!dietitianOutput) return;
    setDietitianOutput({ ...dietitianOutput, allergens: updated });
    setShowEditRestrictions(false);
  }

  if (!dietitianOutput && stepLoading.dietitian) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <StageLoader stage="dietitian" />
      </div>
    );
  }
  if (!dietitianOutput) return null;

  const nt = dietitianOutput.nutrition_targets;
  const { macro_percent } = nt.composition;
  const mealType = dietitianOutput.meal_type;
  const allergens = dietitianOutput.allergens;

  const carbDeg = (macro_percent.carbs / 100) * 360;
  const proteinDeg = (macro_percent.protein / 100) * 360;
  const donutGradient = `conic-gradient(${T.teal} 0deg ${carbDeg}deg, ${T.orange} ${carbDeg}deg ${carbDeg + proteinDeg}deg, ${T.amber} ${carbDeg + proteinDeg}deg 360deg)`;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", background: T.cream }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ flex: 1, overflowY: "auto", padding: "36px 32px", maxWidth: 960, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: "0 0 6px", fontFamily: "'Instrument Serif', serif", fontSize: 30, fontWeight: 400, color: T.ink, letterSpacing: "-0.01em" }}>
            Your Nutrition Targets
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: T.muted, fontFamily: "'Geist', sans-serif" }}>
            Review your targets, then confirm to generate your recipe.
          </p>
        </div>

        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* Left: Profile sidebar */}
          {profile && <ProfileSidebar profile={profile} />}

          {/* Right: 2 cards */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

            {/* ── Card 1: Calories + Sugar cap ── */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px 28px" }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <span style={{ fontSize: 13, color: T.muted, fontFamily: "'Geist', sans-serif", fontWeight: 500 }}>Meal Calorie Goal</span>
                <span style={{
                  padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  textTransform: "uppercase" as const, letterSpacing: "0.06em", fontFamily: "'Geist', sans-serif",
                  background: mealType === "snack" ? "#E8F4FD" : "#F0FDF4",
                  color: mealType === "snack" ? "#1A6FA8" : "#166534",
                }}>
                  {mealType}
                </span>
              </div>

              {/* Donut + legend */}
              <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
                <div style={{ width: 148, height: 148, borderRadius: "50%", background: donutGradient, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 94, height: 94, borderRadius: "50%", background: T.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, fontFamily: "'Geist', sans-serif", lineHeight: 1.1, textAlign: "center" }}>
                      {displayKcalMin}–{displayKcalMax}
                    </span>
                    <span style={{ fontSize: 10, color: T.muted, fontFamily: "'Geist', sans-serif", marginTop: 2 }}>kcal</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(() => {
                    const avgKcal = (displayKcalMin + displayKcalMax) / 2;
                    return [
                      { color: T.teal,   label: "Carbs",   pct: Math.round(macro_percent.carbs),   g: Math.round((macro_percent.carbs   / 100) * avgKcal / 4) },
                      { color: T.orange, label: "Protein", pct: Math.round(macro_percent.protein), g: Math.round((macro_percent.protein / 100) * avgKcal / 4) },
                      { color: T.amber,  label: "Fat",     pct: Math.round(macro_percent.fat),     g: Math.round((macro_percent.fat     / 100) * avgKcal / 9) },
                    ].map((m) => (
                      <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: m.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: T.ink, fontFamily: "'Geist', sans-serif", width: 56 }}>{m.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: "'Geist', sans-serif", width: 38 }}>{m.pct}%</span>
                        <span style={{ fontSize: 12, color: T.muted, fontFamily: "'Geist', sans-serif" }}>~{m.g}g</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Sugar cap divider row */}
              {nt.sugar_g.max > 0 && (
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, color: T.muted, fontFamily: "'Geist', sans-serif" }}>Sugar cap</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, fontFamily: "'Geist', sans-serif" }}>
                    &lt; {nt.sugar_g.max}g
                  </span>
                </div>
              )}
            </div>

            {/* ── Card 2: Daily target (fixed) + Restrictions ── */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px 28px" }}>
              {/* Daily target section */}
              <div style={{ fontSize: 13, color: T.muted, fontFamily: "'Geist', sans-serif", fontWeight: 500, marginBottom: 18 }}>
                Daily Nutrition Targets
              </div>

              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 44, fontWeight: 700, color: T.ink, fontFamily: "'Geist', sans-serif", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {Math.round(effectiveDailyTarget).toLocaleString()}
                </div>
                <div style={{ fontSize: 13, color: T.muted, fontFamily: "'Geist', sans-serif", marginTop: 5 }}>kcal/day</div>
              </div>

              {/* Restrictions divider */}
              <div style={{ paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: T.muted, fontFamily: "'Geist', sans-serif", fontWeight: 500 }}>
                    Restrictions
                  </span>
                  <button
                    onClick={() => setShowEditRestrictions(true)}
                    style={{ padding: "7px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "'Geist', sans-serif", cursor: "pointer", border: `1.5px solid ${T.ink}`, background: T.ink, color: "#FFF4E6" }}
                  >
                    Edit
                  </button>
                </div>
                {allergens.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: T.muted, fontFamily: "'Geist', sans-serif", fontStyle: "italic" }}>
                    No restrictions set — click Edit to add some.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                    {allergens.map((a) => (
                      <span key={a} style={{ padding: "6px 14px", borderRadius: 999, fontSize: 13, fontFamily: "'Geist', sans-serif", fontWeight: 500, background: "#FDF0E8", color: T.orange, border: "1px solid #F5C8A0" }}>
                        No {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Refine section ── */}
            <div>
              <h3 style={{
                margin: "0 0 16px", fontSize: 22,
                fontFamily: "'Instrument Serif', serif",
                fontWeight: 400, color: T.ink, letterSpacing: "-0.01em",
              }}>
                Refine
              </h3>
              <div style={{ background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px 24px" }}>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: T.muted, fontFamily: "'Geist', sans-serif" }}>
                    Describe how you want to adjust your nutrition targets:
                  </p>
                  <textarea
                    value={refineText}
                    onChange={(e) => setRefineText(e.target.value)}
                    placeholder={`e.g. "Lower sugar to max 5g" or "Increase protein ratio"`}
                    rows={4}
                    disabled={isLoading}
                    style={{
                      width: "100%", padding: "12px 14px", fontSize: 13, lineHeight: 1.6,
                      border: `1px solid ${T.border}`, borderRadius: 10,
                      background: T.cream, color: T.ink,
                      resize: "vertical", fontFamily: "'Geist', sans-serif",
                      boxSizing: "border-box", outline: "none",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(21,60,54,0.4)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
                  />
                  {stepError.dietitian && (
                    <p style={{ margin: "8px 0 0", fontSize: 12, color: T.errorText, fontFamily: "'Geist', sans-serif" }}>
                      {stepError.dietitian}
                    </p>
                  )}
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginTop: 14 }}>
                    <button
                      onClick={() => { setRefineText(""); setStepError("dietitian", null); }}
                      disabled={isLoading}
                      style={{
                        padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                        fontFamily: "'Geist', sans-serif", cursor: "pointer",
                        border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { if (refineText.trim()) handleRefine(); }}
                      disabled={!refineText.trim() || isLoading}
                      style={{
                        padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        fontFamily: "'Geist', sans-serif",
                        cursor: !refineText.trim() || isLoading ? "not-allowed" : "pointer",
                        border: "none",
                        background: !refineText.trim() || isLoading ? "rgba(21,60,54,0.25)" : T.forest,
                        color: T.forestInk,
                        display: "flex", alignItems: "center", gap: 6,
                        transition: "background 0.15s",
                      }}
                    >
                      {stepLoading.dietitian && (
                        <svg width="13" height="13" viewBox="0 0 20 20" style={{ animation: "spin 0.8s linear infinite" }}>
                          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                          <path d="M10 2 A8 8 0 0 1 18 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      )}
                      {stepLoading.dietitian ? "Refining…" : "Refine"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && !stepError.dietitian && (
              <div style={{ padding: "12px 16px", borderRadius: 8, background: T.errorBg, border: `1px solid ${T.errorBorder}`, color: T.errorText, fontSize: 13, fontFamily: "'Geist', sans-serif" }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ position: "sticky", bottom: 0, background: T.cream, borderTop: `1px solid ${T.border}`, padding: "14px 32px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }} />
        <Button variant="secondary" size="md" onClick={() => goToStep(3)} disabled={isLoading}>
          ← Previous
        </Button>
        <Button
          variant="primary" size="md"
          loading={stepLoading.chef}
          loadingMessages={["Designing your recipe…", "Balancing the ingredients…", "Crafting the perfect blend…", "Assigning syringe layers…", "Almost there…"]}
          disabled={isLoading}
          onClick={handleConfirm}
        >
          Confirm — generate recipe →
        </Button>
      </div>

      {/* Modals */}
      {showEditRestrictions && (
        <EditRestrictionsModal
          allergens={allergens}
          onSave={handleSaveRestrictions}
          onClose={() => setShowEditRestrictions(false)}
        />
      )}

    </div>
  );
}
