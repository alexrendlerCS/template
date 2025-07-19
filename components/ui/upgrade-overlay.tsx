"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Star, Zap, TrendingUp, Users, BarChart3 } from "lucide-react";
import { getCurrentTierConfig, getNextTier, getAllTiers, SubscriptionTier } from "@/lib/config/features";

interface UpgradeOverlayProps {
  feature: string;
  currentTier: SubscriptionTier;
  onUpgrade?: () => void;
  className?: string;
  variant?: 'blur' | 'overlay' | 'banner';
  showPricing?: boolean;
}

export function UpgradeOverlay({
  feature,
  currentTier,
  onUpgrade,
  className = "",
  variant = 'overlay',
  showPricing = true,
}: UpgradeOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentConfig = getCurrentTierConfig();
  const nextTier = getNextTier(currentTier);
  const nextTierConfig = nextTier ? getAllTiers().find(t => t.name === getCurrentTierConfig().name) : null;

  const getFeatureIcon = (featureName: string) => {
    switch (featureName.toLowerCase()) {
      case 'analytics':
        return <BarChart3 className="h-5 w-5" />;
      case 'clients':
        return <Users className="h-5 w-5" />;
      case 'packages':
        return <Zap className="h-5 w-5" />;
      case 'revenue':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getFeatureDescription = (featureName: string) => {
    switch (featureName.toLowerCase()) {
      case 'analytics':
        return 'Unlock detailed insights into your business performance';
      case 'clients':
        return 'Manage more clients and grow your business';
      case 'packages':
        return 'Create more package options for your clients';
      case 'revenue':
        return 'Track revenue trends and financial insights';
      default:
        return 'Access advanced features to grow your business';
    }
  };

  if (variant === 'blur') {
    return (
      <div className={`relative ${className}`}>
        <div className="blur-sm pointer-events-none">
          {/* Content will be blurred */}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
          <div className="text-center p-6">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {feature} Locked
            </h3>
            <p className="text-gray-600 mb-4">
              Upgrade to {nextTierConfig?.name || 'Professional'} to unlock {feature}
            </p>
            {onUpgrade && (
              <Button onClick={onUpgrade} className="bg-gradient-to-r from-blue-600 to-purple-600">
                Upgrade Now
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <Card className={`bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  {feature} requires upgrade
                </p>
                <p className="text-xs text-amber-700">
                  Current plan: {currentConfig.name}
                </p>
              </div>
            </div>
            {onUpgrade && (
              <Button 
                onClick={onUpgrade} 
                size="sm" 
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Upgrade
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default overlay variant
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
              {getFeatureIcon(feature)}
            </div>
            <CardTitle className="text-xl">
              Unlock {feature}
            </CardTitle>
            <CardDescription>
              {getFeatureDescription(feature)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge variant="secondary" className="mb-2">
                Current: {currentConfig.name}
              </Badge>
              <p className="text-sm text-gray-600">
                {currentConfig.description}
              </p>
            </div>

            {showPricing && nextTierConfig && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-900">
                    {nextTierConfig.name}
                  </h4>
                  <span className="text-lg font-bold text-blue-900">
                    {nextTierConfig.price}
                  </span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  {nextTierConfig.description}
                </p>
                <div className="space-y-1">
                  {Object.entries(nextTierConfig.features).map(([key, value]) => {
                    if (typeof value === 'boolean' && value) {
                      return (
                        <div key={key} className="flex items-center text-sm text-blue-800">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              {onUpgrade && (
                <Button 
                  onClick={onUpgrade} 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Upgrade Now
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex-1"
              >
                {isExpanded ? 'Show Less' : 'View All Plans'}
              </Button>
            </div>

            {isExpanded && (
              <div className="space-y-3 pt-4 border-t">
                {getAllTiers().map((tier) => (
                  <div 
                    key={tier.name} 
                    className={`p-3 rounded-lg border ${
                      tier.name === currentConfig.name 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-medium">{tier.name}</h5>
                      <span className="text-sm font-semibold">{tier.price}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{tier.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {tier.features.maxClients !== -1 && (
                        <Badge variant="outline" className="text-xs">
                          {tier.features.maxClients} Clients
                        </Badge>
                      )}
                      {tier.features.analyticsEnabled && (
                        <Badge variant="outline" className="text-xs">
                          Analytics
                        </Badge>
                      )}
                      {tier.features.customAnalyticsDashboard && (
                        <Badge variant="outline" className="text-xs">
                          Custom Dashboard
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 