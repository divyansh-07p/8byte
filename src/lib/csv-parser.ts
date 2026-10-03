import { RawHolding } from '@/types/portfolio';

export function parseCSV(csvContent: string): RawHolding[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const holdings: RawHolding[] = [];
  let currentSector = '';
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    if (values.length < headers.length) continue;
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    const particulars = row['Particulars']?.trim();
    const no = row['No']?.trim();
    const purchasePrice = row['Purchase Price']?.trim();
    const investment = row['Investment']?.trim();
    
    const isSectorHeader = (!no || isNaN(parseInt(no))) && particulars && investment && !purchasePrice;
    
    if (isSectorHeader) {
      currentSector = particulars.replace(' Sector', '').trim();
      continue;
    }
    
    if (!no || isNaN(parseInt(no))) continue;
    
    const holding: RawHolding = {
      no: no,
      particulars: particulars || '',
      purchasePrice: parseFloat(row['Purchase Price']?.replace(/,/g, '') || '0'),
      qty: parseInt(row['Qty']?.replace(/,/g, '') || '0'),
      investment: parseFloat(row['Investment']?.replace(/,/g, '') || '0'),
      portfolioPercent: parseFloat(row['Portfolio (%)']?.replace(/,/g, '').replace('%', '') || '0'),
      nseBse: row['NSE/BSE']?.trim() || '',
      cmp: parseFloat(row['CMP']?.replace(/,/g, '') || '0'),
      presentValue: parseFloat(row['Present value']?.replace(/,/g, '') || '0'),
      gainLoss: parseFloat(row['Gain/Loss']?.replace(/,/g, '') || '0'),
      gainLossPercent: parseFloat(row['Gain/Loss (%)']?.replace(/,/g, '').replace('%', '') || '0'),
      marketCap: row['Market Cap']?.trim() || '',
      peRatio: row['P/E (TTM)']?.trim() || '',
      latestEarnings: row['Latest Earnings']?.trim() || '',
      revenueTTM: row['Revenue (TTM)']?.trim() || '',
      ebitdaTTM: row['EBITDA (TTM)']?.trim() || '',
      ebitdaPercent: row['EBITDA (%)']?.trim() || '',
      pat: row['PAT']?.trim() || '',
      patPercent: row['PAT (%)']?.trim() || '',
      cfoMarch24: row['CFO (March 24)']?.trim() || '',
      cfo5Years: row['CFO (5 years)']?.trim() || '',
      freeCashFlow5Years: row['Free Cash Flow (5 years)']?.trim() || '',
      debtToEquity: row['Debt to Equity']?.trim() || '',
      bookValue: row['Book Value']?.trim() || '',
      revenue: row['Revenue']?.trim() || '',
      ebitda: row['EBITDA']?.trim() || '',
      profit: row['Profit']?.trim() || '',
      marketCap2: row['Market Cap']?.trim() || '',
      priceToSales: row['Price to Sales']?.trim() || '',
      cfoToEbitda: row['CFO to EBITDA']?.trim() || '',
      cfoToPat: row['CFO to PAT']?.trim() || '',
      priceToBook: row['Price to book']?.trim() || '',
      stage2: row['Stage-2']?.trim() || '',
      salePrice: row['Sale price']?.trim() || '',
      abhishek: row['Abhishek']?.trim() || '',
      sector: currentSector,
    };
    
    holdings.push(holding);
  }
  
  return holdings;
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

export function normalizeSymbol(nseBse: string, name: string): string {
  const symbol = nseBse.trim();
  if (!symbol) return name.toUpperCase().replace(/\s+/g, '');
  
  if (symbol.startsWith('5') && symbol.length === 6) {
    return symbol;
  }
  
  return symbol.toUpperCase();
}

export function parseNumber(value: string): number | null {
  if (!value || value === '#N/A' || value === '#VALUE!' || value === '#DIV/0!') return null;
  const cleaned = value.replace(/,/g, '').replace('%', '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}