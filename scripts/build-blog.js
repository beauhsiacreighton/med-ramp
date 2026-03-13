#!/usr/bin/env node

/**
 * Blog Build Script
 * Converts markdown files to individual HTML pages
 * Generates blog listing JSON
 * Updates sitemap
 */

const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Configuration
const CONFIG = {
  postsDir: path.join(__dirname, '../blog-posts'),
  outputDir: path.join(__dirname, '../blog'),
  templatePath: path.join(__dirname, '../blog-post-template.html'),
  sitemapPath: path.join(__dirname, '../sitemap.xml'),
  postsJsonPath: path.join(__dirname, '../blog-posts/posts.json'),
  siteUrl: 'https://med-ramp.com'
};

function getUrlSlug(id) {
  return `${id}1`;
}

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Parse frontmatter from markdown file
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    throw new Error('No frontmatter found');
  }
  
  const [, frontmatter, markdown] = match;
  const metadata = {};
  
  frontmatter.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;
    
    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();
    
    // Handle arrays (tags)
    if (value.startsWith('[')) {
      // This is a simple array parser - in production you'd want something more robust
      return; // Will be handled by multi-line parsing below
    }
    
    // Remove quotes
    value = value.replace(/^["']|["']$/g, '');
    
    metadata[key] = value;
  });
  
  // Handle multi-line arrays (tags)
  const tagsMatch = frontmatter.match(/tags:\s*\n((?:  - .+\n)+)/);
  if (tagsMatch) {
    metadata.tags = tagsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('- '))
      .map(line => line.trim().substring(2).trim());
  }
  
  return { metadata, markdown: markdown.trim() };
}

/**
 * Configure marked for better HTML output
 */
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false
});

/**
 * Custom renderer for callouts and special elements
 */
const renderer = new marked.Renderer();

// Override paragraph to handle custom divs
const originalParagraph = renderer.paragraph.bind(renderer);
renderer.paragraph = (text) => {
  // Handle callout boxes
  if (text.startsWith('<div class="callout')) {
    return text;
  }
  
  // Handle stats display
  if (text.startsWith('<div class="stats-display">')) {
    return text;
  }
  
  return originalParagraph(text);
};

// Override image to add proper structure
renderer.image = (href, title, text) => {
  let html = '<div class="content-image-wrapper">';
  html += `<img src="${href}" alt="${text}" class="content-image" loading="lazy" decoding="async">`;
  if (title) {
    html += `<p class="image-caption">${title}</p>`;
  }
  html += '</div>';
  return html;
};

/**
 * Convert markdown to HTML
 */
function convertMarkdownToHtml(markdown) {
  return normalizeContentHtml(marked.parse(markdown, { renderer }));
}

function normalizeContentHtml(contentHtml) {
  return String(contentHtml || '')
    .replace(
      /<p>\s*(<div class="content-image-wrapper">[\s\S]*?<\/div>)\s*<br>\s*<em>([\s\S]*?)<\/em>\s*<\/p>/g,
      '$1\n<p class="image-caption">$2</p>'
    )
    .replace(
      /<p>\s*(<div class="content-image-wrapper">[\s\S]*?<\/div>)\s*<\/p>/g,
      '$1'
    );
}

/**
 * Generate individual blog post HTML
 */
function generatePostHtml(metadata, contentHtml) {
  const template = fs.readFileSync(CONFIG.templatePath, 'utf-8');
  const urlSlug = getUrlSlug(metadata.id);
  const replaceToken = (content, token, value) => content.split(token).join(value);

  const tagsHtml = metadata.tags
    ? metadata.tags.map(tag => `<a class="post-tag" href="../blog1.html?search=${encodeURIComponent(tag)}">#${tag}</a>`).join('')
    : '';

  const featuredImageBlock = metadata.featuredImage
    ? `<img src="${metadata.featuredImage}" alt="${metadata.title}" class="post-featured-media" loading="eager" decoding="async">`
    : '';

  const authorInitials = metadata.author
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // SEO meta tags
  const metaTags = `
    <meta name="description" content="${metadata.excerpt}">
    <meta name="keywords" content="${metadata.tags ? metadata.tags.join(', ') : ''}">
    <meta name="author" content="${metadata.author}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${CONFIG.siteUrl}/blog/${urlSlug}.html">
    <meta property="og:title" content="${metadata.title}">
    <meta property="og:description" content="${metadata.excerpt}">
    <meta property="og:image" content="${metadata.featuredImage || CONFIG.siteUrl + '/images/Square logo.png'}">
    <meta property="article:published_time" content="${metadata.date}">
    <meta property="article:author" content="${metadata.author}">
    <meta property="article:section" content="${metadata.category}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${CONFIG.siteUrl}/blog/${urlSlug}.html">
    <meta property="twitter:title" content="${metadata.title}">
    <meta property="twitter:description" content="${metadata.excerpt}">
    <meta property="twitter:image" content="${metadata.featuredImage || CONFIG.siteUrl + '/images/Square logo.png'}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${CONFIG.siteUrl}/blog/${urlSlug}.html">
  `;

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": metadata.title,
    "description": metadata.excerpt,
    "image": metadata.featuredImage,
    "datePublished": metadata.date,
    "dateModified": metadata.date,
    "author": {
      "@type": "Person",
      "name": metadata.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Med-RAMP",
      "logo": {
        "@type": "ImageObject",
        "url": CONFIG.siteUrl + "/images/Square logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${CONFIG.siteUrl}/blog/${urlSlug}.html`
    }
  };

  // Replace placeholders
  let html = template;
  html = replaceToken(html, '{{META_TAGS}}', metaTags);
  html = replaceToken(html, '{{STRUCTURED_DATA}}', JSON.stringify(structuredData, null, 2));
  html = replaceToken(html, '{{PAGE_TITLE}}', `${metadata.title} - Med-RAMP Blog`);
  html = replaceToken(html, '{{FEATURED_IMAGE_BLOCK}}', featuredImageBlock);
  html = replaceToken(html, '{{CATEGORY}}', metadata.category);
  html = replaceToken(html, '{{DATE}}', formatDate(metadata.date));
  html = replaceToken(html, '{{READ_TIME}}', metadata.readTime);
  html = replaceToken(html, '{{TITLE}}', metadata.title);
  html = replaceToken(html, '{{EXCERPT}}', metadata.excerpt);
  html = replaceToken(html, '{{POST_ID}}', metadata.id);
  html = replaceToken(html, '{{AUTHOR_INITIALS}}', authorInitials);
  html = replaceToken(html, '{{AUTHOR}}', metadata.author);
  html = replaceToken(html, '{{AUTHOR_ROLE}}', metadata.authorRole);
  html = replaceToken(html, '{{CONTENT}}', contentHtml);
  html = replaceToken(html, '{{TAGS}}', tagsHtml);

  return html;
}

function buildPostRecord(metadata) {
  return {
    id: metadata.id,
    title: metadata.title,
    excerpt: metadata.excerpt,
    category: metadata.category,
    date: metadata.date,
    author: metadata.author,
    authorRole: metadata.authorRole,
    readTime: metadata.readTime,
    tags: metadata.tags || [],
    featured: metadata.featured === 'true' || metadata.featured === true,
    featuredImage: metadata.featuredImage,
    url: `/blog/${getUrlSlug(metadata.id)}.html`
  };
}

function extractMatch(content, regex, fallback = '') {
  const match = content.match(regex);
  return match ? match[1].trim() : fallback;
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLegacyHtmlPost(filePath) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const id = path.basename(filePath, '.html');
  const title = stripHtml(
    extractMatch(html, /<h1 class="post-title-main">([\s\S]*?)<\/h1>/) ||
    extractMatch(html, /<meta property="og:title" content="([^"]+)"/)
  );

  const excerpt = stripHtml(
    extractMatch(html, /<p class="post-excerpt-main">([\s\S]*?)<\/p>/) ||
    extractMatch(html, /<meta name="description" content="([^"]+)"/)
  );

  const category = stripHtml(extractMatch(html, /<span class="post-category-badge">([\s\S]*?)<\/span>/, 'General Advice'));
  const date = extractMatch(html, /<meta property="article:published_time" content="([^"]+)"/, new Date().toISOString().split('T')[0]);
  const author = stripHtml(
    extractMatch(html, /<meta name="author" content="([^"]+)"/) ||
    extractMatch(html, /<div class="author-info">\s*<strong>([\s\S]*?)<\/strong>/)
  );
  const authorRole = stripHtml(extractMatch(html, /<div class="author-info">[\s\S]*?<span>([\s\S]*?)<\/span>/, 'Mentor Team'));
  const readTime = stripHtml(extractMatch(html, /<span class="post-read-time">\s*•\s*([\s\S]*?)<\/span>/, '5 min read'));
  const featuredImage = extractMatch(
    html,
    /<img[^>]*class="post-featured-image"[^>]*src="([^"]+)"/,
    extractMatch(html, /<meta property="og:image" content="([^"]+)"/)
  );

  const tags = Array.from(html.matchAll(/<span class="tag">#?([^<]+)<\/span>/g)).map((match) => stripHtml(match[1]));
  const contentHtml = normalizeContentHtml(
    extractMatch(html, /<article class="post-content">([\s\S]*?)<div class="post-tags">/)
  );

  return {
    metadata: {
      id,
      title,
      excerpt,
      category,
      date,
      author,
      authorRole,
      readTime,
      tags,
      featured: false,
      featuredImage
    },
    contentHtml
  };
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Process all markdown files
 */
function processMarkdownFiles() {
  const files = fs.readdirSync(CONFIG.postsDir)
    .filter(file => file.endsWith('.md'));

  const posts = [];

  console.log(`\n📝 Processing ${files.length} markdown files...\n`);

  files.forEach(file => {
    const filePath = path.join(CONFIG.postsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      const { metadata, markdown } = parseFrontmatter(content);
      const contentHtml = convertMarkdownToHtml(markdown);
      const postHtml = generatePostHtml(metadata, contentHtml);

      // Write individual HTML file
      const outputPath = path.join(CONFIG.outputDir, `${getUrlSlug(metadata.id)}.html`);
      fs.writeFileSync(outputPath, postHtml);

      console.log(`✅ Generated: /blog/${getUrlSlug(metadata.id)}.html`);

      // Add to posts array for JSON
      posts.push(buildPostRecord(metadata));
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  });

  const markdownIds = new Set(posts.map(post => post.id));
  const legacyFiles = fs.readdirSync(CONFIG.outputDir)
    .filter(file => file.endsWith('.html'))
    .filter(file => !file.endsWith('1.html'))
    .filter(file => !markdownIds.has(path.basename(file, '.html')));

  if (legacyFiles.length) {
    console.log(`🧩 Processing ${legacyFiles.length} legacy HTML blog source(s)...\n`);
  }

  legacyFiles.forEach((file) => {
    const filePath = path.join(CONFIG.outputDir, file);

    try {
      const { metadata, contentHtml } = parseLegacyHtmlPost(filePath);
      const postHtml = generatePostHtml(metadata, contentHtml);
      const outputPath = path.join(CONFIG.outputDir, `${getUrlSlug(metadata.id)}.html`);

      fs.writeFileSync(outputPath, postHtml);
      posts.push(buildPostRecord(metadata));

      console.log(`✅ Generated from legacy source: /blog/${getUrlSlug(metadata.id)}.html`);
    } catch (error) {
      console.error(`❌ Error processing legacy post ${file}:`, error.message);
    }
  });

  return posts;
}

/**
 * Update posts.json for backward compatibility
 */
function updatePostsJson(posts) {
  // Sort by date (newest first)
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  fs.writeFileSync(
    CONFIG.postsJsonPath,
    JSON.stringify(posts, null, 2)
  );
  
  console.log(`\n✅ Updated posts.json with ${posts.length} posts`);
}

/**
 * Update sitemap.xml
 */
function updateSitemap(posts) {
  let sitemap = fs.readFileSync(CONFIG.sitemapPath, 'utf-8');
  
  // Remove existing blog post entries
  sitemap = sitemap.replace(
    /<url>\s*<loc>[^<]*\/blog\/[^<]*<\/loc>[\s\S]*?<\/url>\s*/g,
    ''
  );
  
  // Generate new blog post entries
  const blogEntries = posts.map(post => `
  <url>
    <loc>${CONFIG.siteUrl}${post.url}</loc>
    <lastmod>${post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('');
  
  // Insert before closing </urlset>
  sitemap = sitemap.replace('</urlset>', `${blogEntries}\n</urlset>`);
  
  fs.writeFileSync(CONFIG.sitemapPath, sitemap);
  
  console.log(`✅ Updated sitemap.xml with ${posts.length} blog posts\n`);
}

/**
 * Main execution
 */
function main() {
  console.log('\n🚀 Building Med-RAMP Blog...\n');
  console.log('=' .repeat(50));
  
  try {
    const posts = processMarkdownFiles();
    updatePostsJson(posts);
    updateSitemap(posts);
    
    console.log('=' .repeat(50));
    console.log('\n✨ Build complete! Blog is ready to deploy.\n');
    console.log(`📁 Output directory: ${CONFIG.outputDir}`);
    console.log(`📄 Generated ${posts.length} HTML pages\n`);
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, processMarkdownFiles };
