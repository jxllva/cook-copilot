"use client";

import { useEffect, useState } from "react";
import { useWizardStore } from "../../store/wizardStore";
import { Step5ChefV2 } from "../../components/wizard/Step5ChefV2";
import type { ChefResponse, ParsedPrompt } from "../../lib/types";

// ── Mock data matching the screenshot ────────────────────────────────────────

const MOCK_PARSED_PROMPT: ParsedPrompt = {
  meal_type: "snack",
  shape: "baby_chick",
  ingredients: ["chickpea", "tahini", "greek yogurt"],
  menu: "Crispy Chickpea Chips",
};

const MOCK_CHEF_OUTPUT: ChefResponse = {
  menu_name: "Crispy Chickpea Chips",
  num_syringes: 2,
  syringe_recipes: [
    {
      syringe_id: 1,
      title: "Chickpea Tahini Flavor",
      label: "Protein-rich Paste",
      ingredients: ["5g chickpea", "4g tahini", "30g whole-milk Greek yogurt"],
      instructions: [
        "Combine chickpea, tahini, and Greek yogurt in a blender and puree until completely smooth.",
        "Pass the puree through a fine mesh to remove any remaining solids for nozzle safety.",
        "Adjust thickness with up to 2g water if needed to ensure smooth extrusion.",
        "Load into the syringe and cap until ready to print",
      ],
      calculated_grams: 39,
    },
    {
      syringe_id: 2,
      title: "Lemon Herb Accent",
      label: "Bright Finishing Layer",
      ingredients: ["10g cream cheese", "2g lemon zest", "1g fresh dill", "5g water"],
      instructions: [
        "Soften cream cheese to room temperature and whip until smooth.",
        "Fold in lemon zest and finely chopped dill until evenly distributed.",
        "Add water gradually and mix until pipeable consistency is reached.",
        "Transfer to syringe and keep refrigerated until printing.",
      ],
      calculated_grams: 18,
    },
  ],
  post_processing: [],
  silhouette_image_b64: null,
  syringe_system_specs: [],
  validation_warnings: [],
  retrieved_chunks: [],
  nutrition_facts: {
    serving_size_g: 56,
    calories: 124,
    total_fat_g: 4,
    saturated_fat_g: 1.1,
    trans_fat_g: 0,
    cholesterol_mg: 4,
    sodium_mg: 25,
    total_carbs_g: 18.1,
    dietary_fiber_g: 2.1,
    total_sugars_g: 2.4,
    protein_g: 4.5,
    resolved_ingredients: [],
  },
};

// ── Seed + render ─────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const { setChefOutput, setParsedPrompt, chefOutput } = useWizardStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "app");
    setParsedPrompt(MOCK_PARSED_PROMPT);
    setChefOutput(MOCK_CHEF_OUTPUT);
    setReady(true);
  }, [setChefOutput, setParsedPrompt]);

  return (
    <div style={{ height: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <header
        style={{
          flexShrink: 0,
          background: "#080808",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "0 32px",
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "rgba(240,240,240,0.9)",
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* Logo mark */}
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#354f22" />
            <path d="M12 26 C12 18 20 12 28 16 C24 18 22 22 24 28" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="20" cy="24" r="4" fill="#fff" opacity="0.9" />
          </svg>
          CookCopilot
        </span>

        <span
          style={{
            fontSize: "12px",
            color: "rgba(240,240,240,0.4)",
            background: "rgba(255,255,255,0.06)",
            padding: "4px 10px",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          Design Preview — Step 5
        </span>
      </header>

      {/* Step 5 content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        {ready && chefOutput && <Step5ChefV2 />}
      </main>
    </div>
  );
}
