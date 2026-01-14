# Yahboom Outreach Strategy

## Overview

This document outlines a strategy to approach Yahboom about potentially sponsoring or licensing this improved documentation site for their Building:bit Super Kit.

## Value Proposition for Yahboom

### Problems with Current Site
1. **Navigation**: JavaScript-based navigation makes content hard to find and impossible to bookmark
2. **Mobile Experience**: Current site is not optimized for mobile/tablet use during building
3. **Discoverability**: No filtering by difficulty or sensors used
4. **SEO**: Dynamic content isn't indexed well by search engines

### Our Solution Provides
1. **Better UX**: Clean gallery interface with filtering and search
2. **Mobile-First**: Responsive design works on phones/tablets next to the build
3. **Offline Capability**: Static site can be cached/saved for offline use
4. **Step Viewer**: Full-screen assembly steps with navigation
5. **Lesson Viewer**: Structured coding lessons with copy buttons
6. **Fast Loading**: Optimized WebP images, static hosting

## Monetization Options

### Option A: Yahboom Sponsorship (Preferred)
- Yahboom pays monthly hosting fee (~$7-20/month for Render)
- Yahboom gets branded site with their logo
- Site links to Yahboom store for kit purchases
- We maintain and improve the site

**Pitch**: "We've built a better documentation experience for your kit. For the cost of a coffee per week, you can offer this to your customers."

### Option B: Community-Supported Model
If Yahboom declines, implement:

#### 1. Freemium Access
- First 22 builds: Free access
- Last 10 builds: Blurred/locked
- Unlock via:
  a. Google Sign-In (we collect email for newsletter)
  b. One-time donation ($3-10 USD)

#### 2. Donation Button
- "Buy me a coffee" style donation
- Suggested amounts: $3, $5, $10
- Message: "Help cover hosting costs (~$7/month)"

#### 3. Email Collection Value
- Build newsletter list of robotics educators/parents
- Potential for:
  - Tips & tricks emails
  - New project announcements
  - Affiliate partnerships with robotics suppliers

## Implementation Plan for Freemium Model

### Technical Requirements
```
1. Firebase Authentication (Google Sign-In)
2. Firestore for user data storage
3. Build unlock logic in app.js
4. Blur CSS for locked builds
5. Payment integration (Stripe/Ko-fi/Buy Me a Coffee)
```

### User Flow
```
[Visit Site]
    → [Browse 22 free builds]
    → [Click locked build 23-32]
    → [Modal: "Unlock all builds"]
        → [Option 1: Sign in with Google] → [Unlocked]
        → [Option 2: Donate $3+] → [Unlocked]
        → [Option 3: "Maybe later"] → [Stay locked]
```

### Locked Builds (Suggested: Last 10)
| ID | Name | Why Lock |
|----|------|----------|
| 1.23 | Excavator | Complex build |
| 1.24 | Fire truck | Popular design |
| 1.25 | Concrete mixer | Advanced |
| 1.26 | Bulldozer | High interest |
| 1.27 | Dump truck | Complete set |
| 1.28 | Tower crane | Complex |
| 1.29 | Balance ball | Unique |
| 1.30 | Boxing robot | Fun project |
| 1.31 | Drawing robot | Advanced |
| 1.32 | Robotic arm | Most complex |

## Outreach Email Template

```
Subject: Improved Documentation Site for Building:bit Super Kit

Dear Yahboom Team,

I'm a customer who purchased your Building:bit Super Kit for my son.
We love the kit, but found the online documentation challenging to navigate.

I've built a companion website that reorganizes your excellent content
into an easy-to-use gallery:

🔗 https://building-bit-superkit.onrender.com

Features:
- Gallery view of all 32 builds with filtering
- Mobile-friendly step-by-step viewer
- Structured MakeCode/Python lessons
- Fast, responsive design

All content credits and links point back to yahboom.net.

I'd love to discuss:
1. Official endorsement/linking from your product page
2. Potential sponsorship to cover hosting (~$10/month)
3. Any concerns about the use of your content

I'm happy to add your branding and ensure this drives traffic and
sales to your store.

Best regards,
Mads Nissen

P.S. The site is open source: github.com/madshn/yahboom
```

## Contact Information

### Yahboom Contacts
- Website: https://www.yahboom.net
- Support: support@yahboom.com (typical)
- Alibaba: Check for business contact
- Amazon Seller: Message through platform

### Timing
- Best to reach out after:
  1. All coding lessons are scraped
  2. Site is polished and stable
  3. Some usage analytics collected

## Legal Considerations

### Current Status
- Content used for educational/personal use
- Clear attribution to Yahboom
- No commercial gain (yet)

### If Monetizing
- Need explicit permission from Yahboom
- Alternative: Only monetize our UX, not their content
- Consider: Affiliate links to Yahboom store instead

## Success Metrics

### For Yahboom Pitch
- Page views / unique visitors
- Time on site
- Geographic distribution
- User feedback/testimonials

### For Community Model
- Email signups
- Donation conversion rate
- Cost coverage ratio

---

## Next Steps

1. [ ] Finish scraping all coding lessons
2. [ ] Add Google Analytics
3. [ ] Polish UI/UX
4. [ ] Collect 1-2 weeks of usage data
5. [ ] Draft and send outreach email
6. [ ] If no response in 2 weeks, implement freemium model
