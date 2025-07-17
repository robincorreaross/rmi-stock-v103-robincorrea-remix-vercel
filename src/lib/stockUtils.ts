import { StockItem, ExportData } from '@/types/stock';

export function formatDateTime(date: Date): { date: string; time: string } {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return {
    date: `${year}${month}${day}`,
    time: `${hours}${minutes}${seconds}`
  };
}

export function convertToExportFormat(items: StockItem[]): string {
  const exportLines = items.map(item => {
    const { date, time } = formatDateTime(item.timestamp);
    return `${date};${item.barcode};${time};${item.quantity}`;
  });

  return exportLines.join('\n');
}

export function generateFileName(): string {
  const now = new Date();
  const { date, time } = formatDateTime(now);
  return `contagem_estoque_${date}_${time}.txt`;
}

export function formatDisplayDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}