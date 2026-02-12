/**
 * Utility to parse Excel (.xlsx, .xls) and CSV files into Product data
 */
import * as XLSX from 'xlsx';
import type { Product, ProductImage, ProductFeature, LongDescription, ProductDelivery } from './types';

export interface ParsedProduct extends Omit<Product, 'id'> {}

export interface ParseResult {
  products: ParsedProduct[];
  errors: string[];
  warnings: string[];
}

/**
 * Column name mappings - supports various naming conventions
 */
const columnMappings: Record<string, keyof ParsedProduct | 'gallery' | 'colorsRaw' | 'sizesRaw' | 'sizePricesRaw' | 'featuresRaw' | 'specsRaw' | 'longDescRaw' | 'deliveryRaw' | 'highlightsRaw'> = {
  // Title variations
  'title': 'title',
  'name': 'title',
  'product name': 'title',
  'product_name': 'title',
  'productname': 'title',
  
  // Category
  'category': 'categoryId',
  'categoryid': 'categoryId',
  'category_id': 'categoryId',
  'category id': 'categoryId',
  
  // Brand
  'brand': 'brand',
  'manufacturer': 'brand',
  'brand origin': 'brandOrigin',
  'brand_origin': 'brandOrigin',
  'brandorigin': 'brandOrigin',
  'origin': 'brandOrigin',
  'country of origin': 'brandOrigin',
  'country_of_origin': 'brandOrigin',
  
  // Star / featured
  'star': 'star',
  'featured': 'star',
  'starred': 'star',
  
  // Model
  'model': 'model',
  'model number': 'model',
  'model_number': 'model',
  
  // Slug
  'slug': 'slug',
  'url': 'slug',
  'permalink': 'slug',
  
  // Description variations
  'description': 'description',
  'short description': 'shortDescription',
  'short_description': 'shortDescription',
  'shortdescription': 'shortDescription',
  'brief': 'shortDescription',
  'summary': 'shortDescription',
  'full description': 'full_description',
  'full_description': 'full_description',
  'fulldescription': 'full_description',
  'long description': 'longDescRaw',
  'long_description': 'longDescRaw',
  'longdescription': 'longDescRaw',
  'details': 'details',
  
  // Pricing
  'price': 'price',
  'regular price': 'price',
  'regular_price': 'price',
  'discount price': 'discountPrice',
  'discount_price': 'discountPrice',
  'discountprice': 'discountPrice',
  'sale price': 'discountPrice',
  'sale_price': 'discountPrice',
  'saleprice': 'discountPrice',
  'currency': 'currency',
  
  // Images
  'image': 'thumb_src',
  'thumb': 'thumb_src',
  'thumbnail': 'thumb_src',
  'thumb_src': 'thumb_src',
  'cover': 'thumb_src',
  'main image': 'thumb_src',
  'main_image': 'thumb_src',
  'thumb alt': 'thumb_alt',
  'thumb_alt': 'thumb_alt',
  'image alt': 'thumb_alt',
  'gallery': 'gallery',
  'images': 'gallery',
  'additional images': 'gallery',
  'additional_images': 'gallery',
  'video': 'videoUrl',
  'video url': 'videoUrl',
  'video_url': 'videoUrl',
  'video poster': 'videoPoster',
  'video_poster': 'videoPoster',
  
  // Stock
  'stock': 'stock',
  'in stock': 'stock',
  'in_stock': 'stock',
  'available': 'stock',
  'availability': 'stock',
  'status': 'status',
  
  // Colors
  'color': 'color',
  'colour': 'color',
  'colors': 'colorsRaw',
  'colours': 'colorsRaw',
  'available colors': 'colorsRaw',
  'available_colors': 'colorsRaw',
  
  // Sizes
  'size': 'size',
  'sizes': 'sizesRaw',
  'available sizes': 'sizesRaw',
  'available_sizes': 'sizesRaw',
  'size prices': 'sizePricesRaw',
  'size_prices': 'sizePricesRaw',
  'sizeprices': 'sizePricesRaw',
  
  // Rating/Reviews
  'rating': 'rating',
  'reviews': 'reviews',
  'review count': 'reviews',
  'review_count': 'reviews',
  
  // Features & Specs
  'features': 'featuresRaw',
  'highlights': 'highlightsRaw',
  'specifications': 'specsRaw',
  'specs': 'specsRaw',
  
  // Delivery
  'delivery': 'deliveryRaw',
  'delivery time': 'deliveryRaw',
  'delivery_time': 'deliveryRaw',
  
  // Admin
  'resource': 'resource',
};

/**
 * Parse a file (Excel or CSV) and return product data
 */
export async function parseProductFile(file: File): Promise<ParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const products: ParsedProduct[] = [];
  
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { products: [], errors: ['No sheets found in the file'], warnings: [] };
    }
    
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    
    if (rows.length === 0) {
      return { products: [], errors: ['No data rows found in the file'], warnings: [] };
    }
    
    // Get headers and map them
    const firstRow = rows[0];
    const headerMapping: Record<string, keyof ParsedProduct | 'gallery' | 'colorsRaw' | 'sizesRaw' | 'sizePricesRaw' | 'featuresRaw' | 'specsRaw' | 'longDescRaw' | 'deliveryRaw' | 'highlightsRaw'> = {};
    
    for (const key of Object.keys(firstRow)) {
      const normalizedKey = key.toLowerCase().trim();
      if (columnMappings[normalizedKey]) {
        headerMapping[key] = columnMappings[normalizedKey];
      } else {
        warnings.push(`Unknown column "${key}" will be ignored`);
      }
    }
    
    // Process each row
    rows.forEach((row, index) => {
      try {
        const product = parseRow(row, headerMapping, index + 2); // +2 for 1-indexed + header row
        if (product) {
          products.push(product);
        }
      } catch (e) {
        errors.push(`Row ${index + 2}: ${e instanceof Error ? e.message : String(e)}`);
      }
    });
    
  } catch (e) {
    errors.push(`Failed to parse file: ${e instanceof Error ? e.message : String(e)}`);
  }
  
  return { products, errors, warnings };
}

/**
 * Parse a single row into a product
 */
function parseRow(
  row: Record<string, unknown>,
  headerMapping: Record<string, string>,
  rowNum: number
): ParsedProduct | null {
  const product: Partial<ParsedProduct> = {
    stock: true,
    colors: [],
    sizes: {},
    images: [],
  };
  
  let gallery: string[] = [];
  let colorsRaw = '';
  let sizesRaw = '';
  let sizePricesRaw = '';
  let featuresRaw = '';
  let specsRaw = '';
  let longDescRaw = '';
  let deliveryRaw = '';
  let highlightsRaw = '';
  
  for (const [originalKey, mappedKey] of Object.entries(headerMapping)) {
    const value = row[originalKey];
    if (value === undefined || value === null || value === '') continue;
    
    const strValue = String(value).trim();
    
    switch (mappedKey) {
      case 'title':
        product.title = strValue;
        break;
      case 'categoryId':
        product.categoryId = strValue;
        break;
      case 'brand':
        product.brand = strValue;
        break;
      case 'model':
        product.model = strValue;
        break;
      case 'brandOrigin':
        product.brandOrigin = strValue;
        break;
      case 'star':
        product.star = parseBoolean(strValue);
        break;
      case 'slug':
        product.slug = strValue;
        break;
      case 'description':
      case 'shortDescription':
        product.shortDescription = strValue;
        product.description = strValue;
        break;
      case 'full_description':
        product.full_description = strValue;
        break;
      case 'details':
        product.details = strValue;
        break;
      case 'price':
        const price = parseFloat(strValue);
        if (!isNaN(price)) product.price = price;
        break;
      case 'discountPrice':
        const discountPrice = parseFloat(strValue);
        if (!isNaN(discountPrice)) product.discountPrice = discountPrice;
        break;
      case 'currency':
        product.currency = strValue;
        break;
      case 'thumb_src':
        product.thumb_src = strValue;
        break;
      case 'thumb_alt':
        product.thumb_alt = strValue;
        break;
      case 'videoUrl':
        product.videoUrl = strValue;
        break;
      case 'videoPoster':
        product.videoPoster = strValue;
        break;
      case 'gallery':
        // Can be comma/newline separated or JSON array
        gallery = parseStringList(strValue);
        break;
      case 'stock':
        product.stock = parseBoolean(strValue);
        break;
      case 'status':
        product.status = strValue;
        break;
      case 'color':
        product.color = strValue;
        break;
      case 'colorsRaw':
        colorsRaw = strValue;
        break;
      case 'size':
        product.size = strValue;
        break;
      case 'sizesRaw':
        sizesRaw = strValue;
        break;
      case 'sizePricesRaw':
        sizePricesRaw = strValue;
        break;
      case 'rating':
        const rating = parseFloat(strValue);
        if (!isNaN(rating)) product.rating = rating;
        break;
      case 'reviews':
        const reviews = parseInt(strValue, 10);
        if (!isNaN(reviews)) product.reviews = reviews;
        break;
      case 'featuresRaw':
        featuresRaw = strValue;
        break;
      case 'highlightsRaw':
        highlightsRaw = strValue;
        break;
      case 'specsRaw':
        specsRaw = strValue;
        break;
      case 'longDescRaw':
        longDescRaw = strValue;
        break;
      case 'deliveryRaw':
        deliveryRaw = strValue;
        break;
      case 'resource':
        product.resource = strValue;
        break;
    }
  }
  
  // Validate required fields
  if (!product.title) {
    throw new Error('Missing required field: title');
  }
  if (product.price === undefined || product.price === null) {
    throw new Error('Missing required field: price');
  }
  if (!product.thumb_src) {
    product.thumb_src = ''; // Allow empty but set default
  }
  
  // Process gallery images
  if (gallery.length > 0) {
    product.images = gallery.map(src => ({ src, alt: '' }));
  }
  
  // Process colors
  if (colorsRaw) {
    product.colors = parseStringList(colorsRaw);
  }
  
  // Process sizes (format: "S, M, L" or "S:5, M:10, L:3")
  if (sizesRaw) {
    product.sizes = parseSizes(sizesRaw);
  }
  
  // Process size prices (format: "S:10, M:12, L:14")
  if (sizePricesRaw) {
    product.sizePrices = parseSizePrices(sizePricesRaw);
  }
  
  // Process features (JSON array or comma-separated)
  if (featuresRaw) {
    product.features = parseFeatures(featuresRaw);
  }
  
  // Process highlights
  if (highlightsRaw) {
    product.highlights = parseStringList(highlightsRaw);
  }
  
  // Process specifications (JSON object)
  if (specsRaw) {
    product.specifications = parseJsonObject(specsRaw);
  }
  
  // Process long description (JSON object)
  if (longDescRaw) {
    product.longDescription = parseJsonObject(longDescRaw) as LongDescription;
  }
  
  // Process delivery (JSON object or simple string)
  if (deliveryRaw) {
    const delivery = parseDelivery(deliveryRaw);
    if (delivery) product.delivery = delivery;
  }
  
  return product as ParsedProduct;
}

/**
 * Parse comma/newline separated string or JSON array into array
 */
function parseStringList(value: string): string[] {
  // Try JSON first
  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(s => String(s).trim()).filter(Boolean);
      }
    } catch {
      // Fall through to comma parsing
    }
  }
  
  // Split by comma or newline
  return value
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Parse boolean from various string representations
 */
function parseBoolean(value: string): boolean {
  const lower = value.toLowerCase();
  return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'in stock' || lower === 'available';
}

/**
 * Parse sizes string into Record<string, number>
 * Supports: "S, M, L" or "S:5, M:10, L:3"
 */
function parseSizes(value: string): Record<string, number> {
  const sizes: Record<string, number> = {};
  const parts = value.split(',').map(s => s.trim()).filter(Boolean);
  
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx > 0) {
      const size = part.slice(0, colonIdx).trim();
      const qty = parseInt(part.slice(colonIdx + 1).trim(), 10);
      sizes[size] = isNaN(qty) ? 0 : qty;
    } else {
      sizes[part] = 0;
    }
  }
  
  return sizes;
}

/**
 * Parse size prices string into Record<string, number>
 * Format: "S:10, M:12, L:14"
 */
function parseSizePrices(value: string): Record<string, number> {
  const prices: Record<string, number> = {};
  const parts = value.split(',').map(s => s.trim()).filter(Boolean);
  
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx > 0) {
      const size = part.slice(0, colonIdx).trim();
      const price = parseFloat(part.slice(colonIdx + 1).trim());
      if (!isNaN(price)) prices[size] = price;
    }
  }
  
  return prices;
}

/**
 * Parse features - can be JSON array or comma-separated
 */
function parseFeatures(value: string): (string | ProductFeature)[] {
  // Try JSON first
  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Fall through
    }
  }
  
  // Comma-separated strings
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse JSON object safely
 */
function parseJsonObject(value: string): Record<string, unknown> | undefined {
  if (value.startsWith('{')) {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Parse delivery info - JSON object or simple string
 */
function parseDelivery(value: string): ProductDelivery | undefined {
  // Try JSON first
  if (value.startsWith('{')) {
    try {
      return JSON.parse(value) as ProductDelivery;
    } catch {
      // Fall through
    }
  }
  
  // Simple string becomes delivery time
  return { deliveryTime: value };
}

/**
 * Escape a single CSV field (quote if contains comma, newline, or double-quote)
 */
function escapeCSVField(value: string): string {
  const needsQuotes = /[,"\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

/**
 * Generate a sample CSV template with proper quoting so commas in descriptions don't break parsing.
 * Required columns: title, price. category must be a Firestore category ID (see Admin > Categories).
 */
export function generateSampleCSV(): string {
  const headers = [
    'title',
    'category',
    'description',
    'brand',
    'brand_origin',
    'star',
    'model',
    'slug',
    'price',
    'discount_price',
    'currency',
    'image',
    'thumb_alt',
    'video_url',
    'video_poster',
    'gallery',
    'stock',
    'color',
    'colors',
    'sizes',
    'size_prices',
    'highlights',
    'features',
    'specifications',
    'resource',
  ];

  const sampleRow = [
    'Sample Product',
    'YOUR_CATEGORY_ID',
    'Short description for the product. Use commas; they are safe inside quoted fields.',
    'Brand Name',
    'China',
    'yes',
    'Model ABC',
    'sample-product',
    '100',
    '80',
    'BDT',
    'https://example.com/image.jpg',
    'Sample product image',
    '',
    '',
    'https://example.com/img1.jpg, https://example.com/img2.jpg',
    'yes',
    'Blue',
    'red, blue, green',
    'S:10, M:20, L:15',
    'S:100, M:110, L:120',
    'Highlight one, Highlight two',
    'Feature 1, Feature 2, Feature 3',
    '{"material":"Cotton","weight":"200g"}',
    'admin notes (optional)',
  ];

  const headerLine = headers.map(escapeCSVField).join(',');
  const dataLine = sampleRow.map(escapeCSVField).join(',');
  return [headerLine, dataLine].join('\n');
}

/**
 * Download template as CSV file
 */
export function downloadTemplate(): void {
  const csv = generateSampleCSV();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'product-import-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}
