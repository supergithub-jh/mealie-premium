// File was already correctly named
import { applyPremiumTerms } from "../premium-terms"; // Mealie Premium wording

export default defineI18nLocale(async () => {
  const { en: $vuetify } = await import("vuetify/locale");
  const { default: enUS } = await import("../messages/en-US.json");
  const { default: unitNames } = await import(
    "../../../../mealie/repos/seed/resources/units/locales/en-US.json",
  );
  return {
    ...applyPremiumTerms(enUS),
    "unit-names": unitNames,
    $vuetify,
  };
});
