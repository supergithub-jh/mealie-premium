<template>
  <v-container
    v-if="shoppingListChoices && ready"
    class="narrow-container"
  >
    <BaseDialog
      v-model="state.createDialog"
      bottom-sheet
      :title="$t('shopping-list.create-shopping-list')"
      :icon="$globals.icons.formatListCheck"
      can-submit
      :submit-disabled="!isCreateNameValid"
      @submit="createOne"
    >
      <v-card-text>
        <v-text-field
          v-model.trim="state.createName"
          autofocus
          :label="$t('shopping-list.new-list')"
        />
      </v-card-text>
    </BaseDialog>

    <!-- Settings -->
    <BaseDialog
      v-model="state.ownerDialog"
      bottom-sheet
      :icon="$globals.icons.admin"
      :title="$t('user.edit-user')"
      can-confirm
      @confirm="updateOwner"
    >
      <v-container>
        <v-form>
          <v-select
            v-model="updateUserId"
            :items="allUsers"
            item-title="fullName"
            item-value="id"
            :label="$t('general.owner')"
            :prepend-icon="$globals.icons.user"
          />
        </v-form>
      </v-container>
    </BaseDialog>

    <BaseDialog
      v-model="state.deleteDialog"
      bottom-sheet
      :title="$t('general.confirm')"
      :icon="$globals.icons.alertCircle"
      color="error"
      can-confirm
      @confirm="deleteOne"
    >
      <v-card-text>{{ $t('shopping-list.are-you-sure-you-want-to-delete-this-item') }}</v-card-text>
    </BaseDialog>
    <!-- Mealie Premium (v0.4.1): title row and one card per list with what's left to buy -->
    <div class="premium-lists__head">
      <h1 class="premium-lists__title">
        {{ $t('shopping-list.shopping-lists') }}
      </h1>
      <v-btn
        color="primary"
        variant="flat"
        class="text-none"
        :prepend-icon="$globals.icons.createAlt"
        @click="state.createDialog = true"
      >
        {{ $t('shopping-list.new-list') }}
      </v-btn>
    </div>
    <v-checkbox
      v-model="preferences.viewAllLists"
      hide-details
      density="compact"
      :label="$t('general.show-all')"
      class="mb-2"
    />

    <p
      v-if="!shoppingListChoices.length"
      class="premium-lists__empty"
    >
      {{ $t('shopping-list.no-shopping-lists-found') }}
    </p>

    <section class="premium-lists">
      <NuxtLink
        v-for="list in shoppingListChoices"
        :key="list.id"
        :to="`/shopping-lists/${list.id}`"
        class="premium-lists__card"
      >
        <div class="premium-lists__row">
          <span class="premium-lists__name">{{ list.name }}</span>
          <span
            v-if="listCounts[list.id]"
            class="premium-lists__count"
            :class="{ 'premium-lists__count--done': !listCounts[list.id]!.open }"
          >
            {{ listCounts[list.id]!.open ? $t('premium.to-buy', [listCounts[list.id]!.open]) : $t('premium.all-done') }}
          </span>
          <v-btn
            icon
            variant="text"
            size="small"
            :aria-label="$t('user.edit-user')"
            @click.prevent="toggleOwnerDialog(list)"
          >
            <v-icon>{{ $globals.icons.user }}</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="small"
            :aria-label="$t('general.delete')"
            @click.prevent="openDelete(list.id)"
          >
            <v-icon>{{ $globals.icons.delete }}</v-icon>
          </v-btn>
        </div>
        <div
          class="premium-lists__progress"
          aria-hidden="true"
        >
          <div :style="{ width: `${listProgress(list.id)}%` }" />
        </div>
        <div
          v-if="list.recipeReferences?.length"
          class="premium-lists__muted"
        >
          {{ $t('shopping-list.linked-recipes-count', list.recipeReferences.length) }}
        </div>
      </NuxtLink>
    </section>
  </v-container>
</template>

<script setup lang="ts">
import type { ShoppingListOut } from "~/lib/api/types/household";
import { useUserApi } from "~/composables/api";
import { useAsyncKey } from "~/composables/use-utils";
import { useShoppingListPreferences } from "~/composables/use-users/preferences";
import type { UserOut } from "~/lib/api/types/user";

definePageMeta({
  middleware: ["auth"],
});

const auth = useMealieAuth();
const i18n = useI18n();
const ready = ref(false);
const userApi = useUserApi();
const route = useRoute();

useSeoMeta({
  title: i18n.t("shopping-list.shopping-list"),
});

const overrideDisableRedirect = ref(false);
const disableRedirect = computed(() => route.query.disableRedirect === "true" || overrideDisableRedirect.value);
const preferences = useShoppingListPreferences();

const state = reactive({
  createName: "",
  createDialog: false,
  deleteDialog: false,
  deleteTarget: "",
  ownerDialog: false,
  ownerTarget: ref<ShoppingListOut | null>(null),
});
const isCreateNameValid = computed(() => state.createName.trim().length > 0);

const { data: shoppingLists } = useAsyncData(useAsyncKey(), async () => {
  return await fetchShoppingLists();
});

const shoppingListChoices = computed(() => {
  if (!shoppingLists.value) {
    return [];
  }

  return shoppingLists.value.filter(list => preferences.value.viewAllLists || list.userId === auth.user.value?.id);
});

// This has to appear before the shoppingListChoices watcher, otherwise that runs first and the redirect is not disabled
watch(
  () => preferences.value.viewAllLists,
  () => {
    overrideDisableRedirect.value = true;
  },
);

watch(
  () => shoppingListChoices,
  () => {
    if (!disableRedirect.value && shoppingListChoices.value.length === 1) {
      navigateTo(`/shopping-lists/${shoppingListChoices.value[0].id}`);
    }
    else {
      ready.value = true;
    }
  },
  {
    deep: true,
  },
);

async function fetchShoppingLists() {
  const { data } = await userApi.shopping.lists.getAll(1, -1, { orderBy: "name", orderDirection: "asc" });

  if (!data) {
    return [];
  }

  return data.items;
}

// Mealie Premium: items left / done per list, for the cards (two small requests per list)
const listCounts = ref<Record<string, { open: number; done: number }>>({});
async function loadCounts(lists: ShoppingListOut[]) {
  const results = await Promise.all(lists.map(async (list) => {
    const filter = (checked: boolean) => `shoppingListId = "${list.id}" AND checked = ${checked}`;
    const [open, done] = await Promise.all([
      userApi.shopping.items.getAll(1, 1, { queryFilter: filter(false) }),
      userApi.shopping.items.getAll(1, 1, { queryFilter: filter(true) }),
    ]);
    return [list.id, { open: open.data?.total ?? 0, done: done.data?.total ?? 0 }] as const;
  }));
  listCounts.value = Object.fromEntries(results);
}
watch(shoppingListChoices, lists => loadCounts(lists), { immediate: true });
function listProgress(id: string) {
  const c = listCounts.value[id];
  if (!c || !(c.open + c.done)) return 0;
  return Math.round((c.done / (c.open + c.done)) * 100);
}

async function refresh() {
  shoppingLists.value = await fetchShoppingLists();
}

async function createOne() {
  if (!isCreateNameValid.value) return;
  const { data } = await userApi.shopping.lists.createOne({ name: state.createName.trim() });

  if (data) {
    refresh();
    state.createName = "";
  }
}

async function toggleOwnerDialog(list: ShoppingListOut) {
  if (!state.ownerDialog) {
    state.ownerTarget = list;
    await fetchAllUsers();
  }
  state.ownerDialog = !state.ownerDialog;
}

// ===============================================================
// Shopping List Edit User/Owner

const allUsers = ref<UserOut[]>([]);
const updateUserId = ref<string | undefined>();
async function fetchAllUsers() {
  const { data } = await userApi.households.fetchMembers();
  if (!data) {
    return;
  }

  // update current user
  allUsers.value = data.items.sort((a, b) => ((a.fullName || "") < (b.fullName || "") ? -1 : 1));
  updateUserId.value = state.ownerTarget?.userId;
}

async function updateOwner() {
  if (!state.ownerTarget || !updateUserId.value) {
    return;
  }
  // user has not changed, so we should not update
  if (state.ownerTarget.userId === updateUserId.value) {
    return;
  }
  // get full list, so the move does not delete shopping list items
  const { data: fullList } = await userApi.shopping.lists.getOne(state.ownerTarget.id);
  if (!fullList) {
    return;
  }
  const { data } = await userApi.shopping.lists.updateOne(
    state.ownerTarget.id,
    { ...fullList, userId: updateUserId.value },
  );

  if (data) {
    refresh();
  }
}

function openDelete(id: string) {
  state.deleteDialog = true;
  state.deleteTarget = id;
}

async function deleteOne() {
  const { data } = await userApi.shopping.lists.deleteOne(state.deleteTarget);
  if (data) {
    refresh();
  }
}
</script>

<style scoped>
.premium-lists__head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.premium-lists__title {
  flex: 1;
  margin: 0;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 2rem;
  font-weight: 700;
}

.premium-lists {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.premium-lists__card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 12px 16px 20px;
  border-radius: 20px;
  background: rgb(var(--v-theme-surface));
  box-shadow: var(--cookbook-shadow, 0 4px 16px rgba(50, 44, 37, 0.06));
  color: inherit;
  text-decoration: none;
}

.v-theme--dark .premium-lists__card {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.premium-lists__card:hover,
.premium-lists__card:focus-visible {
  outline: 2px solid rgba(var(--v-theme-primary), 0.5);
  outline-offset: -2px;
}

.premium-lists__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.premium-lists__name {
  flex: 1;
  min-width: 0;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1.3rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.premium-lists__count {
  font-weight: 600;
  font-size: 0.9rem;
  color: rgb(var(--v-theme-primary));
  white-space: nowrap;
}

.premium-lists__count--done,
.premium-lists__muted,
.premium-lists__empty {
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-weight: 500;
}

.premium-lists__muted {
  font-size: 0.85rem;
}

.premium-lists__progress {
  height: 6px;
  margin-right: 8px;
  border-radius: 999px;
  background: var(--premium-soft);
  overflow: hidden;
}

.premium-lists__progress > div {
  height: 100%;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
}
</style>
