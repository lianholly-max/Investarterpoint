// USD for prices; USD billions for financial statements. All values are fictional.
export type Company = {
  ticker: string;
  name: string;
  sector: string;
  description: string;
  cap: number;
  pe: number;
  gross: number;
  roe: number;
  roic: number;
  financials: { year: string; revenue: number; income: number; fcf: number }[];
  prices: { date: string; price: number }[];
};
