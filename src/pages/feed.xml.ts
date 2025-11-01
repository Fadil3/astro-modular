import type { APIRoute } from 'astro';
import { siteConfig } from '../config';
import { fetchStrapiPosts } from '../utils/strapi';

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.toString() || siteConfig.site;
  
  // Get all posts from Strapi
  const response = await fetchStrapiPosts({ 
    pageSize: 1000, // Get all posts for feed
    locale: 'en' 
  });
  
  // Extract posts array from response
  const posts = response.items || [];
  
  // Sort posts by date (newest first)
  const sortedPosts = posts.sort((a: any, b: any) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  
  // Generate Atom feed XML
  const atomFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${siteConfig.title}</title>
  <subtitle>${siteConfig.description}</subtitle>
  <link href="${siteUrl}"/>
  <link href="${siteUrl}feed.xml" rel="self"/>
  <id>${siteUrl}</id>
  <author>
    <name>${siteConfig.author}</name>
  </author>
  <updated>${new Date().toISOString()}</updated>
  
  ${sortedPosts.map((post: any) => `
  <entry>
    <title>${post.title}</title>
    <link href="${siteUrl}post/${post.slug}/"/>
    <id>${siteUrl}post/${post.slug}/</id>
    <published>${new Date(post.publishedAt).toISOString()}</published>
    <updated>${new Date(post.publishedAt).toISOString()}</updated>
    <summary>${post.description || post.excerpt || ''}</summary>
    ${post.tags ? post.tags.map((tag: string) => `<category term="${tag}"/>`).join('') : ''}
  </entry>`).join('')}
</feed>`;
  
  return new Response(atomFeed, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
};
