# 🔍 How to Preview Your Blog Locally

## Quick Start

### **Option 1: Quick Preview (Recommended)**

```bash
# Build the blog first
npm run build

# Start preview server (opens in browser automatically)
npm run preview
```

Then visit:
- `http://localhost:8000/blog.html` - Blog listing
- `http://localhost:8000/blog/post-name.html` - Individual posts

---

## 📋 All Preview Methods

### **Method 1: Using npm scripts (Easiest)**

```bash
# Build & preview in one command
npm run dev

# Or preview existing build
npm run preview
```

The `-o` flag opens your browser automatically!

---

### **Method 2: Python (No Installation Needed)**

```bash
# Build first
npm run build

# Start server
python -m http.server 8000

# Or Python 2
python -m SimpleHTTPServer 8000
```

Open: `http://localhost:8000`

---

### **Method 3: Node.js http-server**

```bash
# Build first
npm run build

# Start server (one-time, no installation)
npx http-server -p 8000

# Or install globally for faster startup
npm install -g http-server
http-server -p 8000
```

---

### **Method 4: PHP**

```bash
# Build first
npm run build

# Start server
php -S localhost:8000
```

---

### **Method 5: VS Code Live Server Extension**

If you use VS Code:

1. Install "Live Server" extension
2. Right-click `blog.html` or any blog post
3. Select "Open with Live Server"

---

## 🔄 Development Workflow

### **Watch Mode (Auto-rebuild)**

Terminal 1 - Auto-rebuild when markdown changes:
```bash
npm run build:watch
```

Terminal 2 - Preview server:
```bash
npm run preview
```

Now when you edit markdown files, they auto-rebuild!
(You'll need to refresh your browser to see changes)

---

## 🧪 Test Before Pushing

### **Complete Testing Workflow:**

```bash
# 1. Create/edit a markdown file
nano blog-posts/my-test-post.md

# 2. Build it
npm run build

# 3. Preview locally
npm run preview

# 4. Check in browser:
#    - Does the post look good?
#    - Are images loading?
#    - Is formatting correct?
#    - Do links work?

# 5. If good, commit and push
git add blog-posts/my-test-post.md
git commit -m "Add new blog post"
git push
```

---

## 🎯 What to Check During Preview

### **On Blog Listing Page** (`/blog.html`):
- ✅ New post appears in the list
- ✅ Featured image displays
- ✅ Excerpt looks good
- ✅ Category and date correct
- ✅ "Read More" link works

### **On Individual Post Page** (`/blog/post-name.html`):
- ✅ Title and header look good
- ✅ Featured image displays
- ✅ Content formatted correctly
- ✅ Images load
- ✅ Videos embed properly
- ✅ Callout boxes styled correctly
- ✅ Tags display
- ✅ "Back to Blog" link works

---

## 🐛 Common Issues & Fixes

### **Issue: "npm: command not found"**

You need Node.js installed. Use Python instead:
```bash
python -m http.server 8000
```

---

### **Issue: "Port 8000 already in use"**

Use a different port:
```bash
npx http-server -p 8080
```

---

### **Issue: CSS not loading**

Make sure you're viewing `http://localhost:8000/blog.html`
NOT `file:///path/to/blog.html`

(Opening files directly won't work - you need a server!)

---

### **Issue: Images not showing**

Check your markdown:
```markdown
# ✅ Correct (full URL)
![Alt](https://images.unsplash.com/photo-123.jpg)

# ❌ Wrong (relative path without server)
![Alt](../images/photo.jpg)

# ✅ Correct (relative path with server running)
![Alt](/images/photo.jpg)
```

---

## 🚀 Branch Preview (Before Merging to Main)

If you want to preview on a branch before merging:

```bash
# Create a test branch
git checkout -b test-new-post

# Add your markdown file
echo '---
id: test-post
title: "Test"
---
# Test content
' > blog-posts/test-post.md

# Build and preview locally
npm run build
npm run preview

# Check in browser - looks good?

# Commit to branch
git add blog-posts/test-post.md blog/
git commit -m "Test new post"
git push origin test-new-post

# If you have GitHub Pages on this branch, visit:
# https://your-username.github.io/med-ramp/blog/test-post.html
# (only if you configured multi-branch deployment)

# Happy? Merge to main
git checkout main
git merge test-new-post
git push origin main
```

---

## 📱 Mobile Preview

### **Test on your phone:**

1. Start local server:
   ```bash
   npm run preview
   ```

2. Find your computer's IP address:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

3. On your phone's browser:
   ```
   http://YOUR_IP_ADDRESS:8000/blog.html
   ```
   
   Example: `http://192.168.1.100:8000/blog.html`

---

## 🎨 Preview Individual Components

### **Test just the template:**

```bash
# Open the template file
code blog-post-template.html

# View in browser via Live Server
```

### **Test just the build script:**

```bash
# Run build with verbose output
node scripts/build-blog.js
```

---

## 💡 Pro Tips

### **Tip 1: Create a test post**

Keep a `test-post.md` file for quick testing:

```bash
cp blog-posts/navy-seal-mcat-keep-world-small.md blog-posts/test-post.md
# Edit test-post.md to experiment
npm run build
npm run preview
```

Don't commit test posts!

### **Tip 2: Use browser dev tools**

Press `F12` in browser to:
- Check for JavaScript errors
- Test mobile responsive design
- View SEO meta tags

### **Tip 3: Check SEO tags**

Right-click page → View Source → Check `<head>` section for:
- Meta description
- Open Graph tags
- Structured data

---

## ✅ Pre-Push Checklist

Before pushing to GitHub:

- [ ] Markdown builds without errors
- [ ] Post displays correctly in blog listing
- [ ] Individual post page looks good
- [ ] All images load
- [ ] Videos embed properly
- [ ] Links work
- [ ] Mobile view looks good (test in browser dev tools)
- [ ] SEO meta tags present (view source)
- [ ] No spelling errors in title/excerpt

---

## 🎉 Summary

**Quick preview:**
```bash
npm run dev
```

**Just preview (already built):**
```bash
npm run preview
```

**Development workflow:**
```bash
# Terminal 1
npm run build:watch

# Terminal 2
npm run preview
```

That's it! Preview locally, then push when ready. 🚀
