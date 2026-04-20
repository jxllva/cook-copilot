"use client";

import React, { useRef, useEffect, useState } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { runParse, runDietitian } from "../../lib/api";
import type { UserProfile, Sex, ActivityLevel, Allergen, MedicalCondition } from "../../lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const EXAMPLES = [
  "Crispy chickpea chips shaped like little stars",
  "A soft oat cookie with honey and cinnamon for breakfast",
  "Savory pasta bites with tomato and basil, high protein",
  "A colorful fruit-flavored cube for an afternoon snack",
  "Dark chocolate and nut energy bar, low sugar",
  "Fluffy pancake rounds with berry filling",
];

const SEX_OPTIONS: { label: string; value: Sex }[] = [
  { label: "Female", value: "female" },
  { label: "Male", value: "male" },
  { label: "Other / prefer not to say", value: "other" },
];

const ACTIVITY_OPTIONS: { label: string; value: ActivityLevel }[] = [
  { label: "Sedentary", value: "sedentary" },
  { label: "Light (1–3×/week)", value: "light" },
  { label: "Moderate (3–5×/week)", value: "moderate" },
  { label: "Active (6–7×/week)", value: "active" },
  { label: "Very Active (daily + training)", value: "very_active" },
];

const ALLERGEN_LABELS: Record<Allergen, string> = {
  peanuts: "Peanuts", tree_nuts: "Tree nuts", dairy: "Dairy", eggs: "Eggs",
  wheat_gluten: "Wheat/Gluten", soy: "Soy", fish: "Fish", shellfish: "Shellfish", sesame: "Sesame",
};

const CONDITION_LABELS: Record<MedicalCondition, string> = {
  none: "None", pregnancy: "Pregnancy", gestational_diabetes: "Gestational Diabetes",
  type1_diabetes: "Type 1 Diabetes", type2_diabetes: "Type 2 Diabetes",
  hypertension: "Hypertension", cardiovascular_disease: "Cardiovascular Disease",
  celiac_disease: "Celiac Disease", ibs_ibd: "IBS / IBD", kidney_disease: "Kidney Disease",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M10 2 A8 8 0 0 1 18 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// ─── Edit Profile Modal (inline, wizard context) ──────────────────────────────

function EditProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: UserProfile;
  onClose: () => void;
  onSave: (data: Partial<UserProfile>) => void;
}) {
  const [name, setName] = useState(profile.profileName);
  const [sex, setSex] = useState<Sex>(profile.sex);
  const [age, setAge] = useState(String(profile.age || ""));
  const [height, setHeight] = useState(String(profile.heightCm || ""));
  const [weight, setWeight] = useState(String(profile.weightKg || ""));
  const [activity, setActivity] = useState<ActivityLevel>(profile.activityLevel);
  const [allergies, setAllergies] = useState<Allergen[]>(profile.allergies);
  const [conditions, setConditions] = useState<MedicalCondition[]>(profile.medicalConditions);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleAllergen = (a: Allergen) =>
    setAllergies((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  const toggleCondition = (c: MedicalCondition) => {
    if (c === "none") { setConditions(["none"]); return; }
    setConditions((prev) => {
      const without = prev.filter((x) => x !== "none");
      return without.includes(c) ? without.filter((x) => x !== c) : [...without, c];
    });
  };

  const handleSave = () => {
    onSave({
      profileName: name.trim() || profile.profileName,
      sex, age: Number(age), heightCm: Number(height), weightKg: Number(weight),
      activityLevel: activity, allergies, medicalConditions: conditions,
    });
  };

  const inputStyle: React.CSSProperties = {
    padding: "9px 12px", borderRadius: 8, width: "100%",
    border: "1.5px solid #1A141030", background: "transparent",
    color: "#1A1410", fontFamily: "'Geist', sans-serif", fontSize: 14,
    outline: "none", boxSizing: "border-box",
  };

  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 500,
      border: `1.5px solid ${active ? "#153c36" : "#1A141030"}`,
      background: active ? "#153c36" : "transparent",
      color: active ? "#FFF4E6" : "#1A1410",
      cursor: "pointer", fontFamily: "'Geist', sans-serif",
      transition: "background .1s, color .1s, border-color .1s",
    }}>{children}</button>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(26,20,16,.4)", backdropFilter: "blur(4px)", padding: 24 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(540px, 100%)", background: "#FFFFFF",
          border: "1.5px solid #1A141020", borderRadius: 20,
          padding: "26px 28px 22px", color: "#1A1410",
          maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
          fontFamily: "'Geist', sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontFamily: "'Instrument Serif', serif", fontWeight: 400 }}>Edit profile</h2>
          <button onClick={onClose} style={{ fontSize: 20, color: "#6B5D50", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", letterSpacing: ".08em", textTransform: "uppercase", color: "#6B5D50", display: "block", marginBottom: 6 }}>Name</label>
            <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>

          {/* Sex */}
          <div>
            <label style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", letterSpacing: ".08em", textTransform: "uppercase", color: "#6B5D50", display: "block", marginBottom: 8 }}>Sex</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SEX_OPTIONS.map((o) => <Chip key={o.value} active={sex === o.value} onClick={() => setSex(o.value)}>{o.label}</Chip>)}
            </div>
          </div>

          {/* Age / Height / Weight */}
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "Age (yrs)", val: age, set: setAge },
              { label: "Height (cm)", val: height, set: setHeight },
              { label: "Weight (kg)", val: weight, set: setWeight },
            ].map(({ label, val, set }) => (
              <div key={label} style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", letterSpacing: ".08em", textTransform: "uppercase", color: "#6B5D50", display: "block", marginBottom: 6 }}>{label}</label>
                <input type="number" min="0" value={val} onChange={(e) => set(e.target.value)} placeholder="—" style={inputStyle} />
              </div>
            ))}
          </div>

          {/* Activity */}
          <div>
            <label style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", letterSpacing: ".08em", textTransform: "uppercase", color: "#6B5D50", display: "block", marginBottom: 8 }}>Activity level</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ACTIVITY_OPTIONS.map((o) => <Chip key={o.value} active={activity === o.value} onClick={() => setActivity(o.value)}>{o.label}</Chip>)}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", letterSpacing: ".08em", textTransform: "uppercase", color: "#6B5D50", display: "block", marginBottom: 8 }}>Allergies</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(Object.entries(ALLERGEN_LABELS) as [Allergen, string][]).map(([k, v]) => (
                <Chip key={k} active={allergies.includes(k)} onClick={() => toggleAllergen(k)}>{v}</Chip>
              ))}
            </div>
          </div>

          {/* Medical conditions */}
          <div>
            <label style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", letterSpacing: ".08em", textTransform: "uppercase", color: "#6B5D50", display: "block", marginBottom: 8 }}>Medical conditions</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(Object.entries(CONDITION_LABELS) as [MedicalCondition, string][]).map(([k, v]) => (
                <Chip key={k} active={conditions.includes(k)} onClick={() => toggleCondition(k)}>{v}</Chip>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ padding: "10px 16px", borderRadius: 10, background: "transparent", color: "#6B5D50", fontSize: 14, border: "none", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} style={{
            padding: "10px 20px", borderRadius: 10, background: "rgb(21,60,54)", color: "#FFF4E6",
            fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
          }}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Switcher Dropdown ────────────────────────────────────────────────

function ProfileSwitcher() {
  const { profiles, selectedProfileId, selectProfile, updateProfile } = useWizardStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const current = profiles.find((p) => p.id === selectedProfileId) ?? profiles[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!profiles.length) return null;

  return (
    <>
      <div ref={ref} style={{ position: "relative", display: "flex", justifyContent: "flex-end", marginBottom: 28 }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: 999,
            background: "#FFFFFF", border: "1.5px solid #1A141018",
            cursor: "pointer", color: "#1A1410",
            fontFamily: "'Geist', sans-serif", fontSize: 14, fontWeight: 500,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            transition: "box-shadow .15s",
          }}
        >
          <span style={{ color: "#6B5D50" }}><PersonIcon /></span>
          <span>{current?.profileName ?? "Profile"}</span>
          <span style={{ color: "#6B5D50", display: "flex", alignItems: "center", transition: "transform .15s", transform: open ? "rotate(180deg)" : "none" }}>
            <ChevronDown />
          </span>
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: "#FFFFFF", border: "1.5px solid #1A141015",
            borderRadius: 14, minWidth: 220, zIndex: 50,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "6px 8px" }}>
              {profiles.map((p) => {
                const isActive = p.id === selectedProfileId;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex", alignItems: "center",
                      borderRadius: 8,
                      background: isActive ? "rgba(21,60,54,0.07)" : "transparent",
                    }}
                  >
                    <button
                      onClick={() => { selectProfile(p.id); setOpen(false); }}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 10px", background: "transparent", border: "none",
                        cursor: "pointer", textAlign: "left",
                        fontFamily: "'Geist', sans-serif",
                      }}
                    >
                      <span style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: isActive ? "rgb(21,60,54)" : "#F0EDE8",
                        color: isActive ? "#FFF4E6" : "#6B5D50",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 600, flexShrink: 0,
                      }}>
                        {p.profileName.charAt(0).toUpperCase()}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, color: "#1A1410", lineHeight: 1.2 }}>
                          {p.profileName}
                        </div>
                        {isActive && (
                          <div style={{ fontSize: 11, color: "rgb(21,60,54)", fontFamily: "'Geist Mono', monospace", letterSpacing: ".04em" }}>
                            ACTIVE
                          </div>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpen(false); setEditing(p); }}
                      title="Edit profile"
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: "none",
                        background: "transparent", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#6B5D50", marginRight: 4, flexShrink: 0,
                        transition: "background .12s, color .12s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F0EDE8"; (e.currentTarget as HTMLElement).style.color = "#1A1410"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#6B5D50"; }}
                    >
                      <EditIcon />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {editing && (
        <EditProfileModal
          profile={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => { updateProfile(editing.id, data); setEditing(null); }}
        />
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Step3Prompt() {
  const {
    getSelectedProfile,
    prompt,
    setPrompt,
    setParsedPrompt,
    setDietitianOutput,
    setStepLoading,
    setStepError,
    stepLoading,
    stepError,
    appendLog,
    goToStep,
  } = useWizardStore();

  const profile = getSelectedProfile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 120)}px`;
  }, [prompt]);

  async function handleSubmit() {
    if (!prompt.trim() || !profile) return;
    setStepLoading("dietitian", true);
    setStepError("dietitian", null);
    const t0 = Date.now();
    try {
      const parsed = await runParse(prompt);
      setParsedPrompt(parsed);
      const result = await runDietitian(profile, parsed.meal_type);
      appendLog({
        stage: "dietitian",
        request: { profile },
        response: result as unknown as Record<string, unknown>,
        timestamp: t0,
        duration_ms: Date.now() - t0,
      });
      setDietitianOutput(result);
      goToStep(4);
    } catch (err) {
      setStepError("dietitian", err instanceof Error ? err.message : "Failed to run dietitian.");
    } finally {
      setStepLoading("dietitian", false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleExampleClick(ex: string) {
    setSelectedExample(ex);
    setPrompt(ex);
    textareaRef.current?.focus();
  }

  const isLoading = stepLoading.dietitian;
  const error = stepError.dietitian;
  const canSubmit = prompt.trim().length > 0 && !isLoading;
  const name = profile?.profileName ?? "you";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
      `}</style>

      {/* Loading bar */}
      {isLoading && (
        <div style={{
          position: "fixed", top: 72, left: 0, right: 0,
          height: 3, zIndex: 50,
          background: "linear-gradient(90deg, transparent, rgb(21,60,54), transparent)",
          backgroundSize: "400px 100%",
          animation: "shimmer 1.2s ease infinite",
        }} />
      )}

      <div style={{
        flex: 1,
        background: "rgb(244, 244, 232)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        overflowY: "auto",
        fontFamily: "'Geist', system-ui, sans-serif",
      }}>
        <div style={{ width: "100%", maxWidth: 640 }}>

          {/* Profile switcher — top right */}
          <ProfileSwitcher />

          {/* Greeting */}
          <div style={{ marginBottom: 32, animation: "fadeUp 0.35s ease both" }}>
            <h1 style={{
              fontSize: "clamp(28px, 5vw, 46px)",
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              color: "rgb(24, 29, 41)",
              margin: "0 0 10px",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}>
              Let&apos;s print food for{" "}
              <em style={{ color: "rgb(21, 60, 54)", fontStyle: "italic" }}>{name}</em>!
            </h1>
            <p style={{ fontSize: 16, color: "#6B5D50", margin: 0, lineHeight: 1.5 }}>
              Describe what you&apos;d like — our AI will design and fabricate it for you.
            </p>
          </div>

          {/* Textarea card */}
          <div style={{
            background: "#FFFFFF",
            border: "1.5px solid #1A1410",
            borderRadius: 16,
            overflow: "hidden",
            opacity: isLoading ? 0.75 : 1,
            transition: "opacity .2s",
            animation: "fadeUp 0.35s 0.08s ease both",
          }}>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); setSelectedExample(null); }}
              onKeyDown={handleKeyDown}
              placeholder="Describe your food idea… e.g. crispy chickpea chips shaped like little stars"
              disabled={isLoading}
              rows={4}
              style={{
                width: "100%",
                padding: "18px 20px 10px",
                fontSize: 16,
                lineHeight: 1.6,
                border: "none",
                background: "transparent",
                color: "rgb(24, 29, 41)",
                resize: "none",
                outline: "none",
                fontFamily: "'Geist', sans-serif",
                minHeight: 120,
                boxSizing: "border-box",
              }}
            />

            {/* Submit row */}
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 14px 12px" }}>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 999,
                  background: canSubmit ? "rgb(21, 60, 54)" : "transparent",
                  color: canSubmit ? "#FFF4E6" : "#6B5D50",
                  border: `1.5px solid ${canSubmit ? "rgb(21,60,54)" : "#6B5D5050"}`,
                  fontSize: 14, fontWeight: 600,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  fontFamily: "'Geist', sans-serif",
                  transition: "all .15s",
                }}
              >
                {isLoading ? <><Spinner /> Analyzing…</> : "Print →"}
              </button>
            </div>
          </div>

          {/* Example prompts */}
          <div style={{ marginTop: 14, animation: "fadeUp 0.35s 0.16s ease both" }}>
            <p style={{
              fontSize: 11,
              fontFamily: "'Geist Mono', monospace",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "#6B5D50",
              margin: "0 0 9px",
            }}>
              Try an example
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {EXAMPLES.map((ex) => {
                const isActive = selectedExample === ex;
                return (
                  <button
                    key={ex}
                    onClick={() => handleExampleClick(ex)}
                    disabled={isLoading}
                    style={{
                      padding: "8px 14px", borderRadius: 999,
                      border: `1.5px solid ${isActive ? "rgb(21,60,54)" : "#1A141028"}`,
                      background: isActive ? "rgb(21, 60, 54)" : "transparent",
                      color: isActive ? "#FFF4E6" : "#1A1410",
                      fontSize: 13, fontFamily: "'Geist', sans-serif",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      transition: "all .12s", textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive && !isLoading) {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgb(21,60,54)";
                        (e.currentTarget as HTMLElement).style.background = "rgba(21,60,54,0.06)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.borderColor = "#1A141028";
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }
                    }}
                  >
                    {ex}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading status */}
          {isLoading && (
            <div style={{
              marginTop: 24,
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 18px",
              background: "#FFFFFF",
              border: "1.5px solid #1A141015",
              borderRadius: 12,
              animation: "fadeUp 0.3s ease both",
            }}>
              <span style={{ color: "rgb(21, 60, 54)", flexShrink: 0 }}><Spinner /></span>
              <p style={{ fontSize: 14, color: "#6B5D50", margin: 0, animation: "pulse 1.8s ease infinite" }}>
                Creating nutrition targets for{" "}
                <strong style={{ color: "rgb(21,60,54)" }}>{name}</strong>…
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 16, padding: "12px 16px", borderRadius: 10,
              background: "#FEF2F2", border: "1px solid #FECACA",
              color: "#DC2626", fontSize: 13, fontFamily: "'Geist', sans-serif",
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
