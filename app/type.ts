// src/types.ts
export type PortfolioData = {
  code: string;
  name: string;
  quantity: number;
  price: number;
  value: number;
  average_price: number;
  gain_loss: number;
  currency: "JPY" | "USD";
};

export interface Portfolio {
  id?: string;
  user_id?: string;
  broker: string;
  total_asset: number;
  created_at?: string;
}

export interface PortfolioItem {
  id?: string;
  portfolio_id?: string;
  code: string;
  name: string;
  quantity: number;
  price: number;
  value: number;
  average_price: number;
  gain_loss: number;
  currency: "JPY" | "USD";
  position_type?: "cash" | "margin";
  current_price?: number;
  created_at?: string;
}