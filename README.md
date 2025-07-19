# Fitness Training Platform - White Label Template

A comprehensive SaaS platform for personal trainers with tiered subscription features, client management, session scheduling, and analytics. This template is designed to be easily rebranded and customized for different fitness businesses.

## 🚀 Features

### Core Features
- **Client Management**: Add, manage, and track client progress
- **Session Scheduling**: Book and manage training sessions
- **Package Management**: Create and sell training packages
- **Payment Processing**: Integrated Stripe payments
- **Analytics Dashboard**: Business insights and performance tracking
- **Google Calendar Integration**: Sync sessions with Google Calendar
- **Contract Management**: Digital contract signing and management

### Tiered Subscription System
- **Starter Tier**: Basic features with limited clients and packages
- **Professional Tier**: Enhanced features with expanded limits
- **Enterprise Tier**: Full feature access with unlimited usage

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd fitness-training-platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   
   # Subscription Tier (lowest, middle, highest)
   NEXT_PUBLIC_SUBSCRIPTION_TIER=lowest
   ```

4. **Set up the database**
   ```bash
   # Run Supabase migrations
   npx supabase db push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

## 🎨 Branding Customization

### 1. Update Business Information

Edit `lib/config/branding.ts` to customize your business details:

```typescript
export const defaultBranding: BrandingConfig = {
  businessName: "Your Fitness Business",
  businessDescription: "Professional fitness coaching platform",
  businessEmail: "info@yourfitnessbusiness.com",
  businessPhone: "(555) 123-4567",
  businessAddress: "123 Fitness Street, City, State 12345",
  businessWebsite: "https://yourfitnessbusiness.com",
  
  legalEntityName: "Your Fitness Business LLC",
  legalEntityType: "LLC",
  
  logoUrl: "/logo.jpg",
  faviconUrl: "/logo.jpg",
  primaryColor: "#dc2626", // Red-600
  secondaryColor: "#1f2937", // Gray-800
  accentColor: "#f59e0b", // Amber-500
  
  platformName: "Fitness Training Platform",
  platformDescription: "Book and manage your personal training sessions",
  trainerPortalName: "Trainer Portal",
  clientPortalName: "Client Portal",
  
  supportEmail: "support@yourfitnessbusiness.com",
  supportPhone: "(555) 123-4567",
};
```

### 2. Environment Variable Overrides

You can override branding settings using environment variables:

```env
NEXT_PUBLIC_BUSINESS_NAME=Your Business Name
NEXT_PUBLIC_BUSINESS_EMAIL=info@yourbusiness.com
NEXT_PUBLIC_LOGO_URL=/your-logo.png
NEXT_PUBLIC_PRIMARY_COLOR=#3b82f6
```

### 3. Update Visual Assets

Replace the following files in the `public/` directory:
- `logo.jpg` - Your business logo
- `favicon.ico` - Browser favicon
- Any other branding images

### 4. Update Legal Documents

Edit the legal documents in the `legal/` folder:
- `legal/terms-of-service.md`
- `legal/privacy-policy.md`
- `legal/training-agreement-template.md`

Replace all placeholders (e.g., `[BUSINESS_NAME]`, `[SUPPORT_EMAIL]`) with your actual information.

## ⚙️ Feature Configuration

### Subscription Tiers

Configure subscription tiers in `lib/config/features.ts`:

```typescript
export const tierConfigs: Record<SubscriptionTier, TierConfig> = {
  lowest: {
    name: "Starter",
    description: "Perfect for individual trainers just getting started",
    price: "$29/month",
    features: {
      maxClients: 5,
      maxPackagesPerSessionType: 3,
      analyticsEnabled: false,
      // ... other features
    },
  },
  // ... other tiers
};
```

### Setting the Current Tier

Set the current tier using environment variables:

```env
NEXT_PUBLIC_SUBSCRIPTION_TIER=lowest  # lowest, middle, or highest
```

### Feature Flags

The platform uses feature flags to control access to features based on subscription tiers:

```typescript
import { isFeatureEnabled, getFeatureLimit } from '@/lib/config/features';

// Check if analytics is enabled
const analyticsEnabled = isFeatureEnabled('analyticsEnabled');

// Get client limit
const maxClients = getFeatureLimit('maxClients');
```

## 📊 Analytics Features

### Available Analytics
- **Revenue Trends**: Monthly revenue tracking
- **Client Growth**: New client acquisition
- **Session Analytics**: Session frequency and patterns
- **Package Performance**: Most popular packages
- **Client Revenue**: Top revenue-generating clients
- **Session Times**: Peak booking times

### Tier Access
- **Starter**: No analytics access
- **Professional**: Basic analytics (revenue, clients, sessions)
- **Enterprise**: Full analytics + custom dashboard requests

## 👥 Client Management

### Client Limits
- **Starter**: 5 clients maximum
- **Professional**: 10 clients maximum  
- **Enterprise**: Unlimited clients

### Package Limits
- **Starter**: 3 packages per session type
- **Professional**: 4 packages per session type
- **Enterprise**: Unlimited packages

## 🔧 Customization Guide

### Adding New Features

1. **Define the feature in the tier configuration**:
   ```typescript
   // In lib/config/features.ts
   features: {
     // ... existing features
     newFeature: boolean | number,
   }
   ```

2. **Add feature checking in components**:
   ```typescript
   import { isFeatureEnabled } from '@/lib/config/features';
   
   const newFeatureEnabled = isFeatureEnabled('newFeature');
   ```

3. **Show upgrade prompts for restricted features**:
   ```typescript
   import { UpgradeOverlay } from '@/components/ui/upgrade-overlay';
   
   {newFeatureEnabled ? (
     <NewFeatureComponent />
   ) : (
     <UpgradeOverlay
       feature="New Feature"
       currentTier={currentTier}
       onUpgrade={handleUpgrade}
     />
   )}
   ```

### Styling Customization

The platform uses Tailwind CSS with CSS variables for theming. Update colors in `app/globals.css`:

```css
:root {
  --primary: 0 84% 60%; /* Your primary color */
  --secondary: 0 0% 96.1%;
  /* ... other variables */
}
```

### Database Schema

The database schema is documented in `DATABASE_SCHEMA.md`. Key tables include:
- `users` - Client and trainer accounts
- `sessions` - Training sessions
- `packages` - Training packages
- `payments` - Payment records
- `trainer_availability` - Trainer schedules

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Other Platforms

The platform can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

### Environment Variables for Production

Ensure all required environment variables are set in your production environment:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_production_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_production_stripe_publishable_key

# Branding
NEXT_PUBLIC_BUSINESS_NAME=Your Business Name
NEXT_PUBLIC_SUBSCRIPTION_TIER=lowest

# Other
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=your_production_url
```

## 🔒 Security

### Authentication
- Supabase Auth for user authentication
- Role-based access control (trainer/client)
- Secure session management

### Data Protection
- All data encrypted in transit and at rest
- GDPR-compliant data handling
- Regular security audits

### Payment Security
- Stripe handles all payment processing
- No sensitive payment data stored locally
- PCI DSS compliant

## 📞 Support

### Documentation
- [Database Schema](./DATABASE_SCHEMA.md)
- [API Documentation](./docs/api.md)
- [Component Library](./docs/components.md)

### Getting Help
- Check the [Issues](../../issues) page for known problems
- Create a new issue for bugs or feature requests
- Contact support at [SUPPORT_EMAIL]

## 📄 License

This template is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🗺️ Roadmap

- [ ] Advanced reporting features
- [ ] Mobile app development
- [ ] Integration with fitness tracking devices
- [ ] AI-powered workout recommendations
- [ ] Multi-language support
- [ ] Advanced scheduling features

---

**Built with ❤️ for fitness professionals** 

## Feature Flags and Tier System

The template includes a comprehensive tiered subscription system with feature flags that control access to different functionality based on the user's subscription tier.

### Subscription Tiers

The system supports three subscription tiers:

1. **Lowest Tier** (`lowest`): Basic features only
2. **Middle Tier** (`middle`): Enhanced features including Google Calendar
3. **Highest Tier** (`highest`): Full feature access including custom analytics

### Feature Configuration

Features are configured in `lib/config/features.ts`:

```typescript
// Example feature limits per tier
const tierConfigs = {
  lowest: {
    maxClients: 5,
    maxPackagesPerSessionType: 2,
    analyticsEnabled: false,
    googleCalendarEnabled: false,
    // ... other features
  },
  middle: {
    maxClients: 25,
    maxPackagesPerSessionType: 5,
    analyticsEnabled: true,
    googleCalendarEnabled: true,
    // ... other features
  },
  highest: {
    maxClients: 100,
    maxPackagesPerSessionType: 10,
    analyticsEnabled: true,
    googleCalendarEnabled: true,
    // ... other features
  }
};
```

### Google Calendar Integration

Google Calendar integration is a tiered feature that's only available to **middle** and **highest** tier users:

- **Lowest tier**: No Google Calendar access
- **Middle tier**: Full Google Calendar integration
- **Highest tier**: Full Google Calendar integration

#### Google Calendar Feature Gating

The following functionality is properly gated by tier:

1. **Login Flow**: Google Calendar connection prompts only appear for eligible tiers
2. **Session Creation**: Google Calendar events are only created for eligible tiers
3. **Session Updates**: Google Calendar sync only occurs for eligible tiers
4. **API Endpoints**: All Google Calendar APIs check tier access before processing
5. **UI Components**: Google Calendar components show upgrade prompts for ineligible tiers

#### Implementation Details

- **Frontend**: Components check `isGoogleCalendarEnabled()` before showing Google Calendar features
- **Backend**: All Google Calendar API endpoints validate tier access using `isGoogleCalendarEnabled()`
- **Database**: Sessions are created without Google Calendar events for ineligible tiers
- **User Experience**: Clear upgrade prompts guide users to higher tiers for Google Calendar access

### Analytics Features

Analytics features are tiered with different levels of access:

- **Lowest tier**: No analytics access (shows upgrade overlay)
- **Middle tier**: Basic analytics with upgrade prompts for advanced features
- **Highest tier**: Full analytics including custom dashboard

### Client and Package Limits

Each tier has specific limits on:

- **Maximum clients**: 5 (lowest) → 25 (middle) → 100 (highest)
- **Maximum packages per session type**: 2 (lowest) → 5 (middle) → 10 (highest)

### Setting the Current Tier

The current tier is controlled by the `SUBSCRIPTION_TIER` environment variable:

```bash
# .env.local
SUBSCRIPTION_TIER=lowest  # or 'middle' or 'highest'
```

### Feature Flag Functions

Use these helper functions to check feature access:

```typescript
import { 
  isFeatureEnabled, 
  isAnalyticsFeatureEnabled, 
  isGoogleCalendarEnabled,
  getCurrentTier,
  getCurrentTierConfig 
} from '@/lib/config/features';

// Check if a specific feature is enabled
const analyticsEnabled = isFeatureEnabled('analyticsEnabled');

// Check if Google Calendar is enabled
const calendarEnabled = isGoogleCalendarEnabled();

// Get current tier
const currentTier = getCurrentTier();

// Get full tier configuration
const tierConfig = getCurrentTierConfig();
``` 