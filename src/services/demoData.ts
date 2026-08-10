const PRODUCTS = [
  'SmartPhone X', 'Laptop Pro', 'Wireless Earbuds', 'SmartWatch 3',
  'Tablet Air', 'Bluetooth Speaker', 'USB-C Hub', 'Laptop Stand',
  'Mechanical Keyboard', 'Wireless Mouse', 'Monitor 27"', 'Webcam HD',
  'External SSD', 'Power Bank 20K', 'Desk Lamp LED', 'Ergonomic Chair',
  'Standing Desk', 'Noise Headphones', 'Smart Home Hub', 'Fitness Tracker'
];

const CATEGORIES = [
  'Electronics', 'Electronics', 'Electronics', 'Electronics',
  'Electronics', 'Electronics', 'Accessories', 'Accessories',
  'Accessories', 'Accessories', 'Accessories', 'Accessories',
  'Storage', 'Accessories', 'Home Office', 'Furniture',
  'Furniture', 'Audio', 'Smart Home', 'Wearables'
];

const REGIONS = ['North', 'South', 'East', 'West', 'Central'];
const SALES_CHANNELS = ['Online', 'Retail', 'Wholesale', 'Partner'];
const CUSTOMERS = [
  'Acme Corp', 'Globex Inc', 'Initech', 'Umbrella Co', 'Cyberdyne',
  'Wayne Enterp', 'Stark Ind', 'Oscorp', 'Massive Corp', 'Hooli',
  'Aperture Sci', 'Oceanic Air', 'Dunder Mifflin', 'Sterling Co', 'Wonka Ind',
  'Nakatomi Inc', 'Tyrell Corp', 'Weyland Corp', 'Soylent Corp', 'Delos Inc'
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface DemoRow {
  Date: string;
  'Order ID': string;
  Customer: string;
  Region: string;
  Product: string;
  Category: string;
  Quantity: number;
  'Unit Price': number;
  Revenue: number;
  Cost: number;
  Profit: number;
  'Sales Channel': string;
}

export function generateDemoData(rows = 500): DemoRow[] {
  const data: DemoRow[] = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2025-06-30');

  const productPrices: Record<string, number> = {};
  const productCosts: Record<string, number> = {};
  PRODUCTS.forEach((p, i) => {
    productPrices[p] = randomFloat(15, 1999, 2);
    productCosts[p] = randomFloat(5, productPrices[p] * 0.7, 2);
  });

  for (let i = 1; i <= rows; i++) {
    const product = pick(PRODUCTS);
    const price = productPrices[product];
    const cost = productCosts[product];
    const qty = randomInt(1, 50);
    const revenue = parseFloat((price * qty).toFixed(2));
    const totalCost = parseFloat((cost * qty).toFixed(2));
    const profit = parseFloat((revenue - totalCost).toFixed(2));

    data.push({
      Date: randomDate(startDate, endDate),
      'Order ID': `ORD-${String(2023000 + i).padStart(7, '0')}`,
      Customer: pick(CUSTOMERS),
      Region: pick(REGIONS),
      Product: product,
      Category: PRODUCTS.indexOf(product) < CATEGORIES.length ? CATEGORIES[PRODUCTS.indexOf(product)] : pick(CATEGORIES),
      Quantity: qty,
      'Unit Price': price,
      Revenue: revenue,
      Cost: totalCost,
      Profit: profit,
      'Sales Channel': pick(SALES_CHANNELS),
    });
  }

  return data.sort((a, b) => a.Date.localeCompare(b.Date));
}

export const DEMO_DATASET_META = {
  name: 'Retail Sales Demo',
  description: 'A realistic retail sales dataset with products, regions, and financial metrics across 2023-2025.',
  fileName: 'retail_sales_demo.csv',
  fileType: 'csv',
};