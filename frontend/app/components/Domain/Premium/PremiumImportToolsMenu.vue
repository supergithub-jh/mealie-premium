<template>
  <!-- Always labelled "Import Tools"; the current tool is ticked in the list. -->
  <v-menu
    location="bottom end"
    :offset="8"
  >
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        color="primary"
        variant="flat"
        :prepend-icon="mdiTrayArrowDown"
        :append-icon="mdiChevronDown"
        class="text-none"
      >
        {{ $t("premium.import-tools") }}
      </v-btn>
    </template>
    <v-list
      density="comfortable"
      min-width="260"
      class="premium-menu"
    >
      <template
        v-for="item in visibleItems"
        :key="item.value"
      >
        <v-list-item
          :prepend-icon="item.icon"
          :title="item.text"
          :active="item.value === modelValue"
          color="primary"
          @click="modelValue = item.value"
        >
          <template
            v-if="item.value === modelValue"
            #append
          >
            <v-icon
              :icon="mdiCheck"
              size="small"
            />
          </template>
        </v-list-item>
      </template>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { mdiCheck, mdiChevronDown, mdiTrayArrowDown } from "@mdi/js";
import type { MenuItem } from "~/components/global/BaseOverflowButton.vue";

const props = defineProps<{ items: MenuItem[] }>();
const modelValue = defineModel<string>();

const visibleItems = computed(() => props.items.filter(item => !item.hide && item.value));
</script>
