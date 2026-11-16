<template>
  <!--
    Text box for kitchen quantities: accepts "3/8", "1 1/2", "½", "0.375".
    Stores a plain number (as Mealie expects) and shows it back as a fraction.
    Other props/listeners (label, variant, density, style, @keydown…) pass through to v-text-field.
  -->
  <v-text-field
    v-bind="$attrs"
    :model-value="text"
    inputmode="decimal"
    autocomplete="off"
    :error="invalid"
    :title="$t('premium.quantity-hint')"
    @update:model-value="onInput"
    @update:focused="onFocused"
  />
</template>

<script setup lang="ts">
import { formatQuantity, parseQuantity } from "~/composables/use-premium-quantity";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  /** Value used when the box is cleared (Mealie uses 0 for "no quantity") */
  emptyValue?: number | null;
}>(), {
  emptyValue: 0,
});

const model = defineModel<number | null | undefined>();
const emit = defineEmits<{ "update:focused": [focused: boolean] }>();

const text = ref(formatQuantity(model.value));
const invalid = ref(false);
const focused = ref(false);

// Follow outside changes (e.g. parser, undo) while the user isn't typing
watch(model, (value) => {
  if (!focused.value) {
    text.value = formatQuantity(value);
    invalid.value = false;
  }
});

function onInput(value: string) {
  text.value = value ?? "";
  const parsed = parseQuantity(text.value);
  if (parsed === null) {
    // Can't read it: show red, keep the last good value
    invalid.value = true;
    return;
  }
  invalid.value = false;
  model.value = parsed === undefined ? props.emptyValue : parsed;
}

function onFocused(value: boolean) {
  focused.value = value;
  if (!value) {
    // On leaving the box, tidy the text ("0.375" -> "3/8", or back to the last good value)
    text.value = formatQuantity(model.value);
    invalid.value = false;
  }
  emit("update:focused", value);
}
</script>
