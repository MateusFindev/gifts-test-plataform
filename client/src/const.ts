export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const rawAppTitle = import.meta.env.VITE_APP_TITLE;
const rawAppLogo = import.meta.env.VITE_APP_LOGO;
const rawAnalyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
const rawAnalyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

const hasText = (value: string | undefined | null): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const APP_TITLE = hasText(rawAppTitle) ? rawAppTitle.trim() : "App";

export const APP_LOGO = hasText(rawAppLogo)
  ? rawAppLogo.trim()
  : "/controlfin-logo.png";

export const ANALYTICS_ENDPOINT = hasText(rawAnalyticsEndpoint)
  ? rawAnalyticsEndpoint.trim().replace(/\/+$, "")
  : "";

export const ANALYTICS_WEBSITE_ID = hasText(rawAnalyticsWebsiteId)
  ? rawAnalyticsWebsiteId.trim()
  : "";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
