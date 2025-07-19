# Fitness Training Platform - White Label Template

A comprehensive SaaS platform for personal trainers with tiered subscription features, client management, session scheduling, and analytics. This template is designed to be easily rebranded and customized for different fitness businesses.

## 🚀 Quick Setup Guide

### Step 1: Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account (free tier available)
- Stripe account (for payments)

### Step 2: Clone and Install
```bash
# Clone the repository
git clone <your-repo-url>
cd fitness-training-platform

# Install dependencies
pnpm install
```

### Step 3: Environment Setup
```bash
# Copy environment template
cp env.example .env.local
```

### Step 4: Configure Your Tier
Edit `.env.local` and set your subscription tier:
```env
# Choose your tier: lowest, middle, or highest
NEXT_PUBLIC_SUBSCRIPTION_TIER=lowest
```

## 📋 Tier-Based Setup Guide

### 🟢 **Starter Tier (lowest)** - Basic Setup
**Perfect for individual trainers just getting started**

#### Required Configuration:
```env
# Essential Services
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Basic Branding
NEXT_PUBLIC_BUSINESS_NAME=Your Fitness Business
NEXT_PUBLIC_BUSINESS_EMAIL=info@yourfitnessbusiness.com
NEXT_PUBLIC_BUSINESS_PHONE=(555) 123-4567

# Visual Branding
NEXT_PUBLIC_LOGO_URL=/logo.jpg
NEXT_PUBLIC_PRIMARY_COLOR=#dc2626
```

#### Features Available:
- ✅ Client management (max 5 clients)
- ✅ Session scheduling
- ✅ Package management (max 3 packages per type)
- ✅ Basic payment processing
- ❌ Analytics dashboard
- ❌ Google Calendar integration
- ❌ Advanced reporting

#### Setup Steps:
1. **Supabase Setup** (5 minutes)
   - Create account at [supabase.com](https://supabase.com)
   - Create new project
   - Copy URL and keys to `.env.local`

2. **Branding Setup** (10 minutes)
   - Add your logo to `public/logo.jpg`
   - Update business info in `.env.local`
   - Edit legal documents in `legal/` folder

3. **Launch**
   ```bash
   pnpm dev
   ```

---

### 🟡 **Professional Tier (middle)** - Enhanced Setup
**Ideal for growing fitness businesses**

#### Required Configuration:
```env
# All Starter Tier settings +
NEXT_PUBLIC_SUBSCRIPTION_TIER=middle

# Stripe Integration (Required)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Google Calendar (Optional but recommended)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

#### Features Available:
- ✅ Client management (max 10 clients)
- ✅ Session scheduling
- ✅ Package management (max 4 packages per type)
- ✅ Payment processing with Stripe
- ✅ **Analytics dashboard** (revenue, clients, sessions)
- ✅ **Google Calendar integration**
- ✅ Bulk operations
- ❌ Custom analytics dashboard
- ❌ Advanced reporting

#### Setup Steps:
1. **Complete Starter Tier Setup**

2. **Stripe Setup** (10 minutes)
   - Create account at [stripe.com](https://stripe.com)
   - Get API keys from dashboard
   - Add keys to `.env.local`

3. **Google Calendar Setup** (15 minutes)
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Add credentials to `.env.local`

4. **Enhanced Branding**
   - Update all business information
   - Customize legal documents
   - Add social media links

5. **Launch**
   ```bash
   pnpm dev
   ```

---

### 🔴 **Enterprise Tier (highest)** - Full Setup
**For established fitness businesses with advanced needs**

#### Required Configuration:
```env
# All Professional Tier settings +
NEXT_PUBLIC_SUBSCRIPTION_TIER=highest

# Email Service (Recommended)
RESEND_API_KEY=your_resend_api_key

# Analytics (Optional)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
```

#### Features Available:
- ✅ **Unlimited clients**
- ✅ **Unlimited packages**
- ✅ Full payment processing
- ✅ **Complete analytics suite**
- ✅ **Google Calendar integration**
- ✅ **Custom analytics dashboard**
- ✅ **Advanced reporting**
- ✅ **API access**
- ✅ **Priority support**
- ✅ **Bulk operations**

#### Setup Steps:
1. **Complete Professional Tier Setup**

2. **Email Service Setup** (10 minutes)
   - Create account at [resend.com](https://resend.com)
   - Get API key
   - Add to `.env.local`

3. **Advanced Configuration**
   - Set up custom domain
   - Configure SSL certificates
   - Set up monitoring and analytics

4. **Custom Branding**
   - Complete brand customization
   - Professional legal documents
   - Custom color schemes

5. **Launch**
   ```bash
   pnpm dev
   ```

## 🎨 Branding Customization

### Quick Branding Setup
1. **Replace Logo**
   ```bash
   # Add your logo to public folder
   cp your-logo.jpg public/logo.jpg
   ```

2. **Update Business Info** in `.env.local`:
   ```env
   NEXT_PUBLIC_BUSINESS_NAME=Your Fitness Business
   NEXT_PUBLIC_BUSINESS_EMAIL=info@yourfitnessbusiness.com
   NEXT_PUBLIC_BUSINESS_PHONE=(555) 123-4567
   NEXT_PUBLIC_BUSINESS_ADDRESS=123 Fitness Street, City, State 12345
   NEXT_PUBLIC_BUSINESS_WEBSITE=https://yourfitnessbusiness.com
   ```

3. **Customize Colors**:
   ```env
   NEXT_PUBLIC_PRIMARY_COLOR=#dc2626    # Main brand color
   NEXT_PUBLIC_SECONDARY_COLOR=#1f2937  # Secondary color
   NEXT_PUBLIC_ACCENT_COLOR=#f59e0b     # Accent color
   ```

4. **Update Legal Documents**:
   - Edit `legal/terms-of-service.md`
   - Edit `legal/privacy-policy.md`
   - Edit `legal/training-agreement-template.md`
   - Replace all `[PLACEHOLDER]` text with your information

## 🔧 Advanced Configuration

### Custom Tier Limits
Edit `lib/config/features.ts` to customize limits:
```typescript
export const tierConfigs = {
  lowest: {
    name: "Starter",
    features: {
      maxClients: 5,                    // Change this
      maxPackagesPerSessionType: 3,     // Change this
      // ... other features
    },
  },
  // ... other tiers
};
```

### Custom Branding
Edit `lib/config/branding.ts` for default branding:
```typescript
export const defaultBranding: BrandingConfig = {
  businessName: "Your Fitness Business",
  businessEmail: "info@yourfitnessbusiness.com",
  // ... customize all branding
};
```

## 📊 Feature Comparison

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| **Clients** | 5 max | 10 max | Unlimited |
| **Packages** | 3 per type | 4 per type | Unlimited |
| **Analytics** | ❌ | ✅ Basic | ✅ Full + Custom |
| **Google Calendar** | ❌ | ✅ | ✅ |
| **Payment Processing** | Basic | Stripe | Stripe + Advanced |
| **Support** | Community | Email | Priority |
| **API Access** | ❌ | ❌ | ✅ |

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
- **Netlify**: Similar to Vercel
- **Railway**: Good for full-stack apps
- **DigitalOcean**: More control, requires more setup

## 📚 Documentation

- **BRANDING_GUIDE.md**: Complete branding customization guide
- **env.example**: All available environment variables
- **legal/**: Legal document templates

## 🆘 Support

### Common Issues
1. **Environment Variables**: Make sure all required variables are set
2. **Database**: Run Supabase migrations if needed
3. **Stripe**: Use test keys for development
4. **Google Calendar**: Check OAuth redirect URI

### Getting Help
- Check the troubleshooting section below
- Review environment variable documentation
- Ensure all prerequisites are installed

## 🔍 Troubleshooting

### "Supabase connection failed"
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check if Supabase project is active

### "Stripe payment failed"
- Use test keys for development
- Verify webhook endpoints are configured

### "Google Calendar not working"
- Check OAuth credentials
- Verify redirect URI matches exactly
- Ensure Google Calendar API is enabled

### "Analytics not showing"
- Check if current tier has analytics enabled
- Verify `NEXT_PUBLIC_SUBSCRIPTION_TIER` is set correctly

---

**Built with ❤️ for fitness professionals** 

## 🔧 **Step 1: Configure Git Identity**

### **Set your Git identity:**
```bash
git config --global user.name "Alex Rendler"
git config --global user.email "your.email@example.com"
```

Replace `your.email@example.com` with your actual email address.

### **Verify the configuration:**
```bash
git config --global user.name
git config --global user.email
```

## 🔄 **Step 2: Commit the Changes**

### **Now commit the changes:**
```bash
git commit -m "Clean up template repository"
```

## 🚀 **Step 3: Add Remote and Push**

### **Add the remote:**
```bash
git remote add origin https://github.com/alexrendlerCS/template.git
```

### **Verify the remote:**
```bash
git remote -v
```

### **Push to GitHub:**
```bash
git push -u origin main
```

Use your personal access token when prompted.

## 📋 **Step 4: Create GitHub Repository**

**Before pushing, make sure you've created the repository on GitHub:**

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right
3. Select **"New repository"**
4. Fill in:
   - **Repository name**: `template`
   - **Description**: `Fitness Training Platform - White Label Template`
   - **Make it Public**
   - **Don't** initialize with README, .gitignore, or license
5. Click **"Create repository"**

## ✅ **Step 5: Verify Everything**

### **Check both repositories:**
```bash
# Check original project
cd /mnt/c/Users/alexr/OneDrive/Desktop/Projects/personal-trainer
git log --oneline -3

# Check template project
cd /mnt/c/Users/alexr/OneDrive/Desktop/Projects/template
git log --oneline -3
```

Once you set up your Git identity, we should be able to commit and push the template repository successfully! 