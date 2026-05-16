export type Invoice = {
  id: string;
  status: string;
  currency?: string;
  created_at: string;
  completed_at?: string;
  amount_cents: number;
  net_cents?: number;
  note?: string;
  plan_label?: string;
  invoice_number?: string;
};