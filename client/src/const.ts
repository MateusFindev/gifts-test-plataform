// consts.ts

const rawAppTitle = import.meta.env.VITE_APP_TITLE;
const rawAppLogo = import.meta.env.VITE_APP_LOGO;
const rawAnalyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
const rawAnalyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

const hasText = (value: string | undefined | null): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const APP_TITLE = hasText(rawAppTitle) ? rawAppTitle.trim() : "App";

export const APP_LOGO = hasText(rawAppLogo)
  ? rawAppLogo.trim()
  : "/logo.png";

export const ADMIN_LOGIN_PATH = "/admin/login";

export const ANALYTICS_ENDPOINT = hasText(rawAnalyticsEndpoint)
  ? rawAnalyticsEndpoint.trim().replace(/\/+$/, "")
  : "";

export const ANALYTICS_WEBSITE_ID = hasText(rawAnalyticsWebsiteId)
  ? rawAnalyticsWebsiteId.trim()
  : "";

// 🔐 Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  // Logs pra ver o que está vindo de fato
  console.log("VITE_OAUTH_PORTAL_URL =", oauthPortalUrl);
  console.log("VITE_APP_ID =", appId);

  if (!hasText(oauthPortalUrl)) {
    console.error("[getLoginUrl] VITE_OAUTH_PORTAL_URL não configurada ou vazia");
    // evita quebrar a app
    return "/";
  }

  if (!hasText(appId)) {
    console.error("[getLoginUrl] VITE_APP_ID não configurada ou vazia");
    return "/";
  }

  const base = oauthPortalUrl.trim().replace(/\/+$/, "");

  let url: URL;
  try {
    url = new URL("/app-auth", base);
  } catch (err) {
    console.error("[getLoginUrl] URL base inválida:", base, err);
    return "/";
  }

  url.searchParams.set("appId", appId.trim());
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
