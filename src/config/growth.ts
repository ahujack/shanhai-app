import AsyncStorage from '@react-native-async-storage/async-storage';

export type GrowthConfig = {
  recommendedPlan: 'auto' | 'vip_monthly' | 'vip_yearly';
  showPricingCompareCard: boolean;
  pointsTopHintVariant: 'frequency_first' | 'price_first';
};

const STORAGE_KEY = 'shanhai_growth_config_v1';

const DEFAULT_CONFIG: GrowthConfig = {
  recommendedPlan: 'auto',
  showPricingCompareCard: true,
  pointsTopHintVariant: 'frequency_first',
};

function parseConfig(raw: unknown): GrowthConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_CONFIG;
  const x = raw as Partial<GrowthConfig>;
  return {
    recommendedPlan:
      x.recommendedPlan === 'vip_monthly' || x.recommendedPlan === 'vip_yearly' || x.recommendedPlan === 'auto'
        ? x.recommendedPlan
        : DEFAULT_CONFIG.recommendedPlan,
    showPricingCompareCard:
      typeof x.showPricingCompareCard === 'boolean'
        ? x.showPricingCompareCard
        : DEFAULT_CONFIG.showPricingCompareCard,
    pointsTopHintVariant:
      x.pointsTopHintVariant === 'price_first' || x.pointsTopHintVariant === 'frequency_first'
        ? x.pointsTopHintVariant
        : DEFAULT_CONFIG.pointsTopHintVariant,
  };
}

export async function getGrowthConfig(): Promise<GrowthConfig> {
  try {
    const envRaw = process.env.EXPO_PUBLIC_GROWTH_CONFIG_JSON?.trim();
    if (envRaw) {
      return parseConfig(JSON.parse(envRaw));
    }
  } catch {
    // ignore env parse errors
  }
  try {
    const local = await AsyncStorage.getItem(STORAGE_KEY);
    if (!local) return DEFAULT_CONFIG;
    return parseConfig(JSON.parse(local));
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function setGrowthConfig(config: Partial<GrowthConfig>): Promise<GrowthConfig> {
  const merged = parseConfig({ ...(await getGrowthConfig()), ...config });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export { DEFAULT_CONFIG as defaultGrowthConfig };
