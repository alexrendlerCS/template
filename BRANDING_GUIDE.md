# Branding Update Guide

This guide lists all the places in the codebase where branding elements need to be updated for white-label purposes.

## 🎯 Quick Branding Setup

### 1. Primary Configuration File
**File:** `lib/config/branding.ts`
- **Purpose:** Centralized branding configuration
- **What to update:** All business information, colors, and contact details
- **Priority:** HIGH - This is the main configuration file

### 2. Environment Variables
**File:** `.env.local` (create this file)
```env
# Business Information
NEXT_PUBLIC_BUSINESS_NAME=Your Business Name
NEXT_PUBLIC_BUSINESS_EMAIL=info@yourbusiness.com
NEXT_PUBLIC_BUSINESS_PHONE=(555) 123-4567
NEXT_PUBLIC_BUSINESS_ADDRESS=123 Your Street, City, State 12345
NEXT_PUBLIC_BUSINESS_WEBSITE=https://yourbusiness.com

# Legal Information
NEXT_PUBLIC_LEGAL_ENTITY_NAME=Your Business LLC
NEXT_PUBLIC_LEGAL_ENTITY_TYPE=LLC

# Visual Branding
NEXT_PUBLIC_LOGO_URL=/your-logo.png
NEXT_PUBLIC_FAVICON_URL=/your-favicon.ico
NEXT_PUBLIC_PRIMARY_COLOR=#3b82f6
NEXT_PUBLIC_SECONDARY_COLOR=#1f2937
NEXT_PUBLIC_ACCENT_COLOR=#f59e0b

# Platform Names
NEXT_PUBLIC_PLATFORM_NAME=Your Platform Name
NEXT_PUBLIC_PLATFORM_DESCRIPTION=Your platform description
NEXT_PUBLIC_TRAINER_PORTAL_NAME=Trainer Portal
NEXT_PUBLIC_CLIENT_PORTAL_NAME=Client Portal

# Contact Information
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourbusiness.com
NEXT_PUBLIC_SUPPORT_PHONE=(555) 123-4567

# Subscription Tier
NEXT_PUBLIC_SUBSCRIPTION_TIER=lowest
```

## 📁 Files Requiring Branding Updates

### Core Configuration Files

#### 1. `lib/config/branding.ts`
- **Status:** ✅ Created
- **Purpose:** Central branding configuration
- **Updates needed:** All business information, colors, contact details

#### 2. `lib/config/features.ts`
- **Status:** ✅ Created
- **Purpose:** Subscription tier configuration
- **Updates needed:** Tier names, descriptions, pricing

### Legal Documents

#### 3. `legal/terms-of-service.md`
- **Status:** ✅ Created
- **Purpose:** Terms of service template
- **Updates needed:** Replace all `[PLACEHOLDER]` values with actual business information

#### 4. `legal/privacy-policy.md`
- **Status:** ✅ Created
- **Purpose:** Privacy policy template
- **Updates needed:** Replace all `[PLACEHOLDER]` values with actual business information

#### 5. `legal/training-agreement-template.md`
- **Status:** ✅ Created
- **Purpose:** Training agreement template
- **Updates needed:** Replace all `[PLACEHOLDER]` values with actual business information

### Visual Assets

#### 6. `public/logo.jpg`
- **Status:** ⚠️ Needs replacement
- **Purpose:** Main business logo
- **Updates needed:** Replace with your business logo

#### 7. `public/favicon.ico`
- **Status:** ⚠️ Needs replacement
- **Purpose:** Browser favicon
- **Updates needed:** Replace with your business favicon

### Application Files

#### 8. `app/layout.tsx`
- **Status:** ⚠️ Needs updates
- **Purpose:** Root layout with metadata
- **Updates needed:** 
  - Title and description
  - Favicon references
  - Any hardcoded business names

#### 9. `app/page.tsx`
- **Status:** ⚠️ Needs updates
- **Purpose:** Landing page
- **Updates needed:**
  - Page title and description
  - Any hardcoded business names

#### 10. `app/login/page.tsx`
- **Status:** ⚠️ Needs updates
- **Purpose:** Login page
- **Updates needed:**
  - Logo references
  - Business name in title
  - Platform description

### Component Files

#### 11. `components/client-sidebar.tsx`
- **Status:** ⚠️ Needs updates
- **Purpose:** Client navigation sidebar
- **Updates needed:**
  - Logo references
  - Business name in header
  - Portal names

#### 12. `components/trainer-sidebar.tsx`
- **Status:** ⚠️ Needs updates
- **Purpose:** Trainer navigation sidebar
- **Updates needed:**
  - Logo references
  - Business name in header
  - Portal names

#### 13. `components/ContractTemplate.tsx`
- **Status:** ⚠️ Needs updates
- **Purpose:** Contract template component
- **Updates needed:**
  - Business name in header
  - Legal entity information
  - Contact details

### API Files

#### 14. `app/api/contract/generate/route.ts`
- **Status:** ⚠️ Needs updates
- **Purpose:** PDF contract generation
- **Updates needed:**
  - Business name in PDF header
  - Legal entity information

### Styling Files

#### 15. `app/globals.css`
- **Status:** ⚠️ Needs updates
- **Purpose:** Global CSS variables
- **Updates needed:**
  - Primary color variables
  - Any brand-specific styling

#### 16. `tailwind.config.ts`
- **Status:** ⚠️ Needs updates
- **Purpose:** Tailwind configuration
- **Updates needed:**
  - Custom color definitions
  - Brand-specific theme extensions

## 🔄 Update Process

### Step 1: Update Configuration
1. Edit `lib/config/branding.ts` with your business information
2. Set environment variables in `.env.local`
3. Update `lib/config/features.ts` with your tier configuration

### Step 2: Update Legal Documents
1. Edit all files in the `legal/` folder
2. Replace all placeholder values with actual business information
3. Review with legal counsel if needed

### Step 3: Replace Visual Assets
1. Replace `public/logo.jpg` with your logo
2. Replace `public/favicon.ico` with your favicon
3. Update any other branding images

### Step 4: Update Application Files
1. Update `app/layout.tsx` metadata
2. Update `app/page.tsx` content
3. Update `app/login/page.tsx` branding

### Step 5: Update Components
1. Update sidebar components with new branding
2. Update contract template component
3. Update any other hardcoded branding references

### Step 6: Update Styling
1. Update CSS variables in `app/globals.css`
2. Update Tailwind configuration if needed
3. Test visual consistency across the application

## 🎨 Branding Elements Checklist

### Business Information
- [ ] Business name
- [ ] Business description
- [ ] Contact email
- [ ] Contact phone
- [ ] Business address
- [ ] Website URL
- [ ] Legal entity name
- [ ] Legal entity type

### Visual Branding
- [ ] Logo (multiple sizes/formats)
- [ ] Favicon
- [ ] Primary color
- [ ] Secondary color
- [ ] Accent color
- [ ] Typography preferences

### Platform Names
- [ ] Platform name
- [ ] Platform description
- [ ] Trainer portal name
- [ ] Client portal name

### Legal Information
- [ ] Terms of service
- [ ] Privacy policy
- [ ] Training agreement template
- [ ] Support contact information

### Subscription Tiers
- [ ] Tier names
- [ ] Tier descriptions
- [ ] Tier pricing
- [ ] Feature limits

## 🔍 Search and Replace Commands

Use these commands to find hardcoded branding references:

```bash
# Find all instances of "Fitness Training"
grep -r "Fitness Training" . --exclude-dir=node_modules --exclude-dir=.git

# Find all instances of "FitCoach Pro"
grep -r "FitCoach Pro" . --exclude-dir=node_modules --exclude-dir=.git

# Find all instances of "Coach Kilday"
grep -r "Coach Kilday" . --exclude-dir=node_modules --exclude-dir=.git

# Find all logo references
grep -r "logo.jpg" . --exclude-dir=node_modules --exclude-dir=.git
```

## ✅ Verification Checklist

After making all updates, verify:

- [ ] All placeholder values replaced
- [ ] Logo displays correctly on all pages
- [ ] Colors are consistent throughout the application
- [ ] Legal documents contain correct business information
- [ ] Contact information is accurate
- [ ] Subscription tiers are configured correctly
- [ ] No hardcoded branding references remain
- [ ] Application builds and runs without errors
- [ ] All features work as expected with new branding

## 🚨 Common Issues

### Issue: Logo not displaying
**Solution:** Check file path and ensure logo file exists in `public/` directory

### Issue: Colors not updating
**Solution:** Clear browser cache and restart development server

### Issue: Legal documents showing placeholders
**Solution:** Ensure all `[PLACEHOLDER]` values are replaced in legal files

### Issue: Environment variables not working
**Solution:** Restart development server after updating `.env.local`

## 📞 Support

If you encounter issues during the branding update process:

1. Check the [README.md](./README.md) for detailed instructions
2. Review the [Issues](../../issues) page for known problems
3. Create a new issue with specific details about your problem

---

**Remember:** Always test your changes thoroughly before deploying to production! 