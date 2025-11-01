# Strapi Content Types & Components

This folder contains Strapi v5-compatible JSON schemas for all content types and components needed to replace Obsidian-powered features in the Astro Modular theme.

## Installation

1. **Copy to your Strapi project:**

   ```bash
   cp -r strapi/src/components/* <your-strapi-project>/src/components/
   cp -r strapi/src/content-types/* <your-strapi-project>/src/content-types/
   ```

2. **Restart Strapi:**

   ```bash
   cd <your-strapi-project>
   npm run develop
   # or
   yarn develop
   ```

   Strapi will auto-detect the schemas and create the database tables.

3. **Configure permissions:**
   - Go to Settings → Users & Permissions → Roles → Public
   - Enable `find` and `findOne` for: Post, Page, Project, Doc, Tag, Project-category, Doc-category
   - Enable `find` for single types: Home-page, Not-found-page, Posts-index-page, Projects-index-page, Docs-index-page

## Schema Overview

### Collections (with draft/publish)

- **Post** (`api::post.post`)

  - `title`, `slug` (UID), `description`, `content` (Markdown)
  - `date`, `coverImage`, `coverImageAlt`, `imageOG`, `hideCoverImage`, `hideTOC`, `targetKeyword`
  - Relations: `tags` (many-to-many)
  - Components: `aliases[]` (repeatable)

- **Page** (`api::page.page`)

  - `title`, `slug` (UID), `description`, `content` (Markdown)
  - `lastModified`, `coverImage`, `coverImageAlt`, `hideCoverImage`, `hideTOC`, `noIndex`
  - Components: `aliases[]`

- **Project** (`api::project.project`)

  - `title`, `slug` (UID), `description`, `content` (Markdown)
  - `date`, `repositoryUrl`, `demoUrl`, `status` (string)
  - `coverImage`, `coverImageAlt`, `hideCoverImage`, `hideTOC`, `featured`
  - Relations: `categories` (many-to-many)
  - Components: `aliases[]`

- **Doc** (`api::doc.doc`)
  - `title`, `slug` (UID), `description`, `content` (Markdown)
  - `order` (integer), `lastModified`, `version`
  - `coverImage`, `coverImageAlt`, `hideCoverImage`, `hideTOC`, `showTOC`, `featured`, `noIndex`
  - Relations: `category` (many-to-one)
  - Components: `aliases[]`

### Taxonomies (no draft/publish)

- **Tag** (`api::tag.tag`)

  - `name`, `slug` (UID)
  - Relations: `posts` (many-to-many)

- **Project-category** (`api::project-category.project-category`)

  - `name`, `slug` (UID)
  - Relations: `projects` (many-to-many)

- **Doc-category** (`api::doc-category.doc-category`)
  - `name`, `slug` (UID)
  - Relations: `docs` (one-to-many)

### Single Types (special pages)

- **Home-page** (`api::home-page.home-page`)

  - `title`, `description`, `content` (Markdown)

- **Not-found-page** (`api::not-found-page.not-found-page`)

  - `title`, `description`, `content` (Markdown)

- **Posts-index-page** (`api::posts-index-page.posts-index-page`)

  - `title`, `description` (meta only)

- **Projects-index-page** (`api::projects-index-page.projects-index-page`)

  - `title`, `description`, `content` (Markdown)

- **Docs-index-page** (`api::docs-index-page.docs-index-page`)
  - `title`, `description`, `content` (Markdown)

### Components

- **shared.alias** (`shared.alias`)
  - `value` (string) - stores old slugs for redirect generation

## Content Strategy

### Markdown in `content` field

Store all Markdown in the `content` text field (not Rich Text). This preserves:

- **KaTeX math** (`$...$` and `$$...$$`)
- **Mermaid diagrams** (```mermaid code blocks)
- **Obsidian callouts** (`> [!note]`, `> [!tip]`, etc.)
- **Wikilinks** (`[[Post Title]]` - for posts only)
- **Image embeds** (`![[image.jpg]]`)
- **Video/Audio embeds** (`![[video.mp4]]`, `![[audio.mp3]]`)

The Astro remark/rehype pipeline processes these automatically.

### Slugs and aliases

- `slug` is a UID field (auto-generated from title, editable)
- `aliases[]` stores old slugs when you rename content
- Build scripts read aliases to generate redirects (Netlify/Vercel/GitHub Pages)

### Draft/publish workflow

- Use Strapi's native `publishedAt` field (enabled via `draftAndPublish: true`)
- Unpublished entries won't appear in public API queries (`filters[publishedAt][$notNull]=true`)

### Images

- Upload images via Strapi's Media Library
- `coverImage` is a single media field
- `coverImageAlt` stores alt text next to each image
- Astro fetches absolute URLs from Strapi and uses them directly

### Tags vs Categories

- **Posts** use `tags` (many-to-many)
- **Projects** use `categories` (many-to-many with project-category)
- **Docs** use `category` (many-to-one with doc-category)

### Status field (Projects)

- Free text string; recognized values: "in-progress", "completed"
- Custom values (e.g., "On Hold") are supported and display neutrally

## i18n (optional)

If you need localized content:

1. Enable i18n plugin in Strapi admin
2. Set `"i18n": { "localized": true }` in content types
3. Make `slug` unique per locale (Strapi handles this)
4. Pass `locale` param in Astro fetches

## API Usage Examples

### Fetch all published posts with tags

```javascript
const res = await fetch(
  "https://your-strapi.com/api/posts?populate=*&filters[publishedAt][$notNull]=true&sort=date:desc"
);
const data = await res.json();
```

### Fetch single post by slug

```javascript
const res = await fetch(
  "https://your-strapi.com/api/posts?filters[slug][$eq]=my-post&populate=*"
);
const data = await res.json();
const post = data.data[0];
```

### Fetch projects with categories

```javascript
const res = await fetch(
  "https://your-strapi.com/api/projects?populate=*&filters[publishedAt][$notNull]=true&sort=date:desc"
);
const data = await res.json();
```

### Fetch docs by category

```javascript
const res = await fetch(
  "https://your-strapi.com/api/docs?populate=*&filters[category][slug][$eq]=setup&sort=order:asc"
);
const data = await res.json();
```

### Fetch homepage blurb

```javascript
const res = await fetch("https://your-strapi.com/api/home-page?populate=*");
const data = await res.json();
const homeContent = data.data.content; // Markdown
```

## Next Steps

1. **Create content:**

   - Add Tags, Project-categories, Doc-categories first
   - Create Posts, Pages, Projects, Docs
   - Upload cover images and set alt text
   - Write Markdown in `content` field with Obsidian syntax

2. **Update Astro integration:**

   - Extend `src/utils/strapi.ts` to fetch Pages, Projects, Docs
   - Create layouts similar to `StrapiPostLayout.astro` for other types
   - Build routes for `/pages/:slug`, `/projects/:slug`, `/docs/:slug`
   - Fetch special pages for homepage/404/indexes

3. **Build scripts:**

   - Adapt `scripts/generate-graph-data.js` to fetch posts from Strapi and parse wikilinks
   - Create redirect generation script that reads aliases from all Strapi collections
   - Update RSS/Atom feeds to fetch from Strapi

4. **Homepage integration:**

   - Fetch featured posts, projects, docs from Strapi
   - Fetch home-page single type for blurb content
   - Apply Markdown processing to blurb

5. **Test thoroughly:**
   - Verify KaTeX math renders
   - Check Mermaid diagrams
   - Test callouts display correctly
   - Confirm wikilinks resolve between posts
   - Validate graph view with Strapi content

## Migration Tips

### From Obsidian to Strapi

1. Export your Obsidian notes as Markdown
2. For each note:
   - Extract frontmatter (title, date, tags, etc.)
   - Keep body as-is (Markdown with all Obsidian syntax)
   - Upload images to Strapi Media Library
   - Create entry in appropriate collection
   - Paste Markdown body into `content` field
3. Update image paths if needed (Obsidian relative → Strapi absolute URLs)

### URL preservation

- Old Obsidian filename (without `.md`) → `slug` field
- If you rename: add old slug to `aliases[]` array
- Build script reads aliases and generates redirects

## Troubleshooting

**Relations not appearing:**

- Make sure to use `populate=*` in API calls
- Check permissions (Public role needs `find` access)

**Images not loading:**

- Verify Media Library upload was successful
- Check that image URLs are absolute (start with `http://` or `https://`)
- Ensure Public role has access to Upload plugin

**Draft content showing:**

- Filter published content: `filters[publishedAt][$notNull]=true`
- Or check "Published" checkbox in Strapi admin

**Markdown not rendering:**

- Ensure `content` is stored as plain text, not Rich Text
- Verify Astro remark/rehype plugins are active
- Check console for processing errors

## Support

For Strapi-specific questions: https://strapi.io/documentation
For Astro Modular integration: See main theme documentation
