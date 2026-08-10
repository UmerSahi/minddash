import type { Dataset, ColumnInfo, ColumnType, DatasetProfile } from '../types';
import { v4 as uuid } from 'uuid';

export interface ParseResult {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

export function parseCSV(csvText: string): ParseResult {

  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row.');
  }

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;
    if (values.length < headers.length) {
      // Pad missing values
      while (values.length < headers.length) values.push('');
    }
    const row: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() ?? '';
    });
    rows.push(row);
  }

  return { headers, rows, totalRows: rows.length };
}

function parseCSVLine(line: string): string[] {
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

export function detectType(values: unknown[]): ColumnType {
  const nonEmpty = values.filter(v => v !== '' && v !== null && v !== undefined);
  if (nonEmpty.length === 0) return 'text';

  // Check boolean first
  const bools = nonEmpty.filter(v =>
    ['true', 'false', 'yes', 'no', '0', '1'].includes(String(v).toLowerCase())
  );
  if (bools.length / nonEmpty.length > 0.9) return 'boolean';

  // Check date
  const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$|^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/;
  const dates = nonEmpty.filter(v => datePattern.test(String(v)) || !isNaN(Date.parse(String(v))));
  if (dates.length / nonEmpty.length > 0.8) return 'date';

  // Check numeric
  const nums = nonEmpty.filter(v => !isNaN(Number(v)) && String(v).trim() !== '');
  if (nums.length / nonEmpty.length > 0.8) return 'numeric';

  return 'categorical';
}

export function analyzeColumn(name: string, values: unknown[]): ColumnInfo {
  const nonEmpty = values.filter(v => v !== '' && v !== null && v !== undefined);
  const type = detectType(values);
  const missingCount = values.length - nonEmpty.length;
  const uniqueValues = new Set(nonEmpty.map(v => String(v)));
  const sampleValues = Array.from(uniqueValues).slice(0, 5);

  const info: ColumnInfo = {
    name,
    type,
    nullable: missingCount > 0,
    missingCount,
    uniqueCount: uniqueValues.size,
    sampleValues,
  };

  if (type === 'numeric') {
    const nums = nonEmpty.map(v => Number(v)).filter(n => !isNaN(n));
    if (nums.length > 0) {
      info.min = Math.min(...nums);
      info.max = Math.max(...nums);
      info.mean = parseFloat((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      info.median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      info.sum = parseFloat(nums.reduce((a, b) => a + b, 0).toFixed(2));
      // Std dev
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const sqDiffs = nums.map(v => Math.pow(v - mean, 2));
      info.stdDev = parseFloat(Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
    }
  }

  return info;
}

export function createProfile(headers: string[], rows: Record<string, unknown>[]): DatasetProfile {
  const columns: Record<string, unknown[]> = {};
  headers.forEach(h => {
    columns[h] = rows.map(r => r[h]);
  });

  const columnInfo: Record<string, ColumnInfo> = {};
  const numericColumns: string[] = [];
  const categoricalColumns: string[] = [];
  const dateColumns: string[] = [];
  const booleanColumns: string[] = [];
  const textColumns: string[] = [];
  const missingValues: Record<string, number> = {};

  headers.forEach(h => {
    const info = analyzeColumn(h, columns[h]);
    columnInfo[h] = info;
    missingValues[h] = info.missingCount;

    // Heuristic: if >50% unique values and numeric-like name, it's likely an ID
    const idHeuristic = /id|code|sku|number$/i.test(h);
    const isNumericName = /revenue|profit|cost|price|amount|quantity|count|sales|rate|margin|income|expense|value|total|sum|score/i.test(h);

    if (info.type === 'numeric' && !idHeuristic && info.uniqueCount > 1) {
      numericColumns.push(h);
      info.isMetric = true;
    } else if (info.type === 'numeric' && isNumericName) {
      numericColumns.push(h);
      info.isMetric = true;
    } else if (info.type === 'date') {
      dateColumns.push(h);
      info.isDate = true;
    } else if (info.type === 'boolean') {
      booleanColumns.push(h);
    } else if (info.type === 'categorical' && info.uniqueCount < rows.length * 0.5) {
      categoricalColumns.push(h);
      info.isDimension = true;
    } else {
      textColumns.push(h);
    }
  });

  return {
    rowCount: rows.length,
    columnCount: headers.length,
    numericColumns,
    categoricalColumns,
    dateColumns,
    booleanColumns,
    textColumns,
    missingValues,
    columnInfo,
  };
}

export function processDataset(
  name: string,
  description: string,
  csvText: string,
  userId: string
): Dataset {
  const { headers, rows, totalRows } = parseCSV(csvText);
  const profile = createProfile(headers, rows);

  const dataset: Dataset = {
    id: uuid(),
    userId,
    name,
    description,
    fileName: `${name.replace(/\s+/g, '_').toLowerCase()}.csv`,
    fileType: 'csv',
    rowCount: totalRows,
    columnCount: headers.length,
    columns: headers.map(h => profile.columnInfo[h] || { name: h, type: 'text', nullable: false, missingCount: 0, uniqueCount: 0, sampleValues: [] }),
    data: rows,
    originalData: [...rows],
    profile,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return dataset;
}

export function processUploadedFile(
  file: File,
  userId: string
): Promise<Dataset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const name = file.name.replace(/\.csv$/i, '').replace(/[-_]/g, ' ');
        const dataset = processDataset(name, `Uploaded from ${file.name}`, text, userId);
        resolve(dataset);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}