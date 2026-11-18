<template>
  <!-- "Choose a picture": saves one of the fork's illustrated avatars as the normal profile picture -->
  <div>
    <v-btn
      variant="text"
      color="primary"
      size="small"
      :prepend-icon="mdiImageMultipleOutline"
      class="text-none"
      @click="open = true"
    >
      {{ $t("premium.choose-picture") }}
    </v-btn>

    <v-dialog
      v-model="open"
      max-width="460"
    >
      <v-card class="pa-2">
        <v-card-title class="premium-avatar__title">
          {{ $t("premium.choose-picture") }}
        </v-card-title>
        <v-card-text>
          <div
            class="premium-avatar__grid"
            role="radiogroup"
            :aria-label="$t('premium.choose-picture')"
          >
            <button
              v-for="avatar in PREMIUM_AVATARS"
              :key="avatar.file"
              type="button"
              role="radio"
              class="premium-avatar__option"
              :class="{ 'is-selected': selected === avatar.file }"
              :aria-checked="selected === avatar.file"
              :aria-label="avatar.label"
              :title="avatar.label"
              @click="selected = avatar.file"
            >
              <img
                :src="avatarUrl(avatar.file)"
                alt=""
                width="64"
                height="64"
              >
            </button>
          </div>
          <p
            v-if="failed"
            class="text-error mt-3 mb-0"
          >
            {{ $t("premium.picture-failed") }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-btn
            variant="text"
            class="text-none"
            @click="open = false"
          >
            {{ $t("general.cancel") }}
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="flat"
            class="text-none"
            :disabled="!selected"
            :loading="saving"
            @click="save"
          >
            {{ $t("premium.use-picture") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { mdiImageMultipleOutline } from "@mdi/js";
import { useUserApi } from "~/composables/api";
import { PREMIUM_AVATARS } from "~/composables/use-premium-avatars";

const props = defineProps<{ userId: string }>();
const emit = defineEmits<{ uploaded: [] }>();

const api = useUserApi();
const open = ref(false);
const selected = ref<string | null>(null);
const saving = ref(false);
const failed = ref(false);

function avatarUrl(file: string) {
  return `/avatars/premium/${file}`;
}

/** Draw the SVG onto a canvas and return it as a PNG (Mealie's image upload expects a photo format). */
async function toPng(file: string): Promise<Blob> {
  const img = new Image();
  img.src = avatarUrl(file);
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  canvas.getContext("2d")!.drawImage(img, 0, 0, 512, 512);
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not create the image");
  return blob;
}

async function save() {
  if (!selected.value || !props.userId) return;
  saving.value = true;
  failed.value = false;
  try {
    const formData = new FormData();
    formData.append("profile", await toPng(selected.value), `${selected.value.replace(".svg", "")}.png`);
    const { error } = await api.upload.file(`/api/users/${props.userId}/image`, formData);
    if (error) throw error;
    open.value = false;
    emit("uploaded");
  }
  catch {
    failed.value = true;
  }
  finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.premium-avatar__title {
  font-family: "Playfair Display", Georgia, serif;
}

.premium-avatar__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.premium-avatar__option {
  aspect-ratio: 1;
  border-radius: 50%;
  border: 3px solid transparent;
  padding: 0;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.premium-avatar__option img {
  width: 100%;
  height: 100%;
  display: block;
}

.premium-avatar__option.is-selected {
  border-color: rgb(var(--v-theme-primary));
}

.premium-avatar__option:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>
