export type ItemType = 'PASS_FAIL' | 'VERIFIABLE' | 'QUALITATIVE';
export type DimensionCode = 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8' | 'D9' | 'D10';

export interface ChecklistItem {
  code: string;
  dimension: DimensionCode;
  category: string;
  label: string;
  description: string;
  type: ItemType;
  weight: number;
  dataSource?: string;
  isGate?: boolean;
}

export interface DimensionConfig {
  code: DimensionCode;
  name: string;
  weight: number;
  description: string;
  icon: string;
  items: ChecklistItem[];
}
