# Content Schema

This document describes the content types, fields, relations, and API usage for this Strapi project.

- Strapi: v5 (collection + single types with draft/publish)
- i18n: All content types are NOT localized
- Media: Upload plugin (default formats)
- Content format: Markdown (stored as text)

## Content Architecture

This is a comprehensive portfolio/blog/documentation site with:

- **Posts**: Blog articles with tags
- **Docs**: Documentation pages with categories and ordering
- **Projects**: Portfolio items with categories and demo links
- **Pages**: Static pages (e.g., About, Contact)
- **Single-type pages**: Home, Posts Index, Docs Index, Projects Index, Not Found
- **Shared components**: Alias component for URL redirects

## Content Types

## Content Types

### Post (collection type)

- Draft & Publish: enabled
- i18n: NOT localized
- Collection name: `posts`
- Description: Blog posts (Markdown)

**Attributes**

- `title` (string, required)
- `slug` (uid, required, unique) - targetField: `title`
- `description` (text) - Post summary/excerpt
- `content` (text) - Markdown content
- `date` (datetime) - Publication date
- `coverImage` (media, images only, single)
- `coverImageAlt` (string) - Alt text for cover image
- `imageOG` (boolean, default: false) - Use as Open Graph image
- `hideCoverImage` (boolean, default: false)
- `hideTOC` (boolean, default: false) - Hide table of contents
- `targetKeyword` (string) - SEO target keyword
- `tags` (relation, manyToMany) → `api::tag.tag`
- `aliases` (component, repeatable) - Old URL slugs for redirects

**System fields**: `id`, `createdAt`, `updatedAt`, `publishedAt`

### Tag (collection type)

- Draft & Publish: disabled
- Collection name: `tags`

**Attributes**

- `name` (string, required, unique)
- `slug` (uid, required, unique) - targetField: `name`
- `posts` (relation, manyToMany) → `api::post.post` (mappedBy: tags)

**System fields**: `id`, `createdAt`, `updatedAt`

### Doc (collection type)

- Draft & Publish: enabled
- i18n: NOT localized
- Collection name: `docs`
- Description: Documentation pages (Markdown)

**Attributes**

- `title` (string, required)
- `slug` (uid, required, unique) - targetField: `title`
- `description` (text)
- `content` (text) - Markdown content
- `category` (relation, manyToOne) → `api::doc-category.doc-category`
- `order` (integer, required) - Display order within category
- `lastModified` (date)
- `version` (string) - Version number/tag
- `coverImage` (media, images only, single)
- `coverImageAlt` (string)
- `hideCoverImage` (boolean, default: false)
- `hideTOC` (boolean, default: false)
- `showTOC` (boolean, default: true)
- `featured` (boolean, default: false)
- `noIndex` (boolean, default: false) - SEO: prevent indexing
- `aliases` (component, repeatable)

**System fields**: `id`, `createdAt`, `updatedAt`, `publishedAt`

### Doc Category (collection type)

- Draft & Publish: disabled
- Collection name: `doc_categories`

**Attributes**

- `name` (string, required, unique)
- `slug` (uid, required, unique) - targetField: `name`
- `docs` (relation, oneToMany) → `api::doc.doc` (mappedBy: category)

**System fields**: `id`, `createdAt`, `updatedAt`

### Project (collection type)

- Draft & Publish: enabled
- i18n: NOT localized
- Collection name: `projects`
- Description: Projects / Portfolio items

**Attributes**

- `title` (string, required)
- `slug` (uid, required, unique) - targetField: `title`
- `description` (text)
- `content` (text) - Markdown content
- `date` (datetime) - Project date
- `categories` (relation, manyToMany) → `api::project-category.project-category`
- `repositoryUrl` (string) - GitHub/Git repository URL
- `demoUrl` (string) - Live demo URL
- `status` (string) - e.g., "In Progress", "Completed", "Archived"
- `coverImage` (media, images only, single)
- `coverImageAlt` (string)
- `hideCoverImage` (boolean, default: false)
- `hideTOC` (boolean, default: false)
- `featured` (boolean, default: false)
- `aliases` (component, repeatable)

**System fields**: `id`, `createdAt`, `updatedAt`, `publishedAt`

### Project Category (collection type)

- Draft & Publish: disabled
- Collection name: `project_categories`

**Attributes**

- `name` (string, required, unique)
- `slug` (uid, required, unique) - targetField: `name`
- `projects` (relation, manyToMany) → `api::project.project` (mappedBy: categories)

**System fields**: `id`, `createdAt`, `updatedAt`

### Page (collection type)

- Draft & Publish: enabled
- i18n: NOT localized
- Collection name: `pages`
- Description: Static pages (Markdown)

**Attributes**

- `title` (string, required)
- `slug` (uid, required, unique) - targetField: `title`
- `description` (text)
- `content` (text) - Markdown content
- `lastModified` (date)
- `coverImage` (media, images only, single)
- `coverImageAlt` (string)
- `hideCoverImage` (boolean, default: false)
- `hideTOC` (boolean, default: false)
- `noIndex` (boolean, default: false)
- `aliases` (component, repeatable)

**System fields**: `id`, `createdAt`, `updatedAt`, `publishedAt`

### Home Page (single type)

- Draft & Publish: enabled
- Collection name: `home_pages`

**Attributes**

- `title` (string)
- `description` (text)
- `content` (text) - Markdown content

**System fields**: `id`, `createdAt`, `updatedAt`, `publishedAt`

### Posts Index Page (single type)

- Draft & Publish: enabled
- Collection name: `posts_index_pages`

**Attributes**

- `title` (string)
- `description` (text)

**System fields**: `id`, `createdAt`, `updatedAt`, `publishedAt`

### Docs Index Page (single type)

- Draft & Publish: enabled
- Collection name: `docs_index_pages`

**Attributes**

- `title` (string)
- `description` (text)

**System fields**: `id`, `createdAt`, `updatedAt`, `publishedAt`

### Projects Index Page (single type)

- Draft & Publish: enabled
- Collection name: `projects_index_pages`

**Attributes**

- `title` (string)
- `description` (text)

**System fields**: `id`, `createdAt`, `updatedAt`, `publishedAt`

### Not Found Page (single type)

- Draft & Publish: enabled
- Collection name: `not_found_pages`

**Attributes**

- `title` (string)
- `description` (text)

**System fields**: `id`, `createdAt`, `updatedAt`, `publishedAt`

## Shared Components

### Alias (shared.alias)

- Collection name: `components_shared_aliases`
- Description: Old URL slugs for redirects

**Attributes**

- `value` (string, required) - The old URL slug/path

## Relations Overview

- **Post ⇄ Tag**: many-to-many

  - On Post: `tags` (inversedBy: posts)
  - On Tag: `posts` (mappedBy: tags)

- **Doc → Doc Category**: many-to-one

  - On Doc: `category` (inversedBy: docs)
  - On Doc Category: `docs` (mappedBy: category)

- **Project ⇄ Project Category**: many-to-many
  - On Project: `categories` (inversedBy: projects)
  - On Project Category: `projects` (mappedBy: categories)

## REST API Usage

Base path: `/api`

### Common query params

- `populate` — include relations/media (e.g., `populate=coverImage,tags`)
- `filters` — filter by field (supports operators like `$eq`, `$contains`, `$gt`, etc.)
- `sort` — e.g., `date:desc`, `order:asc`
- `pagination[page]`, `pagination[pageSize]`

### Collection Type Endpoints

**Posts**

- List all published posts (latest first)
  - `GET /api/posts?populate=coverImage,tags&sort=date:desc&pagination[pageSize]=10`
- Get post by slug
  - `GET /api/posts?filters[slug][$eq]=my-post-slug&populate=coverImage,tags`
- Filter posts by tag
  - `GET /api/posts?filters[tags][slug][$eq]=javascript&populate=coverImage,tags`
- Featured posts only
  - Note: Post doesn't have featured flag, use tags or date filters

**Tags**

- List all tags
  - `GET /api/tags`
- Get tag by slug with posts
  - `GET /api/tags?filters[slug][$eq]=javascript&populate=posts`

**Docs**

- List all published docs by category (ordered)
  - `GET /api/docs?populate=category,coverImage&sort=order:asc`
- Get docs by category slug
  - `GET /api/docs?filters[category][slug][$eq]=getting-started&populate=coverImage&sort=order:asc`
- Get doc by slug
  - `GET /api/docs?filters[slug][$eq]=installation&populate=category,coverImage`
- Featured docs only
  - `GET /api/docs?filters[featured][$eq]=true&populate=coverImage`

**Doc Categories**

- List all doc categories
  - `GET /api/doc-categories`
- Get category by slug with docs
  - `GET /api/doc-categories?filters[slug][$eq]=getting-started&populate=docs`

**Projects**

- List all published projects (latest first)
  - `GET /api/projects?populate=coverImage,categories&sort=date:desc`
- Get project by slug
  - `GET /api/projects?filters[slug][$eq]=my-project&populate=coverImage,categories`
- Filter by category
  - `GET /api/projects?filters[categories][slug][$eq]=web-app&populate=coverImage,categories`
- Featured projects only
  - `GET /api/projects?filters[featured][$eq]=true&populate=coverImage,categories`
- Filter by status
  - `GET /api/projects?filters[status][$eq]=Completed&populate=coverImage,categories`

**Project Categories**

- List all project categories
  - `GET /api/project-categories`
- Get category by slug with projects
  - `GET /api/project-categories?filters[slug][$eq]=web-app&populate=projects`

**Pages**

- List all published pages
  - `GET /api/pages?populate=coverImage`
- Get page by slug
  - `GET /api/pages?filters[slug][$eq]=about&populate=coverImage`

### Single Type Endpoints

Single types use different endpoints (no ID, singular):

- **Home Page**: `GET /api/home-page`
- **Posts Index Page**: `GET /api/posts-index-page`
- **Docs Index Page**: `GET /api/docs-index-page`
- **Projects Index Page**: `GET /api/projects-index-page`
- **Not Found Page**: `GET /api/not-found-page`

### Advanced Queries

**Deep populate for nested relations**

```
GET /api/posts?populate[tags][populate]=*&populate[coverImage][populate]=*
```

**Multiple sorts**

```
GET /api/docs?sort[0]=order:asc&sort[1]=date:desc
```

**Complex filters (AND/OR)**

```
GET /api/projects?filters[$and][0][featured][$eq]=true&filters[$and][1][status][$eq]=Completed
```

### Response Shape (Collection Example)

```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "title": "Getting Started with Strapi",
        "slug": "getting-started",
        "description": "Learn the basics...",
        "content": "# Getting Started\n\n...",
        "date": "2025-11-01T10:00:00.000Z",
        "publishedAt": "2025-11-01T10:00:00.000Z",
        "createdAt": "2025-11-01T08:00:00.000Z",
        "updatedAt": "2025-11-01T09:00:00.000Z",
        "hideCoverImage": false,
        "hideTOC": false,
        "coverImage": {
          "data": {
            "id": 12,
            "attributes": {
              "url": "/uploads/cover.jpg",
              "alternativeText": "Cover image",
              "formats": {
                "thumbnail": { "url": "/uploads/thumbnail_cover.jpg" },
                "small": { "url": "/uploads/small_cover.jpg" },
                "medium": { "url": "/uploads/medium_cover.jpg" }
              }
            }
          }
        },
        "tags": {
          "data": [
            {
              "id": 2,
              "attributes": { "name": "JavaScript", "slug": "javascript" }
            }
          ]
        }
      }
    }
  ],
  "meta": {
    "pagination": { "page": 1, "pageSize": 10, "pageCount": 1, "total": 1 }
  }
}
```

### Response Shape (Single Type Example)

```json
{
  "data": {
    "id": 1,
    "attributes": {
      "title": "Welcome to My Portfolio",
      "description": "I'm a full-stack developer...",
      "content": "# Hello World\n\n...",
      "publishedAt": "2025-11-01T10:00:00.000Z",
      "createdAt": "2025-11-01T08:00:00.000Z",
      "updatedAt": "2025-11-01T09:00:00.000Z"
    }
  },
  "meta": {}
}
```

## Notes

- **Public API access**: Enable permissions in Strapi Admin → Settings → Users & Permissions → Roles → Public for each content type.
- **Content format**: All content fields use plain text/Markdown (not rich text). Your frontend should render Markdown to HTML.
- **Media URLs**: If using Cloudflare R2, URLs will be from your configured CDN. Local uploads are at `/uploads/`.
- **Slugs**: All UIDs are unique and auto-generated from title/name fields.
- **Draft & Publish**: Collection types (Post, Doc, Project, Page) and single types support draft/publish workflow.
- **Ordering**: Use the `order` field in Docs to control display sequence within categories.
- **Aliases**: Use the repeatable alias component to store old URL slugs for 301 redirects (implement redirect logic in your frontend).
- **SEO**: Use `noIndex` on Docs/Pages to prevent search engine indexing. `targetKeyword` on Posts for SEO focus.

## TypeScript Types

Auto-generated TypeScript types are available under `types/generated/`.

- `contentTypes.d.ts` includes shapes for all content types
- `components.d.ts` includes component types (e.g., `shared.alias`)

## Migration Notes

**Breaking changes from old schema:**

- Post is now NOT localized (removed i18n)
- Post uses `tags` instead of `categories` (many-to-many with Tag)
- Post `content` is now plain text (Markdown) instead of rich text
- Post `coverImage` replaces `banner`
- Old `Category` content type is removed - replaced with Tag for posts
- Added new content types: Doc, Project, Page, and single-type pages
- Added shared component: Alias

**Migration steps:**

1. Export existing post data if needed
2. Restart Strapi to register new schemas
3. Strapi will auto-migrate database tables
4. TypeScript types will regenerate on next build
5. Update API permissions for Public role
6. Recreate content with new structure
