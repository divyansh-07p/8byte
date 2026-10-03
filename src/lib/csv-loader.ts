import * as fs from 'fs';
import * as path from 'path';
import { RawHolding } from '@/types/portfolio';
import { parseCSVLine } from './csv-parser';

export function loadPortfolioFromCSV(): RawHolding[] {
  // Try multiple possible locations for the CSV file
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'portfolio-data.csv'),
    path.join(process.cwd(), '..', '..', 'F9001561_ADDBA737E8_B72562937A.csv'),
    path.join(process.cwd(), 'portfolio-data.csv'),
  ];
  
  let csvContent = '';
  let found = false;
  
  for (const csvPath of possiblePaths) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ csvPath)) {
        csvContent = fs.readFileSync(/*turbopackIgnore: true*/ csvPath, 'utf-8');
        found = true;
        break;
      }
    } catch {
      // Continue to next path
    }
  }
  
  if (!found) {
    console.warn('CSV file not found, using fallback data');
    return getFallbackData();
  }
  
  return parseCSVFromFile(csvContent);
}

function parseCSVFromFile(csvContent: string): RawHolding[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Find the header row (skip the first row which is metadata)
  let headerRowIndex = 1;
  const headers = lines[headerRowIndex].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const holdings: RawHolding[] = [];
  let currentSector = '';
  
  for (let i = headerRowIndex + 1; i < lines.length; i++) {
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
      currentSector = particulars.replace(' Sector', '').replace(' ', '').trim();
      if (currentSector === 'Consumer') currentSector = 'Consumer';
      if (currentSector === 'Power') currentSector = 'Power';
      if (currentSector === 'Pipe') currentSector = 'Pipe Sector';
      if (currentSector === 'Others') currentSector = 'Others';
      continue;
    }
    
    if (!no || isNaN(parseInt(no))) continue;
    if (particulars === 'Grand Total' || particulars === 'Sold Price') continue;
    
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

function getFallbackData(): RawHolding[] {
  // Return minimal fallback data if CSV is not available
  return [];
}

export function getSectorFromHoldings(holdings: RawHolding[]): string[] {
  const sectors = new Set<string>();
  holdings.forEach(h => {
    if (h.sector) sectors.add(h.sector);
  });
  return Array.from(sectors);
}