# Med-RAMP Website

A modern, professional multi-page website for the Medical Research Assistance and Mentorship Program (Med-RAMP).

## 📁 File Structure

```
med-ramp/
├── index.html                 # Homepage (rich redesign)
├── about.html                 # About Us page (rich redesign)
├── publications.html          # Publications page (rich redesign)
├── blog.html                  # Blog page (rich redesign)
├── faq.html                   # FAQ page (rich redesign)
├── index1.html                # Homepage (original design)
├── about1.html                # About Us page (original design)
├── publications1.html         # Publications page (original design)
├── blog1.html                 # Blog page (original design)
├── faqs1.html                 # FAQ page (original design)
├── css/
│   ├── styles.css             # Styles for rich redesign pages
│   └── styles-1.css           # Styles for original design pages
├── js/
│   ├── main.js                # JavaScript for original design pages
│   ├── load-header-footer.js  # Header/footer loader for rich redesign pages
│   ├── load-header-footer-1.js # Header/footer loader for original design pages
│   └── page-effects-1.js      # Animations and effects for rich redesign pages
├── components/
│   ├── header-footer.html     # Shared header/footer for rich redesign pages
│   └── header-footer-1.html   # Shared header/footer for original design pages
├── images/
│   └── (your images go here)
├── blog-posts/
│   └── posts.json            # Blog posts data
└── README.md                 # This file
```

## 🚀 Setup Instructions

### 1. Clone or Download
Download all files and maintain the exact folder structure shown above.

### 2. Add Images
Place your images in the `images/` folder. Recommended sources for medical/academic images without real people:

- **Unsplash** (unsplash.com): Search "medical abstract", "laboratory", "science workspace"
- **Pexels** (pexels.com): Similar searches
- **Undraw** (undraw.co): Illustrated scientists and medical concepts
- **Freepik** (freepik.com): Medical vectors and illustrations

#### Recommended Images:
- `hero-background.jpg` - Abstract medical/science background
- `research-lab.jpg` - Laboratory equipment or workspace
- `collaboration.jpg` - Team collaboration (illustrated)
- `success.jpg` - Achievement/graduation imagery

### 3. Upload to GitHub

```bash
git add .
git commit -m "Initial Med-RAMP website"
git push origin main
```

### 4. Enable GitHub Pages
1. Go to your repository settings
2. Navigate to "Pages" section
3. Select "main" branch as source
4. Save

Your site will be live at: `https://beauhsiacreighton.github.io/med-ramp/`

## 📝 Adding Blog Posts (NO CODE CHANGES NEEDED!)

To add a new blog post, simply edit `blog-posts/posts.json`:

```json
{
  "title": "Your Post Title",
  "date": "2025-04-15",
  "category": "Category Name",
  "author": "Author Name",
  "excerpt": "Brief summary that appears in preview",
  "content": "<p>Your full post content with HTML formatting</p><h3>Subheadings</h3><p>More content...</p>"
}
```

### Blog Post Tips:
- Use `<p>` tags for paragraphs
- Use `<h3>` for subheadings
- Use `<ul><li>` for bullet points
- Use `<ol><li>` for numbered lists
- Keep dates in YYYY-MM-DD format
- Posts automatically sort by date (newest first)

### Categories to Use:
- Announcements
- Application Tips
- Research Insights
- Success Stories
- Tips & Resources
- Program Updates

## 🎨 Features Included

### ✅ Design Elements
- Responsive mobile-friendly design
- Smooth page transitions
- Parallax scrolling effects
- Glassmorphism effects
- Animated statistics counter
- Scroll-triggered animations
- Hover effects on all interactive elements
- Professional typography (Playfair Display + Inter)
- Gradient accents throughout

### ✅ Functionality
- Mobile navigation menu
- Searchable publications
- Filterable publications by type
- Collapsible FAQ sections
- Dynamic blog loading from JSON
- Smooth scrolling navigation
- Active page highlighting
- Browser-safe (no localStorage)

### ✅ Pages
1. **Homepage** (`index.html`) - Rich redesign with proof carousel, metrics, and FAQ preview
2. **About Us** (`about.html`) - Rich redesign with story, process, and outcome sections
3. **Publications** (`publications.html`) - Rich redesign with featured carousel and advanced filtering
4. **Blog** (`blog.html`) - Rich redesign with spotlight and dynamic post loading
5. **FAQ** (`faq.html`) - Rich redesign with sidebar, search, and category filters

Original design variants are available at `index1.html`, `about1.html`, `publications1.html`, `blog1.html`, and `faqs1.html`.

## 🖼️ Updating Images

### Option 1: Use CDN Links (Easiest)
Replace image sources in HTML with direct URLs from Unsplash/Pexels:

```html
<img src="https://images.unsplash.com/photo-YOUR-ID?w=800&q=80" alt="Description">
```

### Option 2: Upload to Repository
1. Add images to `images/` folder
2. Reference them as: `<img src="images/your-image.jpg">`
3. Commit and push to GitHub

### Option 3: Use Illustrations
For team members and avatars, the current design uses emoji/icon placeholders. You can:
- Keep the current emoji system
- Replace with illustrated avatars from Undraw
- Use gradient background circles with initials

## 🎯 Call-to-Action Links

All "Apply Now" buttons link to: `https://forms.gle/1b31NgtUQn37vqH27`

To update this link, search and replace in all HTML files.

## 📱 Mobile Optimization

The site is fully responsive and optimized for:
- Mobile phones (< 480px)
- Tablets (480px - 768px)
- Desktops (> 768px)

All features work seamlessly across devices.

## 🔧 Customization Guide

### Changing Colors
Edit the CSS variables in `css/styles.css` (rich redesign pages):

```css
:root {
    --accent: #015da9;        /* Main blue */
    --accent-light: #e0eef8;  /* Light blue background */
    --text: #1a1a1a;          /* Body text */
    --muted: #6b7280;         /* Muted text */
}
```

Or in `css/styles-1.css` (original design pages):

```css
:root {
    --primary-color: #007BFF;  /* Main blue */
    --secondary-color: #6c63ff; /* Purple accent */
    --accent-color: #00d4ff;    /* Light blue */
}
```

### Updating Statistics
Edit the metric counters in `index.html`:

```html
<span class="hero-metric-value" data-countup="300" data-countup-suffix="+">0+</span>
```

Change `data-countup="300"` to your actual number.

### Modifying About Page Content
Edit the story and focus sections in `about.html` using the `.story-card` and `.focus-card` elements.

## 🐛 Troubleshooting

### Blog Posts Not Showing
- Verify `posts.json` has valid JSON syntax
- Check browser console for errors (F12)
- Ensure file is in `blog-posts/` folder

### Images Not Loading
- Check file paths are correct
- Verify images are in `images/` folder
- Check image file extensions match HTML references

### Mobile Menu Not Working
- Clear browser cache
- Verify `main.js` is loading properly
- Check for JavaScript errors in console

## 🌟 Best Practices

### For Images
- Optimize images before uploading (< 500KB each)
- Use `.jpg` for photos, `.png` for graphics
- Include descriptive alt text for accessibility

### For Blog Posts
- Write in HTML but keep it simple
- Preview locally before committing
- Include relevant keywords for SEO
- Update regularly (1-2 posts per month)

### For Updates
- Test locally before pushing to GitHub
- Keep the original structure intact
- Commit frequently with clear messages

## 📊 Analytics (Optional)

To add Google Analytics, insert before `</head>` in all HTML files:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-ID');
</script>
```
