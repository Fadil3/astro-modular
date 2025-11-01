#!/usr/bin/env node

/**
 * Graph Data Generation Script (Strapi Version)
 * 
 * This script generates graph data for the local graph feature by analyzing
 * post connections (both wikilinks and standard links) from Strapi CMS.
 * 
 * The generated data includes:
 * - Post nodes with metadata (title, slug, date, tags)
 * - Connections between posts (direct links)
 * 
 * This data is used by the LocalGraph component to render an Obsidian-like graph view.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const OUTPUT_DIR = join(projectRoot, 'public', 'graph');
const OUTPUT_FILE = join(OUTPUT_DIR, 'graph-data.json');

// Get Strapi configuration from environment
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

/**
 * Read maxNodes from config file
 */
function getMaxNodesFromConfig() {
  try {
    const configPath = join(projectRoot, 'src', 'config.ts');
    const configContent = readFileSync(configPath, 'utf-8');
    
    // Extract maxNodes value from config
    const maxNodesMatch = configContent.match(/maxNodes:\s*(\d+)/);
    if (maxNodesMatch) {
      return parseInt(maxNodesMatch[1], 10);
    }
    
    // Default fallback
    return 100;
  } catch (error) {
    log.warn('Could not read config file, using default maxNodes: 100');
    return 100;
  }
}


// Simple logging utility
const isDev = process.env.NODE_ENV !== 'production';
const log = {
  info: (...args) => isDev && console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args)
};

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Fetch all posts from Strapi
 */
async function fetchAllPosts() {
  try {
    const url = new URL(`${STRAPI_URL}/api/posts`);
    url.searchParams.set('populate', '*');
    url.searchParams.set('pagination[pageSize]', '1000');
    url.searchParams.set('sort', 'publishedAt:desc');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_TOKEN}`;
    }
    
    const response = await fetch(url.toString(), { headers });
    
    if (!response.ok) {
      throw new Error(`Strapi request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    log.error('Error fetching posts from Strapi:', error.message);
    throw error;
  }
}

/**
 * Extract wikilinks from content (Obsidian-style)
 */
function extractWikilinks(content) {
  const matches = [];
  const wikilinkRegex = /!?\[\[([^\]]+)\]\]/g;
  let match;

  while ((match = wikilinkRegex.exec(content)) !== null) {
    const [fullMatch, linkContent] = match;
    const isImageWikilink = fullMatch.startsWith('!');

    // Skip image wikilinks, only process link wikilinks
    if (!isImageWikilink) {
      const [link, displayText] = linkContent.includes('|')
        ? linkContent.split('|', 2)
        : [linkContent, linkContent];

      // Parse anchor if present
      const anchorIndex = link.indexOf('#');
      const baseLink = anchorIndex === -1 ? link : link.substring(0, anchorIndex);

      // Generate target ID from the link
      const targetId = generateNodeId(baseLink, 'posts');

      matches.push({
        link: baseLink,
        display: displayText.trim(),
        slug: targetId
      });
    }
  }

  return matches;
}

/**
 * Extract standard markdown links from content
 */
function extractStandardLinks(content) {
  const matches = [];
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const [fullMatch, displayText, url] = match;

    // Check if this is an internal link
    if (isInternalLink(url)) {
      const { linkText } = extractLinkTextFromUrl(url);
      if (linkText) {
        // Only include posts in graph data - this includes:
        // - posts/ prefixed links
        // - /posts/ relative links  
        // - .md files (assumed to be posts)
        // - Simple slugs (assumed to be posts for backward compatibility)
        const isPostLink = linkText.startsWith('posts/') || 
                          url.startsWith('/posts/') || 
                          url.startsWith('posts/') ||
                          url.endsWith('.md') ||
                          (!linkText.includes('/') && !url.startsWith('/'));
        
        if (isPostLink) {
          // Generate target ID from the link
          const targetId = generateNodeId(linkText, 'posts');

          matches.push({
            link: linkText,
            display: displayText.trim(),
            slug: targetId
          });
        }
      }
    }
  }

  return matches;
}

/**
 * Check if a URL is an internal link
 */
function isInternalLink(url) {
  url = url.trim();

  // Skip external URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return false;
  }

  // Skip email links
  if (url.startsWith('mailto:')) {
    return false;
  }

  // Skip anchors only
  if (url.startsWith('#')) {
    return false;
  }

  // Check if it's an internal link:
  // - Ends with .md (markdown files)
  // - Starts with /posts/ or posts/ (post relative URLs)
  // - Is just a slug (no slashes) - assumes posts for backward compatibility
  const isInternal = url.endsWith('.md') || 
    url.startsWith('/posts/') || url.startsWith('posts/') ||
    !url.includes('/');
  
  return isInternal;
}

/**
 * Extract link text from URL
 */
function extractLinkTextFromUrl(url) {
  url = url.trim();
  
  // Parse anchor if present
  const anchorIndex = url.indexOf('#');
  const link = anchorIndex === -1 ? url : url.substring(0, anchorIndex);
  const anchor = anchorIndex === -1 ? null : url.substring(anchorIndex + 1);

  // Handle posts/ prefixed links
  if (link.startsWith('posts/') || link.startsWith('/posts/') || link.startsWith('post/') || link.startsWith('/post/')) {
    let linkText = link.replace(/^(\/?)posts?(\/)?/, '').replace(/\.md$/, '');
    // Remove /index for folder-based posts
    if (linkText.endsWith('/index') && linkText.split('/').length === 2) {
      linkText = linkText.replace('/index', '');
    }
    return {
      linkText: linkText,
      anchor: anchor
    };
  }
  
  // Handle .md files
  if (link.endsWith('.md')) {
    let linkText = link.replace(/\.md$/, '');
    // Remove /index for folder-based posts
    if (linkText.endsWith('/index') && linkText.split('/').length === 1) {
      linkText = linkText.replace('/index', '');
    }
    return {
      linkText: linkText,
      anchor: anchor
    };
  }

  // If it's just a slug (no slashes), use it directly
  if (!link.includes('/')) {
    return {
      linkText: link,
      anchor: anchor
    };
  }

  return { linkText: null, anchor: null };
}

/**
 * Generate graph data from Strapi posts
 */
async function generateGraphData() {
  log.info('🔍 Analyzing post connections from Strapi...');

  try {
    // Get configuration values
    const maxNodes = getMaxNodesFromConfig();
    
    // Fetch all posts from Strapi
    log.info(`📡 Fetching posts from Strapi: ${STRAPI_URL}`);
    const strapiPosts = await fetchAllPosts();
    log.info(`📄 Found ${strapiPosts.length} posts`);

    // Generate nodes and connections
    const nodes = [];
    const connections = [];

    // Process each post
    for (const strapiPost of strapiPosts) {
      // Get post attributes (Strapi v5 flattened structure)
      const post = strapiPost.attributes || strapiPost;
      const slug = post.slug;
      const content = post.content || '';
      
      // Skip posts without publishedAt (drafts)
      if (!post.publishedAt) continue;

      // Add post node
      const postNode = {
        id: slug,
        type: 'post',
        title: post.title,
        slug: slug,
        date: post.publishedAt || post.createdAt,
        connections: 0
      };
      nodes.push(postNode);

      // Extract links from post content
      const wikilinks = extractWikilinks(content);
      const standardLinks = extractStandardLinks(content);
      const allLinks = [...wikilinks, ...standardLinks];

      // Process links to other posts
      for (const link of allLinks) {
        const targetPost = nodes.find(n => n.slug === link.slug);
        if (targetPost && targetPost.slug !== slug) {
          // Check if connection already exists
          const connectionExists = connections.some(
            conn => conn.source === slug && conn.target === link.slug
          );
          
          if (!connectionExists) {
            // Add post-to-post connection
            connections.push({
              source: slug,
              target: link.slug,
              type: 'link'
            });
            
            // Update connection counts
            postNode.connections++;
            targetPost.connections++;
          }
        }
      }
    }


    // Apply maxNodes filtering if configured
    let filteredNodes = nodes;
    let filteredConnections = connections;

    if (maxNodes && nodes.length > maxNodes) {
      // Sort posts by connection count (descending), then by date (descending)
      const sortedPosts = nodes.sort((a, b) => {
        if (b.connections !== a.connections) {
          return b.connections - a.connections;
        }
        return new Date(b.date) - new Date(a.date);
      });
      
      filteredNodes = sortedPosts.slice(0, maxNodes);
      
      // Filter connections to only include those between selected nodes
      const selectedNodeIds = new Set(filteredNodes.map(n => n.id));
      filteredConnections = connections.filter(conn => 
        selectedNodeIds.has(conn.source) && selectedNodeIds.has(conn.target)
      );
    }

    // Generate graph data
    const graphData = {
      nodes: filteredNodes,
      connections: filteredConnections,
      metadata: {
        generated: new Date().toISOString(),
        totalPosts: filteredNodes.length,
        totalConnections: filteredConnections.length,
        maxNodesApplied: maxNodes && nodes.length > maxNodes,
        originalNodeCount: nodes.length
      }
    };

    // Write graph data to file
    writeFileSync(OUTPUT_FILE, JSON.stringify(graphData, null, 2));
    
    log.info('✅ Graph data generated successfully!');
    if (graphData.metadata.maxNodesApplied) {
      log.info(`📊 Stats: ${graphData.metadata.totalPosts} posts, ${graphData.metadata.totalConnections} connections (filtered from ${graphData.metadata.originalNodeCount} total nodes)`);
    } else {
      log.info(`📊 Stats: ${graphData.metadata.totalPosts} posts, ${graphData.metadata.totalConnections} connections`);
    }
    log.info(`💾 Saved to: ${OUTPUT_FILE}`);

  } catch (error) {
    log.error('❌ Error generating graph data:', error);
    process.exit(1);
  }
}

// Run the script
generateGraphData();