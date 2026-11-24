import { joinURL } from "ufo";

// Mealie Premium: in development, forward /ai-helper/* to the AI helper (mealie-ai-helper), as the
// reverse proxy does in production. Production builds are static, so this file isn't used there.
export default defineEventHandler((event) => {
  const helperUrl = process.env.AI_HELPER_URL || "http://localhost:9100";
  return proxyRequest(event, joinURL(helperUrl, event.path));
});
