export interface StockItem {
  id: string;
  barcode: string;
  quantity: number;
  timestamp: Date;
}

export interface ExportData {
  date: string; // YYYYMMDD
  barcode: string;
  time: string; // HHMMSS
  quantity: number;
}

export interface ScanResult {
  cancelled: boolean;
  text?: string;
  format?: string;
}