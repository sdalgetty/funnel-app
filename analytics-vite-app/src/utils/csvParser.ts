/**
 * CSV Parser Utility
 * Handles parsing CSV files and mapping to our data structures
 */

export interface CSVRow {
  [key: string]: string;
}

export interface CSVParseResult {
  headers: string[];
  rows: CSVRow[];
  errors: string[];
}

/**
 * Parse a CSV file into structured data
 */
export function parseCSV(csvText: string): CSVParseResult {
  const errors: string[] = [];
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    errors.push('CSV file is empty');
    return { headers: [], rows: [], errors };
  }

  // Parse headers (first line)
  const headers = parseCSVLine(lines[0]);
  
  if (headers.length === 0) {
    errors.push('CSV file has no headers');
    return { headers: [], rows: [], errors };
  }

  // Parse data rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue; // Skip empty rows
    
    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    rows.push(row);
  }

  return { headers, rows, errors };
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  values.push(current);
  
  return values;
}

/**
 * Convert a value to a number (handles currency, percentages, etc.)
 */
export function parseNumber(value: string): number | null {
  if (!value || value.trim() === '') return null;
  
  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[$,\s%]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? null : num;
}

/**
 * Convert a value to cents (from dollars)
 */
export function parseCents(value: string): number | null {
  const num = parseNumber(value);
  return num !== null ? Math.round(num * 100) : null;
}

/**
 * Parse a date string (handles various formats including Honeybook formats)
 * Honeybook formats:
 * - Leads report: "MMM DD, YYYY" (e.g., "Jun 30, 2025")
 * - Booked Client report: "YYYY-MM-DD HH:MM:SS UTC" (e.g., "2025-01-18 13:38:59 UTC")
 */
export function parseDate(dateString: string): string | null {
  if (!dateString || dateString.trim() === '' || dateString.trim().toUpperCase() === 'TBD') {
    return null;
  }
  
  // Try to parse various date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC$/, // YYYY-MM-DD HH:MM:SS UTC (Honeybook Booked Client format)
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^[A-Za-z]{3} \d{1,2}, \d{4}$/, // MMM DD, YYYY (Honeybook Leads format)
  ];
  
  let date: Date | null = null;
  
  // Try ISO format first
  if (formats[0].test(dateString)) {
    date = new Date(dateString);
  } else if (formats[1].test(dateString)) {
    // YYYY-MM-DD HH:MM:SS UTC (Honeybook Booked Client format)
    // Remove " UTC" and parse
    date = new Date(dateString.replace(' UTC', ''));
  } else if (formats[2].test(dateString)) {
    // MM/DD/YYYY
    const [month, day, year] = dateString.split('/');
    date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  } else if (formats[3].test(dateString)) {
    // MM-DD-YYYY
    const [month, day, year] = dateString.split('-');
    date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  } else if (formats[4].test(dateString)) {
    // YYYY/MM/DD
    date = new Date(dateString.replace(/\//g, '-'));
  } else if (formats[5].test(dateString)) {
    // MMM DD, YYYY (Honeybook Leads format: "Jun 30, 2025")
    // Native Date parsing handles this format well
    date = new Date(dateString);
  } else {
    // Try native Date parsing as fallback
    date = new Date(dateString);
  }
  
  if (date && !isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
  }
  
  return null;
}

/**
 * Find the best matching column name (case-insensitive, partial match)
 */
export function findColumn(headers: string[], searchTerms: string[]): string | null {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  
  for (const term of searchTerms) {
    const lowerTerm = term.toLowerCase().trim();
    
    // Exact match
    const exactIndex = lowerHeaders.indexOf(lowerTerm);
    if (exactIndex !== -1) return headers[exactIndex];
    
    // Partial match (contains)
    const partialIndex = lowerHeaders.findIndex(h => h.includes(lowerTerm) || lowerTerm.includes(h));
    if (partialIndex !== -1) return headers[partialIndex];
  }
  
  return null;
}

