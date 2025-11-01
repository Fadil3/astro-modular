import rss from "@astrojs/rss";
import { siteConfig } from "../config";
import { fetchStrapiPosts } from "../utils/strapi";

function getMimeTypeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

export async function GET(context: any) {
  // Get all posts from Strapi
  const response = await fetchStrapiPosts({
    pageSize: 1000, // Get all posts for feed
    locale: "en",
  });

  // Extract posts array from response
  const posts = response.items || [];

  // Filter out drafts (Strapi should already do this, but double-check)
  const publishedPosts = posts.filter((post: any) => post.publishedAt);

  // Sort by date (newest first)
  const sortedPosts = publishedPosts.sort(
    (a: any, b: any) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const siteUrl = context.site?.toString() || siteConfig.site;

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: siteUrl,
    items: sortedPosts.map((post: any) => {
      const postUrl = `${siteUrl}post/${post.slug}`;

      return {
        title: post.title,
        description: post.description || post.excerpt || "",
        pubDate: new Date(post.publishedAt),
        link: postUrl,
        categories: post.tags || [],
        author: siteConfig.author,
        // Include image if available
        enclosure: post.imageUrl
          ? {
              url: post.imageUrl,
              type: getMimeTypeFromPath(post.imageUrl),
              length: 0, // Length is optional
            }
          : undefined,
        customData: [
          post.targetKeyword && `<keyword>${post.targetKeyword}</keyword>`,
          post.imageUrl && `<image>${post.imageUrl}</image>`,
        ]
          .filter(Boolean)
          .join(""),
      };
    }),

    // RSS 2.0 extensions
    customData: `
      <language>${siteConfig.language}</language>
      <copyright>Copyright © ${new Date().getFullYear()} ${
      siteConfig.author
    }</copyright>
      <managingEditor>${siteConfig.author}</managingEditor>
      <webMaster>${siteConfig.author}</webMaster>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <generator>Astro RSS</generator>
      <docs>https://www.rssboard.org/rss-specification</docs>
      <ttl>60</ttl>
    `,

    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
      content: "http://purl.org/rss/1.0/modules/content/",
      dc: "http://purl.org/dc/elements/1.1/",
    },
  });
}
