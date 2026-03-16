export interface Metadata {
  generated_at: string;
  version: string;
  source: string;
}

export interface MarketScore {
  score: number | null;
  label: string;
  emoji: string;
  description: string;
  trend: "up" | "down" | "stable";
}

export interface Indicator {
  name: string;
  current: number | null;
  previous?: number | null;
  change?: number | null;
  change_pct?: number | null;
  trend?: "up" | "down" | "stable" | null;
  unit?: string;
  description?: string;
  series?: Array<Record<string, unknown>>;
  // affordability extras
  monthly_payment?: number;
  annual_cost?: number;
  price_to_income?: number;
  affordable?: boolean;
  // rental yield
  avg_yield?: number;
  top_barrios?: Array<Record<string, unknown>>;
  // price drop ratio
  drop_ratio?: number;
  total_active?: number;
  with_drops?: number;
  // rent burden
  monthly_income_ref?: number;
  median_rent?: number;
  severity?: string;
  by_district?: RentBurdenDistrict[];
  // lanzamientos CGPJ
  quarter_label?: string;
  alquiler?: number | null;
  hipoteca?: number | null;
  otros?: number | null;
  alquiler_pct?: number | null;
  yoy_change?: number | null;
  yoy_change_pct?: number | null;
}

export interface RentBurdenDistrict {
  distrito: string;
  median_rent: number;
  burden_pct: number;
  severity: string;
  barrios: number;
}

export interface MacroIndicator {
  name: string;
  current: number | null;
  previous?: number | null;
  change?: number | null;
  change_pct?: number | null;
  trend?: "up" | "down" | "stable" | null;
  unit?: string;
}

export interface Zone {
  name: string;
  median_price: number | null;
  price_per_sqm: number | null;
  active_count?: number;
  days_to_sell?: number | null;
}

export interface RentalYield {
  barrio: string;
  distrito: string;
  gross_yield: number | null;
  rent_median: number | null;
  sale_price_sqm?: number | null;
}

export interface TrendPoint {
  week?: string;
  week_start?: string;
  avg_sqm?: number;
  avg_price?: number;
  n_listings?: number;
}

export interface Alert {
  level: "critical" | "warning" | "info";
  title: string;
  message: string;
  code?: string;
  params?: Record<string, string | number>;
}

export interface BarrioData {
  barrio: string;
  distrito: string;
  active_count: number | null;
  median_price: number | null;
  price_per_sqm: number | null;
  avg_size_sqm: number | null;
  avg_rooms: number | null;
  avg_days_market: number | null;
  gross_yield: number | null;
  rent_median: number | null;
}

export interface BarrioTrend {
  barrio: string;
  week: string;
  week_start: string;
  median_price_sqm: number | null;
  listing_count: number | null;
}

export interface BarrioBaseline {
  distrito: string;
  median_sqm: number;
  std_sqm: number;
  count: number;
  avg_size: number;
  avg_rooms: number | null;
  avg_floor: number | null;
}

export interface ValuationModel {
  barrio_baselines: Record<string, BarrioBaseline>;
  district_baselines: Record<string, { median_sqm: number; count: number }>;
  adjustments: Record<string, number>;
  madrid_median_sqm: number;
  training_samples: number;
  training_date: string;
}

export interface MetricsData {
  metadata: Metadata;
  market_score: MarketScore;
  indicators: Record<string, Indicator>;
  macro: Record<string, MacroIndicator>;
  zones: Zone[];
  rental_yields: RentalYield[];
  trends: {
    market: TrendPoint[];
    by_district: Array<Record<string, unknown>>;
  };
  notarial_gap: Array<Record<string, unknown>>;
  barrios: BarrioData[];
  barrio_trends: BarrioTrend[];
  price_drop_stats: Record<string, unknown>;
  db_stats: Record<string, unknown>;
  alerts: Alert[];
  valuation_model?: ValuationModel;
}
