import { api } from "../lib/api";

export interface FinancialData {
  current_ratio: number;
  cash_total_assets: number;
  roa_before_interest_depreciation: number;
  operating_profit_rate: number;
  debt_ratio: number;
  net_worth_assets: number;
  working_capital_total_assets: number;
  net_income_total_assets: number;
  total_asset_turnover: number;
  retained_earnings_total_assets: number;
  interest_coverage_ratio: number;
  equity_liability: number;
  cash_flow_total_assets: number;
}

export interface FinancialHealthResult {
  prediction: number;
  financial_health: "healthy" | "at_risk";
  bankruptcy_probability: number;
  decision_threshold: number;
}

export async function predictFinancialHealth(
  data: FinancialData
): Promise<FinancialHealthResult> {

  const response = await api.post(
    "/financial-health/predict",
    data
  );

  return response.data.data;
}