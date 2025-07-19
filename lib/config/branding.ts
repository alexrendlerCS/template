export interface BrandingConfig {
  // Business Information
  businessName: string;
  businessDescription: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessWebsite: string;
  
  // Legal Information
  legalEntityName: string;
  legalEntityType: string; // e.g., "LLC", "Corporation", "Sole Proprietorship"
  
  // Visual Branding
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // Platform Names
  platformName: string;
  platformDescription: string;
  trainerPortalName: string;
  clientPortalName: string;
  
  // Contact Information
  supportEmail: string;
  supportPhone: string;
  
  // Social Media (optional)
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

// Default branding configuration - replace with your actual branding
export const defaultBranding: BrandingConfig = {
  // Business Information
  businessName: "Your Fitness Business",
  businessDescription: "Professional fitness coaching platform",
  businessEmail: "info@yourfitnessbusiness.com",
  businessPhone: "(555) 123-4567",
  businessAddress: "123 Fitness Street, City, State 12345",
  businessWebsite: "https://yourfitnessbusiness.com",
  
  // Legal Information
  legalEntityName: "Your Fitness Business LLC",
  legalEntityType: "LLC",
  
  // Visual Branding
  logoUrl: "/logo.jpg",
  faviconUrl: "/logo.jpg",
  primaryColor: "#dc2626", // Red-600
  secondaryColor: "#1f2937", // Gray-800
  accentColor: "#f59e0b", // Amber-500
  
  // Platform Names
  platformName: "Fitness Training Platform",
  platformDescription: "Book and manage your personal training sessions",
  trainerPortalName: "Trainer Portal",
  clientPortalName: "Client Portal",
  
  // Contact Information
  supportEmail: "support@yourfitnessbusiness.com",
  supportPhone: "(555) 123-4567",
  
  // Social Media
  socialMedia: {
    facebook: "https://facebook.com/yourfitnessbusiness",
    instagram: "https://instagram.com/yourfitnessbusiness",
    twitter: "https://twitter.com/yourfitnessbusiness",
    linkedin: "https://linkedin.com/company/yourfitnessbusiness",
  },
};

// Function to get branding configuration
// This can be extended to load from environment variables or external config
export function getBrandingConfig(): BrandingConfig {
  // You can override defaults with environment variables
  return {
    ...defaultBranding,
    businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME || defaultBranding.businessName,
    businessEmail: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || defaultBranding.businessEmail,
    businessPhone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || defaultBranding.businessPhone,
    businessAddress: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || defaultBranding.businessAddress,
    businessWebsite: process.env.NEXT_PUBLIC_BUSINESS_WEBSITE || defaultBranding.businessWebsite,
    legalEntityName: process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME || defaultBranding.legalEntityName,
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || defaultBranding.logoUrl,
    faviconUrl: process.env.NEXT_PUBLIC_FAVICON_URL || defaultBranding.faviconUrl,
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || defaultBranding.primaryColor,
    secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR || defaultBranding.secondaryColor,
    accentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR || defaultBranding.accentColor,
    platformName: process.env.NEXT_PUBLIC_PLATFORM_NAME || defaultBranding.platformName,
    platformDescription: process.env.NEXT_PUBLIC_PLATFORM_DESCRIPTION || defaultBranding.platformDescription,
    trainerPortalName: process.env.NEXT_PUBLIC_TRAINER_PORTAL_NAME || defaultBranding.trainerPortalName,
    clientPortalName: process.env.NEXT_PUBLIC_CLIENT_PORTAL_NAME || defaultBranding.clientPortalName,
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || defaultBranding.supportEmail,
    supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || defaultBranding.supportPhone,
  };
} 