Med-RAMP Website
A modern, professional multi-page website for the Medical Research Assistance and Mentorship Program (Med-RAMP).
📁 File Structure
med-ramp/
├── index.html                 # Homepage
├── about.html                 # About Us page
├── publications.html          # Publications page
├── success-stories.html       # Success Stories page
├── blog.html                  # Blog page
├── faq.html                   # FAQ page
├── css/
│   └── styles.css            # All styling
├── js/
│   └── main.js               # All JavaScript functionality
├── images/
│   └── (your images go here)
├── blog-posts/
│   └── posts.json            # Blog posts data
└── README.md                 # This file
🚀 Setup Instructions
1. Clone or Download
Download all files and maintain the exact folder structure shown above.
2. Add Images
Place your images in the images/ folder. Recommended sources for medical/academic images without real people:

Unsplash (unsplash.com): Search "medical abstract", "laboratory", "science workspace"
Pexels (pexels.com): Similar searches
Undraw (undraw.co): Illustrated scientists and medical concepts
Freepik (freepik.com): Medical vectors and illustrations

Recommended Images:

hero-background.jpg - Abstract medical/science background
research-lab.jpg - Laboratory equipment or workspace
collaboration.jpg - Team collaboration (illustrated)
success.jpg - Achievement/graduation imagery

3. Upload to GitHub
bashgit add .
git commit -m "Initial Med-RAMP website"
git push origin main
4. Enable GitHub Pages

Go to your repository settings
Navigate to "Pages" section
Select "main" branch as source
Save

Your site will be live at: https://beauhsiacreighton.github.io/med-ramp/
📝 Adding Blog Posts (NO CODE CHANGES NEEDED!)
To add a new blog post, simply edit blog-posts/posts.json:
json{
  "title": "Your Post Title",
  "date": "2025-04-15",
  "category": "Category Name",
  "author": "Author Name",
  "excerpt": "Brief summary that appears in preview",
  "content": "<p>Your full post content with HTML formatting</p><h3>Subheadings</h3><p>More content...</p>"
}
Blog Post Tips:

Use <p> tags for paragraphs
Use <h3> for subheadings
Use <ul><li> for bullet points
Use <ol><li> for numbered lists
Keep dates in YYYY-MM-DD format
Posts automatically sort by date (newest first)

Categories to Use:

Announcements
Application Tips
Research Insights
Success Stories
Tips & Resources
Program Updates

🎨 Features Included
✅ Design Elements

Responsive mobile-friendly design
Smooth page transitions
Parallax scrolling effects
Glassmorphism effects
Animated statistics counter
Scroll-triggered animations
Hover effects on all interactive elements
Professional typography (Playfair Display + Inter)
Gradient accents throughout

✅ Functionality

Mobile navigation menu
Searchable publications
Filterable publications by type
Collapsible FAQ sections
Dynamic blog loading from JSON
Smooth scrolling navigation
Active page highlighting
Browser-safe (no localStorage)

✅ Pages

Homepage - Hero section, stats, features, process timeline
About Us - Mission, values, research focus, team
Publications - Searchable/filterable database of research
Success Stories - Testimonials with achievements
Blog - Dynamic posts loaded from JSON
FAQ - Organized collapsible questions

🖼️ Updating Images
Option 1: Use CDN Links (Easiest)
Replace image sources in HTML with direct URLs from Unsplash/Pexels:
html<img src="https://images.unsplash.com/photo-YOUR-ID?w=800&q=80" alt="Description">
Option 2: Upload to Repository

Add images to images/ folder
Reference them as: <img src="images/your-image.jpg">
Commit and push to GitHub

Option 3: Use Illustrations
For team members and avatars, the current design uses emoji/icon placeholders. You can:

Keep the current emoji system
Replace with illustrated avatars from Undraw
Use gradient background circles with initials

🎯 Call-to-Action Links
All "Apply Now" buttons link to: https://forms.gle/1b31NgtUQn37vqH27
To update this link, search and replace in all HTML files.
📱 Mobile Optimization
The site is fully responsive and optimized for:

Mobile phones (< 480px)
Tablets (480px - 768px)
Desktops (> 768px)

All features work seamlessly across devices.
🔧 Customization Guide
Changing Colors
Edit the CSS variables in css/styles.css:
css:root {
    --primary-color: #007BFF;  /* Main blue */
    --secondary-color: #6c63ff; /* Purple accent */
    --accent-color: #00d4ff;    /* Light blue */
}
Updating Statistics
Edit the numbers in index.html:
html<div class="stat-number" data-target="300">0</div>
Change data-target="300" to your actual number.
Modifying Team Members
Edit the team section in about.html. Each team member follows this structure:
html<div class="team-member" data-scroll-animate>
    <div class="member-avatar">👨‍⚕️</div>
    <div class="member-name">Name</div>
    <div class="member-role">Role</div>
    <p class="member-bio">Bio text...</p>
</div>
🐛 Troubleshooting
Blog Posts Not Showing

Verify posts.json has valid JSON syntax
Check browser console for errors (F12)
Ensure file is in blog-posts/ folder

Images Not Loading

Check file paths are correct
Verify images are in images/ folder
Check image file extensions match HTML references

Mobile Menu Not Working

Clear browser cache
Verify main.js is loading properly
Check for JavaScript errors in console

🌟 Best Practices
For Images

Optimize images before uploading (< 500KB each)
Use .jpg for photos, .png for graphics
Include descriptive alt text for accessibility

For Blog Posts

Write in HTML but keep it simple
Preview locally before committing
Include relevant keywords for SEO
Update regularly (1-2 posts per month)

For Updates

Test locally before pushing to GitHub
Keep the original structure intact
Commit frequently with clear messages

📊 Analytics (Optional)
To add Google Analytics, insert before </head> in all HTML files:
html<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-ID');
</script>
