# Quick Start: Strapi Setup for Astro Modular

This is a condensed setup guide. See `README.md` for full documentation.

## 1. Install schemas in your Strapi project

```bash
# From this repo root
cp -r strapi/src/components/* /path/to/your-strapi/src/components/
cp -r strapi/src/content-types/* /path/to/your-strapi/src/content-types/
```

## 2. Restart Strapi

```bash
cd /path/to/your-strapi
npm run develop
```

Strapi will auto-detect and create database tables.

## 3. Configure permissions

**Settings → Users & Permissions → Roles → Public:**

Enable these endpoints:

- **Collections:** Post, Page, Project, Doc, Tag, Project-category, Doc-category
  - ✓ `find`
  - ✓ `findOne`
- **Single types:** Home-page, Not-found-page, Posts-index-page, Projects-index-page, Docs-index-page
  - ✓ `find`

## 4. Create content

**Order matters:**

1. Create taxonomies first:

   - Tags (for posts)
   - Project-categories (for projects)
   - Doc-categories (for docs)

2. Create content:
   - Write Markdown in `content` field
   - Keep Obsidian syntax (wikilinks, callouts, math, mermaid)
   - Upload images to Media Library
   - Set cover image + alt text
   - Assign tags/categories
   - Click "Publish"

## 5. Test API

```bash
# Get all published posts
curl "https://your-strapi.com/api/posts?populate=*&filters[publishedAt][\$notNull]=true"

# Get single post by slug
curl "https://your-strapi.com/api/posts?filters[slug][\$eq]=my-post&populate=*"

# Get homepage
curl "https://your-strapi.com/api/home-page?populate=*"
```

## 6. Update your .env

```bash
STRAPI_URL=https://your-strapi.com
STRAPI_TOKEN=your-optional-token
```

## Content tips

**Markdown storage:**

- Store all content in `content` text field (not Rich Text)
- Keeps Obsidian syntax working: `[[wikilinks]]`, `> [!note]`, `$math$`, etc.

**Slugs:**

- Auto-generated from title
- Editable if you want custom URLs

**Aliases:**

- When you rename content, add old slug to `aliases[]`
- Build scripts generate redirects automatically

**Images:**

- Upload via Media Library
- Always set alt text in `coverImageAlt` field
- URLs are absolute (no relative paths needed)

**Status (Projects):**

- Free text: "in-progress", "completed", or custom values like "On Hold"

## Next: Extend Astro integration

See main README for:

- Fetching Pages, Projects, Docs from Strapi
- Building graph data from Strapi posts
- Homepage integration (featured posts/projects/docs)
- RSS/Atom feed updates
- Redirect generation from aliases
