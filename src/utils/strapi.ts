// Minimal Strapi client utilities for Astro Modular (REST API)
// Reads STRAPI_URL and optional STRAPI_TOKEN from environment

type StrapiMedia = {
  data?: {
    id: number;
    attributes: {
      url: string;
      formats?: Record<string, { url: string }>;
      width?: number;
      height?: number;
    };
  } | null;
};

type StrapiCategory = {
  id: number;
  attributes: { name: string };
};

type StrapiPostAttrs = {
  title: string;
  slug: string;
  content?: string; // richtext HTML per SCHEMA.md
  banner?: StrapiMedia;
  categories?: { data: StrapiCategory[] };
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  locale?: string;
};

type StrapiItem<T> = { id: number; attributes: T };
type StrapiCollectionRes<T> = {
  data: Array<StrapiItem<T>>;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};

export type StrapiPost = {
  id: number;
  slug: string;
  title: string;
  date: Date;
  imageUrl?: string;
  tags: string[]; // mapped from categories
  excerpt?: string;
  html?: string; // full HTML for detail page
  locale?: string;
};

export type StrapiPage = {
  id: number;
  slug: string;
  title: string;
  description?: string;
  imageUrl?: string;
  html?: string;
  lastModified?: Date;
  locale?: string;
};

export type StrapiProject = {
  id: number;
  slug: string;
  title: string;
  description?: string;
  date: Date;
  imageUrl?: string;
  categories: string[];
  repositoryUrl?: string;
  demoUrl?: string;
  status?: string;
  html?: string;
  featured?: boolean;
  locale?: string;
};

export type StrapiDoc = {
  id: number;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  order?: number;
  version?: string;
  imageUrl?: string;
  html?: string;
  lastModified?: Date;
  showTOC?: boolean;
  featured?: boolean;
  locale?: string;
};

function getEnv(name: string, fallback?: string) {
  const v = (import.meta as any).env?.[name] ?? process.env[name];
  return v ?? fallback;
}

function joinUrl(base: string, path: string) {
  if (!base) return path;
  if (!path) return base;
  if (path.startsWith("http")) return path;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function absoluteMediaUrl(media?: any, base?: string) {
  if (!media) return undefined;
  // Strapi v5 flattened
  if (typeof media.url === "string") {
    return media.url.startsWith("http")
      ? media.url
      : joinUrl(base || "", media.url);
  }
  // Strapi v4 nested
  const url = media?.data?.attributes?.url;
  return url ? joinUrl(base || "", url) : undefined;
}

function stripHtml(html?: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toExcerpt(html?: string, max = 180): string | undefined {
  const text = stripHtml(html);
  if (!text) return undefined;
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

function mapPost(item: any, baseUrl: string): StrapiPost {
  // Support v4 (item.attributes) and v5 (flattened)
  const a = item?.attributes ? item.attributes : item;
  const dateStr = a.publishedAt || a.createdAt || new Date().toISOString();
  // Categories: v4 -> { data: [{ attributes: { name } }] }, v5 -> [{ name }]
  const categories = Array.isArray(a.categories?.data)
    ? a.categories.data.map((c: any) => c.attributes?.name)
    : Array.isArray(a.categories)
    ? a.categories.map((c: any) => c.attributes?.name ?? c.name)
    : [];
  return {
    id: item.id,
    slug: a.slug,
    title: a.title,
    date: new Date(dateStr),
    imageUrl: absoluteMediaUrl(a.banner, baseUrl),
    tags: categories.filter(Boolean),
    excerpt: toExcerpt(a.content),
    html: a.content,
    locale: a.locale,
  };
}

function mapPage(item: any, baseUrl: string): StrapiPage {
  const a = item?.attributes ? item.attributes : item;
  return {
    id: item.id,
    slug: a.slug,
    title: a.title,
    description: a.description,
    imageUrl: absoluteMediaUrl(a.coverImage, baseUrl),
    html: a.content,
    lastModified: a.lastModified ? new Date(a.lastModified) : undefined,
    locale: a.locale,
  };
}

function mapProject(item: any, baseUrl: string): StrapiProject {
  const a = item?.attributes ? item.attributes : item;
  const dateStr = a.date || a.createdAt || new Date().toISOString();
  const categories = Array.isArray(a.categories?.data)
    ? a.categories.data.map((c: any) => c.attributes?.name)
    : Array.isArray(a.categories)
    ? a.categories.map((c: any) => c.attributes?.name ?? c.name)
    : [];
  return {
    id: item.id,
    slug: a.slug,
    title: a.title,
    description: a.description,
    date: new Date(dateStr),
    imageUrl: absoluteMediaUrl(a.coverImage, baseUrl),
    categories: categories.filter(Boolean),
    repositoryUrl: a.repositoryUrl,
    demoUrl: a.demoUrl,
    status: a.status,
    html: a.content,
    featured: a.featured ?? false,
    locale: a.locale,
  };
}

function mapDoc(item: any, baseUrl: string): StrapiDoc {
  const a = item?.attributes ? item.attributes : item;
  return {
    id: item.id,
    slug: a.slug,
    title: a.title,
    description: a.description,
    category: a.category,
    order: a.order,
    version: a.version,
    imageUrl: absoluteMediaUrl(a.coverImage, baseUrl),
    html: a.content,
    lastModified: a.lastModified ? new Date(a.lastModified) : undefined,
    showTOC: a.showTOC ?? true,
    featured: a.featured ?? false,
    locale: a.locale,
  };
}

async function strapiFetch<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<T> {
  // IMPORTANT: STRAPI_URL must be set in the environment at runtime (Netlify Functions)
  // e.g., in Netlify UI > Site settings > Environment variables, or netlify.toml
  const base = getEnv("STRAPI_URL", "");
  const token = getEnv("STRAPI_TOKEN");

  if (!base) {
    // Provide a clear, actionable error instead of throwing an Invalid URL
    throw new Error(
      "STRAPI_URL environment variable is not set. Set STRAPI_URL to your Strapi base URL (e.g., https://cms.server-fadil.my.id) in your deployment environment so server-side routes can fetch content."
    );
  }

  // Build the API URL robustly using URL's base parameter
  const url = new URL(`/api${path}`, base);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(
      `Strapi request failed: ${res.status} ${res.statusText} for ${url.toString()}`
    );
  }
  return (await res.json()) as T;
}

export async function fetchStrapiPosts(
  options: {
    page?: number;
    pageSize?: number;
    tag?: string; // category name
    locale?: string;
  } = {}
) {
  const { page = 1, pageSize = 10, tag, locale } = options;
  const base = getEnv("STRAPI_URL", "");
  const params: Record<string, any> = {
    populate: "*",
    sort: "publishedAt:desc",
    "pagination[page]": page,
    "pagination[pageSize]": pageSize,
  };
  if (locale) params["locale"] = locale;
  if (tag) params["filters[categories][name][$eq]"] = tag;

  const data = await strapiFetch<any>("/posts", params);
  const items = (data.data || []).map((it: any) => mapPost(it, base));
  const meta = (data.meta && data.meta.pagination) || {
    page: 1,
    pageSize,
    pageCount: 1,
    total: items.length,
  };
  return { items, meta };
}

export async function fetchStrapiPostBySlug(slug: string, locale?: string) {
  const base = getEnv("STRAPI_URL", "");
  const params: Record<string, any> = {
    "filters[slug][$eq]": slug,
    populate: "*",
  };
  if (locale) params["locale"] = locale;
  const res = await strapiFetch<any>("/posts", params);
  const item = res.data?.[0];
  return item ? mapPost(item, base) : null;
}

export async function fetchStrapiSlugs(locale?: string) {
  const params: Record<string, any> = {
    fields: "slug",
    sort: "publishedAt:desc",
  };
  if (locale) params["locale"] = locale;
  // fetch large pageSize to get all slugs (adjust if needed)
  (params as any)["pagination[pageSize]"] = 1000;
  const res = await strapiFetch<any>("/posts", params);
  return (res.data || [])
    .map((d: any) => (d.attributes ? d.attributes.slug : d.slug))
    .filter(Boolean);
}

// ===== Pages =====
export async function fetchStrapiPages(options: { locale?: string } = {}) {
  const { locale } = options;
  const base = getEnv("STRAPI_URL", "");
  const params: Record<string, any> = {
    populate: "*",
    sort: "title:asc",
  };
  if (locale) params["locale"] = locale;

  const data = await strapiFetch<any>("/pages", params);
  const items = (data.data || []).map((it: any) => mapPage(it, base));
  return items;
}

export async function fetchStrapiPageBySlug(slug: string, locale?: string) {
  const base = getEnv("STRAPI_URL", "");
  const params: Record<string, any> = {
    "filters[slug][$eq]": slug,
    populate: "*",
  };
  if (locale) params["locale"] = locale;
  const res = await strapiFetch<any>("/pages", params);
  const item = res.data?.[0];
  return item ? mapPage(item, base) : null;
}

// ===== Projects =====
export async function fetchStrapiProjects(
  options: { category?: string; locale?: string } = {}
) {
  const { category, locale } = options;
  const base = getEnv("STRAPI_URL", "");
  const params: Record<string, any> = {
    populate: "*",
    sort: "date:desc",
  };
  if (locale) params["locale"] = locale;
  if (category) params["filters[categories][name][$eq]"] = category;

  const data = await strapiFetch<any>("/projects", params);
  const items = (data.data || []).map((it: any) => mapProject(it, base));
  return items;
}

export async function fetchStrapiProjectBySlug(slug: string, locale?: string) {
  const base = getEnv("STRAPI_URL", "");
  const params: Record<string, any> = {
    "filters[slug][$eq]": slug,
    populate: "*",
  };
  if (locale) params["locale"] = locale;
  const res = await strapiFetch<any>("/projects", params);
  const item = res.data?.[0];
  return item ? mapProject(item, base) : null;
}

// ===== Docs =====
export async function fetchStrapiDocs(
  options: { category?: string; locale?: string } = {}
) {
  const { category, locale } = options;
  const base = getEnv("STRAPI_URL", "");
  const params: Record<string, any> = {
    populate: "*",
    sort: "order:asc",
  };
  if (locale) params["locale"] = locale;
  if (category) params["filters[category][$eq]"] = category;

  const data = await strapiFetch<any>("/docs", params);
  const items = (data.data || []).map((it: any) => mapDoc(it, base));
  return items;
}

export async function fetchStrapiDocBySlug(slug: string, locale?: string) {
  const base = getEnv("STRAPI_URL", "");
  const params: Record<string, any> = {
    "filters[slug][$eq]": slug,
    populate: "*",
  };
  if (locale) params["locale"] = locale;
  const res = await strapiFetch<any>("/docs", params);
  const item = res.data?.[0];
  return item ? mapDoc(item, base) : null;
}
