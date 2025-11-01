
import type { APIRoute } from 'astro';
import { siteConfig } from '../config';
import { fetchStrapiPosts, fetchStrapiPages, fetchStrapiProjects, fetchStrapiDocs } from '../utils/strapi';

function shouldExcludeFromSitemap(slug: string): boolean {
  const excludedSlugs = ['404', 'sitemap', 'rss', 'home', 'not-found-page'];
  return excludedSlugs.includes(slug);
}

export const GET: APIRoute = async ({ site }) => {  
  const siteUrl = site?.toString() || siteConfig.site;  
  const locale = 'en';
    
  // Get all content from Strapi
  const postsResponse = await fetchStrapiPosts({ pageSize: 1000, locale });
  const pages = await fetchStrapiPages({ locale });
  const projects = siteConfig.optionalContentTypes.projects 
    ? await fetchStrapiProjects({ locale })
    : [];
  const docs = siteConfig.optionalContentTypes.docs 
    ? await fetchStrapiDocs({ locale })
    : [];
  
  const posts = postsResponse.items || [];
  
  // Filter out excluded pages
  const visiblePages = pages.filter((page: any) =>   
    !shouldExcludeFromSitemap(page.slug)  
  ); 
  
  // Generate URLs
  const urls: string[] = [];
  
  // Homepage
  urls.push(`
    <url>
      <loc>${siteUrl}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
  `);
  
  // Posts index page
  urls.push(`
    <url>
      <loc>${siteUrl}/posts/</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>
  `);

  // Projects index page (only if projects are enabled)
  if (siteConfig.optionalContentTypes.projects) {
    urls.push(`
      <url>
        <loc>${siteUrl}/projects/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
      </url>
    `);
  }

  // Documentation index page (only if docs are enabled)
  if (siteConfig.optionalContentTypes.docs) {
    urls.push(`
      <url>
        <loc>${siteUrl}/docs/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
      </url>
    `);
  }
  
  // Individual posts
  posts.forEach((post: any) => {
    urls.push(`
      <url>
        <loc>${siteUrl}post/${post.slug}/</loc>
        <lastmod>${new Date(post.publishedAt).toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
      </url>
    `);
  });
  
  // Individual pages
  visiblePages.forEach((page: any) => {
    urls.push(`
      <url>
        <loc>${siteUrl}${page.slug}/</loc>
        <lastmod>${page.lastModified ? new Date(page.lastModified).toISOString() : new Date().toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
      </url>
    `);
  });

  // Individual projects
  projects.forEach((project: any) => {
    urls.push(`
      <url>
        <loc>${siteUrl}project/${project.slug}/</loc>
        <lastmod>${new Date(project.date).toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
      </url>
    `);
  });

  // Individual documentation pages
  docs.forEach((doc: any) => {
    const lastmod = doc.lastModified ? new Date(doc.lastModified) : new Date();
    urls.push(`
      <url>
        <loc>${siteUrl}doc/${doc.slug}/</loc>
        <lastmod>${lastmod.toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
      </url>
    `);
  });
  
  // Posts pagination pages
  const postsPerPage = siteConfig.postOptions.postsPerPage;
  const totalPages = Math.ceil(posts.length / postsPerPage);
  
  for (let page = 2; page <= totalPages; page++) {
    urls.push(`
      <url>
        <loc>${siteUrl}posts/page/${page}/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.5</priority>
      </url>
    `);
  }
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${urls.join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
};
