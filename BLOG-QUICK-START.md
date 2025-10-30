# 🚀 Med-RAMP Blog - Quick Start Guide

## ✨ What Just Got Built

Your blog now has:

✅ **Individual URLs** - Each post at `med-ramp.com/blog/post-name.html`
✅ **Markdown Support** - Write in easy markdown format
✅ **Images & Videos** - Embed anything via links
✅ **Auto-Build** - GitHub Actions builds on every commit
✅ **SEO Optimized** - Meta tags, Open Graph, structured data
✅ **Netlify CMS Ready** - WordPress-like editor available

---

## 📝 Create Your First Post (2 Minutes)

### Step 1: Create a new markdown file

```bash
touch blog-posts/my-first-post.md
```

### Step 2: Add this content

```markdown
---
id: my-first-post
title: "My First Blog Post"
excerpt: "This is a test post to see how the new system works!"
category: Research Tips
date: 2025-10-30
author: Your Name
authorRole: Your Title
readTime: 3 min read
tags:
  - test
  - getting started
featured: false
featuredImage: https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800
---

## Welcome to My Blog!

This is my first post using the new markdown system.

### It's Super Easy!

I can add:

- **Bold text**
- *Italic text*
- [Links](https://med-ramp.com)

### Images Are Simple

![Student studying](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800)
*Add captions like this*

### Even Videos!

<iframe width="560" height="315" 
  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
  frameborder="0" allowfullscreen>
</iframe>

<div class="callout callout-success">
<strong>Pro Tip:</strong> This is a callout box for important information!
</div>

## That's It!

Super easy to write and publish.
```

### Step 3: Commit and push

```bash
git add blog-posts/my-first-post.md
git commit -m "Add my first blog post"
git push
```

### Step 4: Wait 1-2 minutes

GitHub Actions will automatically:
- Build the HTML
- Update the blog listing
- Update sitemap
- Push changes

Your post is now live at: `https://med-ramp.com/blog/my-first-post.html`

---

## 🎨 Your New Blog URLs

Your existing posts now have individual URLs:

1. `med-ramp.com/blog/navy-seal-mcat-keep-world-small.html`
2. `med-ramp.com/blog/mcat-study-with-no-regrets-philosophy.html`
3. `med-ramp.com/blog/med-ramp-transformed-application.html`

---

## 📁 Files Created

```
New Files:
├── blog-posts/*.md              (3 markdown files - your existing posts)
├── blog/*.html                  (3 HTML files - generated)
├── scripts/build-blog.js        (Build script)
├── blog-post-template.html      (HTML template)
├── package.json                 (Dependencies)
├── .github/workflows/build-blog.yml (Auto-build)
└── README-BLOG.md              (Full documentation)

Updated Files:
├── admin/config.yml            (Netlify CMS config)
├── js/blog-listing.js          (Updated URLs)
├── blog-posts/posts.json       (Auto-updated)
└── sitemap.xml                 (Auto-updated)
```

---

## 🔧 Commands You'll Use

### Build blog locally
```bash
npm run build
```

### Watch for changes (auto-rebuild)
```bash
npm run build:watch
```

---

## 📚 Markdown Cheat Sheet

### Headings
```markdown
# H1
## H2
### H3
```

### Text Formatting
```markdown
**bold**
*italic*
[link text](url)
```

### Images
```markdown
![Alt text](https://example.com/image.jpg)
*Caption text*
```

### YouTube Video
```html
<iframe width="560" height="315" 
  src="https://www.youtube.com/embed/VIDEO_ID">
</iframe>
```

### Callout Boxes
```html
<div class="callout callout-primary">
Important message here!
</div>
```

Colors: `callout-primary` (blue), `callout-success` (green), `callout-warning` (red), `callout-tip` (yellow)

---

## 🎯 What Happens When You Push

1. **You commit** markdown file
2. **GitHub Actions detects** the change
3. **Build script runs** automatically
4. **HTML pages generated** in `/blog/` folder
5. **Blog listing updated** with new post
6. **Sitemap updated** for SEO
7. **Changes committed** and pushed
8. **Post goes live** on your site

**All automatic. Zero manual work!**

---

## 🐛 Troubleshooting

### Build fails?
Check the "Actions" tab on GitHub for errors.

### Post not showing?
Make sure the frontmatter is correct (especially the `id` field).

### Images not loading?
Use full URLs: `https://example.com/image.jpg`

---

## 🎉 Next Steps

1. ✅ All setup is complete!
2. 📝 Write your next blog post
3. 🚀 Push and watch it auto-deploy
4. 🎨 (Optional) Set up Netlify CMS for visual editing

**Full documentation:** See `README-BLOG.md`

---

## 💡 Pro Tips

✨ **Use Unsplash** for free high-quality images
✨ **Keep paragraphs short** (2-3 sentences)
✨ **Add images every 2-3 paragraphs** for visual interest
✨ **Use callout boxes** to highlight important info
✨ **Optimize featured images** to 1200x630px for social sharing

---

**Your blog is ready! Start writing in markdown. It's that easy.** 🎊
