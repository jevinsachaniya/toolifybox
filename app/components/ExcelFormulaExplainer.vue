<script setup>
import { computed, ref, watch } from 'vue';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clipboard,
  Code2,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  HelpCircle,
  Info,
  Lightbulb,
  RotateCcw,
  Search,
  Sparkles,
  Table,
  TriangleAlert,
  Wand2,
} from '@lucide/vue';
import {
  analyzeExcelFormula,
  EXCEL_CATEGORIES,
  EXCEL_FORMULAS_DATABASE,
} from '~/utils/excel-formulas.js';

// User formula input
const userFormula = ref('=XLOOKUP(A2, $D$2:$D$50, $E$2:$E$50, "Not Found")');
const copiedFormula = ref(false);
const copiedCorrected = ref(false);
const activeCategory = ref('all');
const searchQuery = ref('');

// Popular presets for instant testing
const samplePresets = [
  { label: 'XLOOKUP (Modern)', formula: '=XLOOKUP(A2, $D$2:$D$50, $E$2:$E$50, "Not Found")' },
  { label: 'VLOOKUP with Fix', formula: '=VLOOKUP(A2, D2:G50, 3)' }, // intentionally missing FALSE and $
  { label: 'SUMIFS (Multi-Rule)', formula: '=SUMIFS(D2:D100, A2:A100, "North", C2:C100, ">1000")' },
  { label: 'Nested IF & AND', formula: '=IF(AND(A2>=18, B2="Approved"), "Granted", "Denied")' },
  { label: 'INDEX + MATCH', formula: '=INDEX($C$2:$C$100, MATCH(A2, $A$2:$A$100, 0))' },
  { label: 'TEXTSPLIT Array', formula: '=TEXTSPLIT(A2, ", ")' },
];

// Live Analysis
const analysis = computed(() => {
  return analyzeExcelFormula(userFormula.value);
});

function loadFormula(f) {
  userFormula.value = f;
  window.scrollTo({ top: 380, behavior: 'smooth' });
}

function clearFormula() {
  userFormula.value = '';
}

async function copyText(text, isCorrected = false) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    if (isCorrected) {
      copiedCorrected.value = true;
      setTimeout(() => (copiedCorrected.value = false), 2000);
    } else {
      copiedFormula.value = true;
      setTimeout(() => (copiedFormula.value = false), 2000);
    }
  } catch {
    // fallback
  }
}

// Filtered Formulas Catalog
const filteredFormulas = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const cat = activeCategory.value;

  return EXCEL_FORMULAS_DATABASE.filter((f) => {
    const matchesCat = cat === 'all' || f.category === cat;
    if (!matchesCat) return false;
    if (!q) return true;

    return (
      f.name.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.syntax.toLowerCase().includes(q) ||
      f.exampleFormula.toLowerCase().includes(q)
    );
  });
});
</script>

<template>
  <div class="excel-formula-container">
    <!-- ================= STAGE 1: INTERACTIVE FORMULA INPUT & EXPLAINER ================= -->
    <div class="formula-explainer-card">
      <div class="explainer-header">
        <div class="explainer-badge">
          <FileSpreadsheet :size="16" />
          <span>Interactive Formula Inspector &amp; Fixer</span>
        </div>
        <div class="explainer-header-note">
          Type or paste any Excel formula to inspect its syntax, understand arguments, and get instant fixes.
        </div>
      </div>

      <!-- Quick Preset Chips -->
      <div class="preset-chips-wrap">
        <span class="preset-label"><Sparkles :size="13" /> Try an example:</span>
        <div class="preset-chips">
          <button
            v-for="p in samplePresets"
            :key="p.label"
            type="button"
            class="preset-chip-btn"
            @click="loadFormula(p.formula)"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <!-- Formula Bar (Excel Style) -->
      <div class="formula-bar-wrapper">
        <div class="fx-icon-box">
          <span>fx</span>
        </div>
        <div class="formula-input-inner">
          <input
            v-model="userFormula"
            type="text"
            placeholder="e.g. =XLOOKUP(A2, $D$2:$D$50, $E$2:$E$50, &quot;Not Found&quot;)"
            class="formula-input-field"
            spellcheck="false"
            autocomplete="off"
          />
        </div>
        <div class="formula-bar-actions">
          <button
            v-if="userFormula"
            type="button"
            class="bar-btn secondary"
            title="Clear formula"
            @click="clearFormula"
          >
            Clear
          </button>
          <button
            v-if="userFormula"
            type="button"
            class="bar-btn copy"
            title="Copy formula"
            @click="copyText(userFormula)"
          >
            <Check v-if="copiedFormula" :size="14" />
            <Copy v-else :size="14" />
            <span>{{ copiedFormula ? 'Copied' : 'Copy' }}</span>
          </button>
        </div>
      </div>

      <!-- Real-Time Analysis Display -->
      <div v-if="analysis" class="analysis-results-box">
        <!-- Status Indicator Bar -->
        <div class="analysis-status-strip" :class="{ valid: analysis.isValid, invalid: !analysis.isValid }">
          <div class="status-left">
            <CheckCircle2 v-if="analysis.isValid" :size="20" class="status-icon green" />
            <TriangleAlert v-else :size="20" class="status-icon amber" />
            <div>
              <span class="status-title">
                {{ analysis.isValid ? 'Formula Syntax is Valid' : 'Formula Needs Attention' }}
              </span>
              <p class="status-desc">{{ analysis.summary }}</p>
            </div>
          </div>
          <div class="status-func-tag">
            <code>{{ analysis.functionName }}</code>
          </div>
        </div>

        <!-- Errors or Warnings Alerts -->
        <div v-if="analysis.errors.length > 0" class="alert-box error">
          <CircleAlert :size="16" />
          <div class="alert-content">
            <strong>Errors Found:</strong>
            <ul>
              <li v-for="(err, i) in analysis.errors" :key="i">{{ err }}</li>
            </ul>
          </div>
        </div>

        <div v-if="analysis.warnings.length > 0" class="alert-box warning">
          <TriangleAlert :size="16" />
          <div class="alert-content">
            <strong>Warnings / Best Practice:</strong>
            <ul>
              <li v-for="(warn, i) in analysis.warnings" :key="i">{{ warn }}</li>
            </ul>
          </div>
        </div>

        <!-- Suggested Optimized / Corrected Formula -->
        <div v-if="analysis.suggestions.length > 0" class="suggested-formula-box">
          <div class="suggested-header">
            <Lightbulb :size="16" />
            <span>Suggested Correction &amp; Optimization:</span>
          </div>
          <div class="suggested-code-row">
            <code class="suggested-code">{{ analysis.suggestedFormula }}</code>
            <button
              type="button"
              class="copy-suggested-btn"
              @click="copyText(analysis.suggestedFormula, true)"
            >
              <Check v-if="copiedCorrected" :size="14" />
              <Copy v-else :size="14" />
              <span>{{ copiedCorrected ? 'Copied!' : 'Copy Corrected' }}</span>
            </button>
          </div>
          <ul class="suggestion-notes">
            <li v-for="(sug, i) in analysis.suggestions" :key="i">{{ sug }}</li>
          </ul>
        </div>

        <!-- Two-Column Grid: Arguments Breakdown (Left) & Execution Steps (Right) -->
        <div class="analysis-details-grid">
          <!-- Left: Parameter Breakdown -->
          <div class="analysis-pane">
            <h4 class="pane-title">
              <Table :size="16" />
              <span>Formula Argument Breakdown</span>
            </h4>
            <div class="args-list">
              <div
                v-for="arg in analysis.argsAnalysis"
                :key="arg.name"
                class="arg-item-card"
                :class="{ missing: arg.status === 'missing' }"
              >
                <div class="arg-card-header">
                  <span class="arg-name">
                    {{ arg.name }}
                    <b v-if="arg.required" class="required-star">*</b>
                  </span>
                  <code class="arg-value">{{ arg.value }}</code>
                </div>
                <div class="arg-desc">{{ arg.description }}</div>
              </div>
            </div>
          </div>

          <!-- Right: How Excel Calculates This Step-by-Step -->
          <div class="analysis-pane">
            <h4 class="pane-title">
              <Code2 :size="16" />
              <span>Step-by-Step Calculation</span>
            </h4>
            <ol class="steps-flow-list">
              <li v-for="(step, sIdx) in analysis.executionSteps" :key="sIdx">
                {{ step }}
              </li>
            </ol>

            <!-- Function Reference Quick Tip -->
            <div v-if="analysis.knownDef && analysis.knownDef.tips" class="tips-subcard">
              <div class="tip-subcard-title">
                <Lightbulb :size="14" />
                <span>Pro Tips for {{ analysis.knownDef.name }}:</span>
              </div>
              <ul>
                <li v-for="(tip, tIdx) in analysis.knownDef.tips" :key="tIdx">
                  {{ tip }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= STAGE 2: FORMULA LIBRARY & ENCYCLOPEDIA ================= -->
    <div class="formula-library-section">
      <div class="library-top-bar">
        <div>
          <h3 class="library-title">Excel Formulas Encyclopedia &amp; Examples</h3>
          <p class="library-subtitle">
            Browse essential functions across Lookup, Logic, Math, Text, and Dates with interactive syntax and sample spreadsheets.
          </p>
        </div>

        <!-- Search Bar -->
        <div class="library-search-box">
          <Search :size="16" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search formulas (e.g. XLOOKUP, IF, SUMIFS)..."
            class="library-search-input"
          />
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="category-pills-row">
        <button
          v-for="cat in EXCEL_CATEGORIES"
          :key="cat.id"
          type="button"
          class="cat-pill-btn"
          :class="{ active: activeCategory === cat.id }"
          @click="activeCategory = cat.id"
        >
          <span>{{ cat.label }}</span>
        </button>
      </div>

      <!-- Formula Cards Grid -->
      <div class="formula-cards-grid">
        <article
          v-for="f in filteredFormulas"
          :key="f.name"
          class="formula-card"
        >
          <div class="formula-card-header">
            <div class="formula-name-wrap">
              <span class="formula-name">{{ f.name }}</span>
              <span class="formula-badge">{{ f.badge }}</span>
            </div>
            <div class="formula-cat-pill">{{ f.category }}</div>
          </div>

          <p class="formula-desc">{{ f.description }}</p>

          <!-- Syntax Code -->
          <div class="formula-syntax-box">
            <span class="syntax-label">Syntax:</span>
            <code class="syntax-code">{{ f.syntax }}</code>
          </div>

          <!-- Realistic Spreadsheet Table Preview -->
          <div class="sample-table-box">
            <div class="sample-table-label">Example Spreadsheet:</div>
            <table class="mini-sheet-table">
              <thead>
                <tr>
                  <th v-for="h in f.sampleTable.headers" :key="h">{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rIdx) in f.sampleTable.rows" :key="rIdx">
                  <td v-for="(cell, cIdx) in row" :key="cIdx">{{ cell }}</td>
                </tr>
              </tbody>
            </table>

            <div class="sample-formula-bar">
              <span class="res-fx">fx</span>
              <code class="res-code">{{ f.sampleTable.resultRow.formula }}</code>
              <div class="res-output">
                &rarr; <b>{{ f.sampleTable.resultRow.result }}</b>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="formula-card-actions">
            <button
              type="button"
              class="card-action-btn primary"
              @click="loadFormula(f.exampleFormula)"
            >
              <Wand2 :size="14" />
              <span>Test in Explainer</span>
            </button>

            <button
              type="button"
              class="card-action-btn secondary"
              @click="copyText(f.exampleFormula)"
            >
              <Copy :size="14" />
              <span>Copy</span>
            </button>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.excel-formula-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* ================= Explainer Card ================= */
.formula-explainer-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 24px;
  box-shadow: 0 10px 35px -5px rgba(15, 23, 42, 0.08);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.explainer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.explainer-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  color: #15803d;
  font-size: 13px;
  font-weight: 700;
}

.explainer-header-note {
  font-size: 13px;
  color: var(--muted, #64748b);
}

/* Preset Chips */
.preset-chips-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.preset-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted, #64748b);
}

.preset-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.preset-chip-btn {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-chip-btn:hover {
  background: #f0fdf4;
  border-color: #86efac;
  color: #15803d;
  transform: translateY(-1px);
}

/* Formula Bar */
.formula-bar-wrapper {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 2px solid #cbd5e1;
  border-radius: 14px;
  padding: 4px 8px;
  gap: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.formula-bar-wrapper:focus-within {
  border-color: #16a34a;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.15);
}

.fx-icon-box {
  width: 34px;
  height: 34px;
  background: #15803d;
  color: #ffffff;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 15px;
  font-weight: 900;
  font-style: italic;
  flex-shrink: 0;
  font-family: serif;
}

.formula-input-inner {
  flex: 1;
  min-width: 0;
}

.formula-input-field {
  width: 100%;
  border: none;
  background: transparent;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  outline: none;
  padding: 6px 0;
}

.formula-bar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #334155;
}

.bar-btn:hover {
  background: #f1f5f9;
}

.bar-btn.copy {
  background: #15803d;
  color: #ffffff;
  border-color: #15803d;
}

.bar-btn.copy:hover {
  background: #166534;
}

/* Analysis Box */
.analysis-results-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

.analysis-status-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.analysis-status-strip.valid {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.analysis-status-strip.invalid {
  background: #fffbeb;
  border-color: #fde68a;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-icon.green {
  color: #16a34a;
}

.status-icon.amber {
  color: #d97706;
}

.status-title {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}

.status-desc {
  font-size: 12px;
  color: var(--muted, #64748b);
  margin-top: 2px;
}

.status-func-tag code {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 12px;
  color: #15803d;
}

/* Alerts */
.alert-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
}

.alert-box.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.alert-box.warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.alert-content ul {
  margin: 4px 0 0 16px;
  padding: 0;
}

/* Suggested Formula Box */
.suggested-formula-box {
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggested-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 800;
  color: #166534;
}

.suggested-code-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 8px 12px;
}

.suggested-code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #15803d;
  word-break: break-all;
}

.copy-suggested-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #15803d;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.copy-suggested-btn:hover {
  background: #166534;
}

.suggestion-notes {
  margin: 0 0 0 18px;
  font-size: 12px;
  color: #166534;
}

/* 2-Column Grid */
.analysis-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 6px;
}

@media (max-width: 860px) {
  .analysis-details-grid {
    grid-template-columns: 1fr;
  }
}

.analysis-pane {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pane-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}

.args-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.arg-item-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.arg-item-card.missing {
  border-color: #fca5a5;
  background: #fef2f2;
}

.arg-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.arg-name {
  font-size: 12px;
  font-weight: 800;
  color: #0f172a;
}

.required-star {
  color: #ef4444;
}

.arg-value {
  font-size: 12px;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  color: #15803d;
}

.arg-desc {
  font-size: 11px;
  color: var(--muted, #64748b);
  line-height: 1.4;
}

.steps-flow-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12.5px;
  color: #334155;
  line-height: 1.5;
}

.tips-subcard {
  margin-top: 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 12px;
}

.tip-subcard-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 800;
  color: #166534;
  margin-bottom: 6px;
}

.tips-subcard ul {
  margin: 0;
  padding-left: 16px;
  font-size: 11.5px;
  color: #166534;
  line-height: 1.5;
}

/* ================= Encyclopedia Section ================= */
.formula-library-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.library-top-bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.library-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.library-subtitle {
  font-size: 13.5px;
  color: var(--muted, #64748b);
  margin-top: 4px;
}

.library-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 8px 14px;
  width: min(340px, 100%);
  color: #64748b;
}

.library-search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  width: 100%;
  color: #0f172a;
}

/* Category Pills */
.category-pills-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cat-pill-btn {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cat-pill-btn:hover {
  background: #f8fafc;
  color: #0f172a;
}

.cat-pill-btn.active {
  background: #15803d;
  color: #ffffff;
  border-color: #15803d;
}

/* Formula Cards Grid */
.formula-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

@media (max-width: 600px) {
  .formula-cards-grid {
    grid-template-columns: 1fr;
  }
}

.formula-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.formula-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.formula-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.formula-name-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.formula-name {
  font-size: 18px;
  font-weight: 900;
  font-family: 'Fira Code', 'Consolas', monospace;
  color: #0f172a;
}

.formula-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 6px;
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.formula-cat-pill {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 6px;
}

.formula-desc {
  font-size: 12.5px;
  color: #475569;
  line-height: 1.5;
  margin: 0;
}

.formula-syntax-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.syntax-label {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
}

.syntax-code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  word-break: break-all;
}

/* Sample Spreadsheet Table */
.sample-table-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sample-table-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
}

.mini-sheet-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  font-family: monospace;
}

.mini-sheet-table th,
.mini-sheet-table td {
  border: 1px solid #e2e8f0;
  padding: 4px 8px;
  text-align: left;
}

.mini-sheet-table th {
  background: #f1f5f9;
  font-weight: 700;
  color: #334155;
}

.mini-sheet-table tr:nth-child(even) td {
  background: #f8fafc;
}

.sample-formula-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 11.5px;
  flex-wrap: wrap;
}

.res-fx {
  font-weight: 900;
  font-style: italic;
  color: #15803d;
}

.res-code {
  font-weight: 700;
  color: #0f172a;
}

.res-output {
  margin-left: auto;
  color: #15803d;
  font-weight: 800;
}

/* Actions */
.formula-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
}

.card-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.card-action-btn.primary {
  flex: 1;
  background: #15803d;
  color: #ffffff;
  border: none;
}

.card-action-btn.primary:hover {
  background: #166534;
}

.card-action-btn.secondary {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
}

.card-action-btn.secondary:hover {
  background: #f1f5f9;
}
</style>
