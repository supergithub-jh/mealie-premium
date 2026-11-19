<template>
  <div class="d-flex align-center">
    <LanguageDialog v-model="languageDialog" />
    <AnnouncementDialog
      v-if="loggedIn"
      v-model="announcementsDialog"
    />

    <v-menu
      v-if="loggedIn && user"
      location="bottom end"
      :offset="8"
    >
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          icon
          variant="text"
          :aria-label="$t('premium.profile-menu')"
        >
          <v-badge
            :model-value="!!newAnnouncements.length"
            color="accent"
            dot
          >
            <UserAvatar
              list
              :user-id="user.id"
              :tooltip="false"
              size="36"
            />
          </v-badge>
        </v-btn>
      </template>

      <v-list
        density="comfortable"
        min-width="250"
        class="premium-menu"
      >
        <v-list-item
          :title="user.fullName || ''"
          :subtitle="user.email"
          to="/user/profile"
        />
        <v-divider class="my-1" />
        <v-list-item
          v-if="isOwnGroup"
          :prepend-icon="mdiHeartOutline"
          :title="$t('general.favorites')"
          :to="`/user/${user.id}/favorites`"
        />

        <!-- Phone and tablet: items that live in the sidebar on desktop -->
        <template v-if="compact">
          <v-list-item
            v-for="link in extraLinks"
            :key="link.key"
            :prepend-icon="link.icon"
            :title="link.title"
            :to="link.to"
          />
        </template>

        <v-divider class="my-1" />
        <v-list-item
          v-for="link in nav.settings"
          :key="link.key"
          :prepend-icon="link.icon"
          :title="link.title"
          :to="link.to"
        />
        <v-list-item
          v-if="announcementsEnabled"
          :prepend-icon="mdiBullhornOutline"
          :title="$t('announcements.announcements')"
          @click="announcementsDialog = true"
        />
        <v-list-item
          :prepend-icon="mdiTranslate"
          :title="$t('sidebar.language')"
          @click="languageDialog = true"
        />
        <v-list-item
          :prepend-icon="isDark ? mdiWeatherSunny : mdiWeatherNight"
          :title="isDark ? $t('settings.theme.light-mode') : $t('settings.theme.dark-mode')"
          @click="toggleDark"
        />
        <v-divider class="my-1" />
        <v-list-item
          :prepend-icon="mdiLogout"
          :title="$t('user.logout')"
          @click="logout"
        />
        <div class="premium-menu__version">
          {{ versionLabel }}
        </div>
      </v-list>
    </v-menu>

    <v-btn
      v-else-if="!loggedIn"
      variant="text"
      to="/login"
      :prepend-icon="mdiAccountOutline"
    >
      {{ $t("user.login") }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import {
  mdiAccountOutline,
  mdiBullhornOutline,
  mdiHeartOutline,
  mdiLogout,
  mdiTranslate,
  mdiWeatherNight,
  mdiWeatherSunny,
} from "@mdi/js";
import { useTheme } from "vuetify";
import AnnouncementDialog from "~/components/Domain/Announcement/AnnouncementDialog.vue";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import { useAnnouncements } from "~/composables/use-announcements";
import { useLoggedInState } from "~/composables/use-logged-in-state";
import { usePremiumNav } from "~/composables/use-premium-nav";
import { useToggleDarkMode } from "~/composables/use-utils";
import { premiumVersionLabel } from "~/premium-version";

defineProps({
  /** Phone/tablet layout: also list the sidebar-only items */
  compact: {
    type: Boolean,
    default: false,
  },
});

const auth = useMealieAuth();
const user = computed(() => auth.user.value);
const { loggedIn, isOwnGroup } = useLoggedInState();
const { nav, collections } = usePremiumNav();
const { announcementsEnabled, newAnnouncements } = useAnnouncements();
const theme = useTheme();
const isDark = computed(() => theme.current.value.dark);
const toggleDark = useToggleDarkMode();

const versionLabel = premiumVersionLabel();

const languageDialog = ref(false);
const announcementsDialog = ref(false);

const extraLinks = computed(() => [
  ...nav.value.sidebar.filter(link => link.key === "import"),
  ...nav.value.more,
  ...collections.value,
]);

async function logout() {
  try {
    await auth.signOut("/login?direct=1");
  }
  catch (e) {
    console.error(e);
  }
}
</script>

<style scoped>
.premium-menu__version {
  padding: 6px 16px 4px;
  font-size: 0.72rem;
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}
</style>
