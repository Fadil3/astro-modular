/// <reference types="astro/client" />

declare global {
  const __SITE_CONFIG__: any;
}

interface ImportMetaEnv {
  readonly GOOGLE_ANALYTICS_ID: string;
  readonly API_KEY: string;
  readonly STRAPI_URL: string;
  readonly STRAPI_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
