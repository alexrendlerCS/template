export type SubscriptionTier = 'lowest' | 'middle' | 'highest';

export interface FeatureLimits {
  // Client Management
  maxClients: number;
  
  // Package Management
  maxPackagesPerSessionType: number;
  
  // Analytics Features
  analyticsEnabled: boolean;
  analyticsFeatures: {
    revenueTrend: boolean;
    newClientsPerMonth: boolean;
    sessionsByWeekday: boolean;
    packageSalesByType: boolean;
    topRevenueClients: boolean;
    topSessionTimes: boolean;
    recentPayments: boolean;
    recentSessions: boolean;
    customAnalytics: boolean;
  };
  
  // Google Calendar Integration
  googleCalendarEnabled: boolean;
  
  // Additional Features
  customAnalyticsDashboard: boolean;
  advancedReporting: boolean;
  bulkOperations: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface TierConfig {
  name: string;
  description: string;
  price?: string;
  features: FeatureLimits;
}

export const tierConfigs: Record<SubscriptionTier, TierConfig> = {
  lowest: {
    name: "Starter",
    description: "Perfect for individual trainers just getting started",
    price: "$29/month",
    features: {
      maxClients: 5,
      maxPackagesPerSessionType: 3,
      analyticsEnabled: false,
      analyticsFeatures: {
        revenueTrend: false,
        newClientsPerMonth: false,
        sessionsByWeekday: false,
        packageSalesByType: false,
        topRevenueClients: false,
        topSessionTimes: false,
        recentPayments: false,
        recentSessions: false,
        customAnalytics: false,
      },
      googleCalendarEnabled: false,
      customAnalyticsDashboard: false,
      advancedReporting: false,
      bulkOperations: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  middle: {
    name: "Professional",
    description: "Ideal for growing fitness businesses",
    price: "$79/month",
    features: {
      maxClients: 10,
      maxPackagesPerSessionType: 4,
      analyticsEnabled: true,
      analyticsFeatures: {
        revenueTrend: true,
        newClientsPerMonth: true,
        sessionsByWeekday: true,
        packageSalesByType: true,
        topRevenueClients: true,
        topSessionTimes: true,
        recentPayments: true,
        recentSessions: true,
        customAnalytics: false,
      },
      googleCalendarEnabled: true,
      customAnalyticsDashboard: false,
      advancedReporting: false,
      bulkOperations: true,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  highest: {
    name: "Enterprise",
    description: "For established fitness businesses with advanced needs",
    price: "$199/month",
    features: {
      maxClients: -1, // Unlimited
      maxPackagesPerSessionType: -1, // Unlimited
      analyticsEnabled: true,
      analyticsFeatures: {
        revenueTrend: true,
        newClientsPerMonth: true,
        sessionsByWeekday: true,
        packageSalesByType: true,
        topRevenueClients: true,
        topSessionTimes: true,
        recentPayments: true,
        recentSessions: true,
        customAnalytics: true,
      },
      googleCalendarEnabled: true,
      customAnalyticsDashboard: true,
      advancedReporting: true,
      bulkOperations: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
};

// Function to get current tier from environment variable
export function getCurrentTier(): SubscriptionTier {
  const tier = process.env.NEXT_PUBLIC_SUBSCRIPTION_TIER as SubscriptionTier;
  if (tier && tierConfigs[tier]) {
    return tier;
  }
  return 'lowest'; // Default to lowest tier
}

// Function to get current tier configuration
export function getCurrentTierConfig(): TierConfig {
  return tierConfigs[getCurrentTier()];
}

// Function to check if a feature is enabled for current tier
export function isFeatureEnabled(feature: keyof FeatureLimits): boolean {
  const config = getCurrentTierConfig();
  return config.features[feature] as boolean;
}

// Function to get limit for a feature
export function getFeatureLimit(feature: keyof FeatureLimits): number {
  const config = getCurrentTierConfig();
  return config.features[feature] as number;
}

// Function to check if analytics feature is enabled
export function isAnalyticsFeatureEnabled(feature: keyof TierConfig['features']['analyticsFeatures']): boolean {
  const config = getCurrentTierConfig();
  return config.features.analyticsEnabled && config.features.analyticsFeatures[feature];
}

// Function to check if Google Calendar is enabled
export function isGoogleCalendarEnabled(): boolean {
  return isFeatureEnabled('googleCalendarEnabled');
}

// Function to check if user has reached client limit
export function hasReachedClientLimit(currentClientCount: number): boolean {
  const maxClients = getFeatureLimit('maxClients');
  return maxClients !== -1 && currentClientCount >= maxClients;
}

// Function to check if user has reached package limit
export function hasReachedPackageLimit(currentPackageCount: number): boolean {
  const maxPackages = getFeatureLimit('maxPackagesPerSessionType');
  return maxPackages !== -1 && currentPackageCount >= maxPackages;
}

// Function to get upgrade message for a feature
export function getUpgradeMessage(feature: string): string {
  const currentTier = getCurrentTier();
  const nextTier = currentTier === 'lowest' ? 'middle' : 'highest';
  const nextTierConfig = tierConfigs[nextTier];
  
  return `Upgrade to ${nextTierConfig.name} to unlock ${feature}`;
}

// Function to get all available tiers
export function getAllTiers(): TierConfig[] {
  return Object.values(tierConfigs);
}

// Function to get next tier
export function getNextTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  switch (currentTier) {
    case 'lowest':
      return 'middle';
    case 'middle':
      return 'highest';
    case 'highest':
      return null; // Already at highest tier
    default:
      return 'middle';
  }
} 