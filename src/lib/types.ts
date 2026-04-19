export type EntryType = 'expense' | 'income';

export interface Entry {
  id: string;
  desc: string;
  amount: number;
  date: string;
  category: string;
  type: EntryType;
  user_id?: string;
  created_at?: string;
}

export interface Budget {
  category: string;
  limit: number;
  user_id?: string;
}
