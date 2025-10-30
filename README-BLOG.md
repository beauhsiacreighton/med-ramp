# Med-RAMP Blog System

## 🎉 Your New Blog Setup

Your blog is now powered by Markdown files with automatic HTML generation! Each blog post gets its own URL.

### 📁 File Structure

```
/workspace/
├── blog-posts/              # 📝 Markdown source files (edit these!)
│   ├── navy-seal-mcat.md
│   ├── mcat-no-regrets.md
│   └── med-ramp-transformed.md
│
├── blog/                    # 🌐 Generated HTML (auto-created, don't edit)
│   ├── navy-seal-mcat.html
│   ├── mcat-no-regrets.html
│   └── med-ramp-transformed.html
│
├── scripts/
│   └── build-blog.js        # 🔧 Build script
│
└── blog-post-template.html  # 📄 HTML template
```

---

## ✍️ How to Create a New Blog Post

### Option 1: Using Netlify CMS (Easiest - Coming Soon)

1. Go to `https://med-ramp.com/admin`
2. Click "Blog Posts" → "New Blog Post"
3. Fill out the form
4. Click "Publish"
5. Done! GitHub Actions will build it automatically

**Note:** You'll need to set up Netlify Identity first. See "Setting Up Netlify CMS" section below.

### Option 2: Create Markdown File Manually

1. **Create a new `.md` file** in the `blog-posts/` folder:

```bash
touch blog-posts/my-new-post.md
```

2. **Add frontmatter** (metadata at the top):

```markdown
---
id: my-new-post
title: "My Awesome Blog Post Title"
excerpt: "A compelling one-sentence summary that makes people want to read more."
category: Research Tips
date: 2025-10-30
author: Your Name
authorRole: Your Role/Title
readTime: 5 min read
tags:
  - tag1
  - tag2
  - tag3
featured: true
featuredImage: https://images.unsplash.com/photo-123.jpg
---

Your blog post content starts here...
```

3. **Write your content** using Markdown:

```markdown
## This is a heading

This is a paragraph with **bold text** and *italic text*.

- Bullet point 1
- Bullet point 2

### Subheading

More content here!

![Alt text](https://example.com/image.jpg)
*Image caption goes here*
```

4. **Commit and push**:

```bash
git add blog-posts/my-new-post.md
git commit -m "Add new blog post"
git push
```

5. **GitHub Actions will automatically**:
   - Build the HTML page
   - Update the blog listing
   - Update the sitemap
   - Push the changes back

Your post is now live at: `https://med-ramp.com/blog/my-new-post.html`

---

## 📝 Markdown Features

### Basic Formatting

```markdown
**Bold text**
*Italic text*
[Link text](https://example.com)
```

### Images

```markdown
![Alt description](https://images.unsplash.com/photo-123.jpg)
*Optional caption below the image*
```

### Videos

#### YouTube:
```html
<iframe width="560" height="315" 
  src="https://www.youtube.com/embed/VIDEO_ID" 
  frameborder="0" allowfullscreen>
</iframe>
```

#### Vimeo:
```html
<iframe src="https://player.vimeo.com/video/VIDEO_ID" 
  width="640" height="360" frameborder="0" allowfullscreen>
</iframe>
```

#### Local Video:
```html
<video controls width="100%">
  <source src="/videos/my-video.mp4" type="video/mp4">
</video>
```

### Special Elements

#### Callout Boxes:
```html
<div class="callout callout-primary">
<strong>Pro tip:</strong> This is important information!
</div>
```

Available styles:
- `callout-primary` (blue)
- `callout-success` (green)
- `callout-warning` (red)
- `callout-tip` (yellow)

#### Stats Display:
```html
<div class="stats-display">
  <div class="stat-item">
    <div class="stat-value">520+</div>
    <div class="stat-label">MCAT Score</div>
  </div>
  <div class="stat-item">
    <div class="stat-value">100%</div>
    <div class="stat-label">Acceptance Rate</div>
  </div>
</div>
```

---

## 🛠️ Build Commands

### Build Manually (Local Testing)

```bash
npm run build
```

This will:
- Convert all `.md` files to `.html`
- Update `posts.json`
- Update `sitemap.xml`

### Watch Mode (Auto-rebuild on changes)

```bash
npm run build:watch
```

---

## 🚀 Deployment

### Automatic (GitHub Pages + Actions)

Every time you push markdown files, GitHub Actions automatically:

1. Runs the build script
2. Generates HTML pages
3. Updates the sitemap
4. Commits and pushes the changes

**No manual work needed!**

### Manual Deployment

If you need to deploy manually:

```bash
npm run build
git add blog/ blog-posts/posts.json sitemap.xml
git commit -m "Update blog posts"
git push
```

---

## 🎨 Setting Up Netlify CMS (Optional but Recommended)

Netlify CMS gives you a WordPress-like editor for your blog.

### Step 1: Enable Netlify Identity

1. Go to [Netlify](https://netlify.com) and sign up (free)
2. Import your GitHub repository
3. Go to **Site settings** → **Identity**
4. Click **Enable Identity**
5. Under **Registration preferences**, select "Invite only"
6. Scroll down to **Services** → **Git Gateway** and click **Enable Git Gateway**

### Step 2: Invite Yourself

1. Go to **Identity** tab
2. Click **Invite users**
3. Enter your email
4. Check your email and accept the invitation

### Step 3: Access the CMS

Visit: `https://your-site.com/admin`

You'll see a beautiful editor where you can:
- Create new posts
- Edit existing posts
- Upload images
- Preview before publishing

---

## 🔍 SEO Features (Built-in!)

Every blog post automatically includes:

✅ **Meta tags** (title, description, keywords)
✅ **Open Graph tags** (Facebook/LinkedIn sharing)
✅ **Twitter Card tags** (Twitter sharing)
✅ **Structured data** (Google rich results)
✅ **Canonical URLs** (prevents duplicate content)
✅ **Automatic sitemap** (helps Google find your posts)

**Example when someone shares your post:**

- ✨ Beautiful preview card with image
- 📝 Title and description
- 🖼️ Featured image displays correctly

---

## 📚 Frontmatter Field Reference

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `id` | ✅ | string | URL slug (e.g., `my-post-title`) |
| `title` | ✅ | string | Post title |
| `excerpt` | ✅ | text | 1-2 sentence summary |
| `category` | ✅ | select | Research Tips, Success Stories, etc. |
| `date` | ✅ | date | YYYY-MM-DD format |
| `author` | ✅ | string | Author name |
| `authorRole` | ✅ | string | Author title/role |
| `readTime` | ✅ | string | e.g., "7 min read" |
| `tags` | ⚪ | list | Array of tags |
| `featured` | ⚪ | boolean | Show as featured? |
| `featuredImage` | ⚪ | url | Header image URL |

---

## 🐛 Troubleshooting

### "Build failed" on GitHub Actions

**Check:**
1. Is your markdown file valid?
2. Does it have proper frontmatter?
3. Check the Actions tab on GitHub for error details

### "Post not showing on blog listing"

**Fix:**
```bash
npm run build
git push
```

### "Images not loading"

**Check:**
- Use full URLs for external images
- For local images, place in `/images/` folder
- Reference as: `/images/your-image.jpg`

---

## 💡 Tips & Best Practices

### SEO Tips

1. **Use descriptive IDs**: `my-guide-to-mcat-prep` ✅ not `post1` ❌
2. **Write compelling excerpts**: They appear in search results!
3. **Add alt text to images**: Helps SEO and accessibility
4. **Use 3-5 tags**: More focused than 10+ tags
5. **Featured images**: 1200x630px is optimal for social sharing

### Writing Tips

1. **Break up text**: Use headings (##, ###)
2. **Add images**: Every 2-3 paragraphs
3. **Use callouts**: Highlight important info
4. **Short paragraphs**: 2-3 sentences max
5. **Scannable**: Bullets, bold, subheadings

### Performance Tips

1. **Optimize images**: Use compressed images
2. **External images**: Use CDN services (Unsplash, Cloudinary)
3. **Videos**: Embed from YouTube/Vimeo (don't host locally)

---

## 📞 Need Help?

- **Build issues**: Check `scripts/build-blog.js`
- **Template issues**: Edit `blog-post-template.html`
- **Styling**: Edit CSS in the template file

---

## 🎯 Quick Start Checklist

- [x] ✅ Markdown files created in `blog-posts/`
- [x] ✅ Build script set up
- [x] ✅ GitHub Actions configured
- [x] ✅ Individual URLs working
- [x] ✅ SEO tags added
- [ ] ⏳ Set up Netlify CMS (optional)
- [ ] ⏳ Write your first new post!

---

**Your blog is ready! Start writing in markdown and watch the magic happen.** ✨
