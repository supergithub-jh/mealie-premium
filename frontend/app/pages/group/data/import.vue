<template>
  <div class="premium-bulk">
    <!-- Mealie Premium: Bulk Import (Data Management). Adds new items only; existing ones are skipped. -->
    <section class="premium-bulk__section">
      <h2 class="premium-bulk__h">
        {{ $t("premium.bulk-what") }}
      </h2>
      <div
        class="d-flex flex-wrap ga-2"
        role="radiogroup"
        :aria-label="$t('premium.bulk-what')"
      >
        <v-btn
          v-for="t in BULK_TYPES"
          :key="t"
          role="radio"
          :aria-checked="type === t"
          :variant="type === t ? 'flat' : 'outlined'"
          color="primary"
          class="text-none"
          @click="selectType(t)"
        >
          {{ typeLabel(t) }}
        </v-btn>
      </div>
      <p class="premium-bulk__hint">
        {{ $t("premium.bulk-recipes-hint") }}
        <RouterLink :to="`/g/${groupSlug}/r/create/bulk`">
          {{ $t("premium.import-tools") }}
        </RouterLink>
      </p>
    </section>

    <section class="premium-bulk__section">
      <div class="d-flex flex-wrap ga-2">
        <v-btn
          variant="tonal"
          color="primary"
          class="text-none"
          :prepend-icon="mdiFileDownloadOutline"
          @click="downloadTemplate"
        >
          {{ $t("premium.bulk-template") }}
        </v-btn>
        <v-btn
          variant="tonal"
          class="text-none"
          :prepend-icon="mdiDatabaseExportOutline"
          :loading="exporting"
          @click="exportCurrent"
        >
          {{ $t("premium.bulk-export") }}
        </v-btn>
      </div>
      <p class="premium-bulk__hint">
        {{ $t("premium.bulk-columns") }}
        <code>{{ BULK_COLUMNS[type].join(", ") }}</code>
        <span v-if="type === 'units'"> · {{ $t("premium.bulk-fraction-hint") }}</span>
        <span v-if="type === 'labels'"> · {{ $t("premium.bulk-color-hint") }}</span>
        <span v-if="type === 'foods'"> · {{ $t("premium.bulk-label-hint") }}</span>
      </p>
    </section>

    <section class="premium-bulk__section">
      <h2 class="premium-bulk__h">
        {{ $t("premium.bulk-add-items") }}
      </h2>
      <v-textarea
        v-model="text"
        :label="$t('premium.bulk-paste')"
        :placeholder="placeholder"
        rows="6"
        auto-grow
        variant="outlined"
        hide-details
        @update:model-value="plan = null; result = null"
      />
      <div class="d-flex flex-wrap align-center ga-2 mt-3">
        <v-btn
          variant="text"
          class="text-none"
          :prepend-icon="mdiUpload"
          @click="fileInput?.click()"
        >
          {{ $t("premium.bulk-upload-csv") }}
        </v-btn>
        <input
          ref="fileInput"
          type="file"
          accept=".csv,text/csv,.txt,text/plain"
          hidden
          @change="onFile"
        >
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          :disabled="!text.trim()"
          :loading="checking"
          @click="preview"
        >
          {{ $t("premium.bulk-preview") }}
        </v-btn>
      </div>
    </section>

    <section
      v-if="plan"
      class="premium-bulk__section"
    >
      <h2 class="premium-bulk__h">
        {{ $t("premium.bulk-preview-title") }}
      </h2>
      <p class="premium-bulk__summary">
        {{ $t("premium.bulk-summary", [counts.new, counts.exists, counts.repeat, counts.invalid]) }}
      </p>
      <div class="premium-bulk__table">
        <v-table density="compact">
          <thead>
            <tr>
              <th class="premium-bulk__check">
                <span class="d-sr-only">{{ $t("premium.bulk-include") }}</span>
              </th>
              <th>{{ $t("premium.bulk-line") }}</th>
              <th
                v-for="col in BULK_COLUMNS[type]"
                :key="col"
              >
                {{ col }}
              </th>
              <th>{{ $t("premium.bulk-status") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in plan"
              :key="row.line"
              :class="{ 'is-skipped': row.status !== 'new' || !included.has(row.line) }"
            >
              <td class="premium-bulk__check">
                <v-checkbox-btn
                  v-if="row.status === 'new'"
                  :model-value="included.has(row.line)"
                  :aria-label="$t('premium.bulk-include')"
                  density="compact"
                  @update:model-value="toggle(row.line)"
                />
              </td>
              <td>{{ row.line }}</td>
              <td
                v-for="col in BULK_COLUMNS[type]"
                :key="col"
              >
                {{ row.values[col] }}
              </td>
              <td>
                <span
                  class="premium-bulk__status"
                  :class="`is-${row.status}`"
                >{{ statusLabel(row) }}</span>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <div
        v-if="importing || result"
        class="mt-4"
      >
        <v-progress-linear
          :model-value="progress"
          color="primary"
          height="8"
          rounded
        />
        <p
          v-if="result"
          class="mt-3 mb-0"
          role="status"
        >
          {{ $t("premium.bulk-done", [result.added, result.failed.length]) }}
          <span v-if="result.failed.length"> {{ result.failed.join(", ") }}</span>
        </p>
      </div>

      <div class="d-flex mt-4">
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          class="text-none"
          :disabled="!included.size || importing || !!result"
          :loading="importing"
          @click="runImport"
        >
          {{ $t("premium.bulk-import-n", [included.size]) }}
        </v-btn>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { mdiDatabaseExportOutline, mdiFileDownloadOutline, mdiUpload } from "@mdi/js";
import { useUserApi } from "~/composables/api";
import { useCategoryStore, useFoodStore, useLabelStore, useTagStore, useToolStore, useUnitStore } from "~/composables/store";
import {
  BULK_COLUMNS,
  BULK_TYPES,
  type BulkType,
  exportCsv,
  type ExportRow,
  isYes,
  parseBulkInput,
  planImport,
  type PlannedRow,
  templateCsv,
} from "~/composables/use-premium-bulk-import";

definePageMeta({
  middleware: ["auth", "can-organize-only"],
});

const i18n = useI18n();
const api = useUserApi();
const auth = useMealieAuth();
const route = useRoute();
const groupSlug = computed(() => (route.params.groupSlug as string) || auth.user.value?.groupSlug || "");

useSeoMeta({ title: i18n.t("premium.bulk-import") });

const type = ref<BulkType>("foods");
const text = ref("");
const plan = ref<PlannedRow[] | null>(null);
const included = ref(new Set<number>());
const checking = ref(false);
const exporting = ref(false);
const importing = ref(false);
const progress = ref(0);
const result = ref<{ added: number; failed: string[] } | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const TYPE_LABELS: Record<BulkType, string> = {
  foods: "general.foods",
  units: "general.units",
  labels: "data-pages.labels.labels",
  tags: "tag.tags",
  categories: "category.categories",
  tools: "tool.tools",
};
const typeLabel = (t: BulkType) => i18n.t(TYPE_LABELS[t]);
const placeholder = computed(() => (type.value === "foods" ? "olive oil\nlemon\ngarlic" : type.value === "units" ? "cup\ntablespoon\ngram" : "…"));

function selectType(t: BulkType) {
  type.value = t;
  plan.value = null;
  result.value = null;
}

// ---------------------------------------------------------------- existing items

let labelIds: Record<string, string> = {};

async function loadExisting(t: BulkType): Promise<ExportRow[]> {
  switch (t) {
    case "foods": {
      const [{ data }, { data: labels }] = await Promise.all([api.foods.getAll(1, -1), api.multiPurposeLabels.getAll(1, -1)]);
      labelIds = Object.fromEntries((labels?.items || []).map(l => [l.name.trim().toLowerCase(), l.id]));
      return (data?.items || []).map(f => ({ name: f.name, plural_name: f.pluralName || "", description: f.description || "", label: f.label?.name || "" }));
    }
    case "units": {
      const { data } = await api.units.getAll(1, -1);
      return (data?.items || []).map(u => ({ name: u.name, plural_name: u.pluralName || "", abbreviation: u.abbreviation || "", fraction: u.fraction ? "yes" : "no" }));
    }
    case "labels": {
      const { data } = await api.multiPurposeLabels.getAll(1, -1);
      return (data?.items || []).map(l => ({ name: l.name, color: l.color || "" }));
    }
    case "tags": {
      const { data } = await api.tags.getAll(1, -1);
      return (data?.items || []).map(x => ({ name: x.name }));
    }
    case "categories": {
      const { data } = await api.categories.getAll(1, -1);
      return (data?.items || []).map(x => ({ name: x.name }));
    }
    case "tools": {
      const { data } = await api.tools.getAll(1, -1);
      return (data?.items || []).map(x => ({ name: x.name }));
    }
  }
}

// ---------------------------------------------------------------- files

function download(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadTemplate() {
  download(`mealie-${type.value}-template.csv`, templateCsv(type.value));
}

async function exportCurrent() {
  exporting.value = true;
  try {
    const rows = await loadExisting(type.value);
    download(`mealie-${type.value}-${new Date().toISOString().slice(0, 10)}.csv`, exportCsv(type.value, rows));
  }
  finally {
    exporting.value = false;
  }
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    text.value = await file.text();
    plan.value = null;
    result.value = null;
  }
  input.value = "";
}

// ---------------------------------------------------------------- preview and import

const counts = computed(() => {
  const c = { new: 0, exists: 0, repeat: 0, invalid: 0 };
  for (const r of plan.value || []) c[r.status]++;
  return c;
});

function statusLabel(row: PlannedRow): string {
  if (row.status === "invalid") return row.errors.map(err => i18n.t(`premium.bulk-error-${err}`)).join(", ");
  return i18n.t(`premium.bulk-status-${row.status}`);
}

function toggle(line: number) {
  const next = new Set(included.value);
  if (next.has(line)) next.delete(line);
  else next.add(line);
  included.value = next;
}

async function preview() {
  checking.value = true;
  result.value = null;
  try {
    const existing = await loadExisting(type.value);
    let rows = planImport(parseBulkInput(type.value, text.value), existing.map(e => e.name || ""));
    if (type.value === "foods") {
      // A label must already exist (Data Management › Labels, or import labels first)
      rows = rows.map(r => (r.status === "new" && r.values.label && !labelIds[r.values.label.trim().toLowerCase()]
        ? { ...r, status: "invalid" as const, errors: ["unknown-label"] }
        : r));
    }
    plan.value = rows;
    included.value = new Set(rows.filter(r => r.status === "new").map(r => r.line));
  }
  finally {
    checking.value = false;
  }
}

function createOne(t: BulkType, v: Record<string, string>) {
  switch (t) {
    case "foods":
      return api.foods.createOne({
        name: v.name!,
        pluralName: v.plural_name || null,
        description: v.description || "",
        labelId: v.label ? labelIds[v.label.trim().toLowerCase()] : null,
      });
    case "units":
      return api.units.createOne({
        name: v.name!,
        pluralName: v.plural_name || null,
        abbreviation: v.abbreviation || "",
        fraction: isYes(v.fraction),
      });
    case "labels":
      return api.multiPurposeLabels.createOne({ name: v.name!, color: v.color || "#959595" });
    case "tags":
      return api.tags.createOne({ name: v.name! });
    case "categories":
      return api.categories.createOne({ name: v.name! });
    case "tools":
      return api.tools.createOne({ name: v.name! });
  }
}

const STORES: Record<BulkType, () => { actions: { refresh: () => Promise<unknown> } }> = {
  foods: () => useFoodStore(),
  units: () => useUnitStore(),
  labels: () => useLabelStore(),
  tags: () => useTagStore(),
  categories: () => useCategoryStore(),
  tools: () => useToolStore(),
};

async function runImport() {
  if (!plan.value) return;
  const rows = plan.value.filter(r => r.status === "new" && included.value.has(r.line));
  importing.value = true;
  progress.value = 0;
  let added = 0;
  const failed: string[] = [];
  for (const [i, row] of rows.entries()) {
    try {
      const { error } = await createOne(type.value, row.values);
      if (error) failed.push(row.values.name!);
      else added++;
    }
    catch {
      failed.push(row.values.name!);
    }
    progress.value = Math.round(((i + 1) / rows.length) * 100);
  }
  importing.value = false;
  result.value = { added, failed };
  // Refresh Mealie's cached lists so the other Data Management pages show the new items
  try { await STORES[type.value]().actions.refresh(); }
  catch { /* the page will refresh on its next load */ }
}
</script>

<style scoped>
.premium-bulk {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 980px;
}

.premium-bulk__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.premium-bulk__h {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1.25rem;
  margin: 0;
}

.premium-bulk__hint {
  margin: 0;
  font-size: 0.88rem;
  opacity: 0.8;
}

.premium-bulk__hint code {
  font-size: 0.85rem;
}

.premium-bulk__summary {
  margin: 0;
}

.premium-bulk__table {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid rgba(var(--v-border-color), 0.12);
}

.premium-bulk__check {
  width: 44px;
}

tr.is-skipped td {
  opacity: 0.55;
}

.premium-bulk__status {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  white-space: nowrap;
  background: var(--premium-soft);
}

.premium-bulk__status.is-invalid {
  background: rgba(var(--v-theme-error), 0.15);
  color: rgb(var(--v-theme-error));
}
</style>
