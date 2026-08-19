// Simulated Database Layer (localStorage persistence) for Shubham Krishi Sewa Kendra PWA
import { BUSINESS_CONFIG, BUSINESS_INFO } from '../config/business';
import { supabase } from '../config/supabase';


// Normalization helpers for consistent bulk upload matches
export const normalizeProductName = (name: string): string => {
  if (!name) return "";
  return name.trim().replace(/\s+/g, " ").toLowerCase();
};

export const normalizeCompanyName = (company: string): string => {
  if (!company) return "";
  return company.trim().replace(/\s+/g, " ").toLowerCase();
};

export const normalizeVariantName = (packSize: string, unit: string): string => {
  return (packSize + unit).replace(/\s+/g, "").toLowerCase();
};

export function getDealerAuthEmail(mobileNumber: string): string {
  if (!mobileNumber) return "";
  const cleanMobile = mobileNumber
    .replace(/\s+/g, '')
    .replace(/\+91/g, '')
    .replace(/-/g, '')
    .replace(/\D/g, '');
  const normalized = cleanMobile.slice(-10);
  return `dealer-${normalized}@shubhamkrishisewa.com`;
}

export const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

export const alignFieldsToHeaders = (
  fields: string[],
  normalizedHeaders: string[],
  companiesList: any[]
): string[] => {
  const aligned = new Array(normalizedHeaders.length).fill("");
  
  const nameIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.PRODUCT_NAME);
  const brandIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.COMPANY);
  const catIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.CATEGORY);
  const descIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.DESCRIPTION);
  const techIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.TECH_SPECS);
  const skuIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.SKU);
  const varIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.VARIANT_NAME);
  const packIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.PACK_SIZE);
  const unitIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.UNIT);
  const imgIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.IMAGE_FILE);
  const statusIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.STATUS);
  const priceIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.PRICE);

  const companyNames = new Set(companiesList.map(c => c.name.toLowerCase()));
  const validCategories = new Set(['herbicides', 'insecticides', 'fertilizers', 'seeds', 'fungicides', 'others']);
  const validUnits = new Set(['ml', 'l', 'gm', 'kg', 'g', 'pcs', 'packets', 'bottles']);

  let remainingFields = [...fields];

  // 1. Identify Status
  let statusVal = "";
  const statusValIdx = remainingFields.findIndex(f => ['active', 'inactive', 'archived'].includes(f.toLowerCase()));
  if (statusValIdx !== -1) {
    statusVal = remainingFields[statusValIdx];
    remainingFields.splice(statusValIdx, 1);
  }

  // 2. Identify Unit
  let unitVal = "";
  const unitValIdx = remainingFields.findIndex(f => validUnits.has(f.toLowerCase()));
  if (unitValIdx !== -1) {
    unitVal = remainingFields[unitValIdx];
    remainingFields.splice(unitValIdx, 1);
  }

  // 3. Identify Pack Size
  let packVal = "";
  const packValIdx = remainingFields.findIndex(f => /^\d+(\.\d+)?$/.test(f));
  if (packValIdx !== -1) {
    packVal = remainingFields[packValIdx];
    remainingFields.splice(packValIdx, 1);
  }

  // 4. Identify Category
  let catVal = "";
  const catValIdx = remainingFields.findIndex(f => validCategories.has(f.toLowerCase()));
  if (catValIdx !== -1) {
    catVal = remainingFields[catValIdx];
    remainingFields.splice(catValIdx, 1);
  }

  // 5. Identify Company
  let brandVal = "";
  const brandValIdx = remainingFields.findIndex(f => companyNames.has(f.toLowerCase()));
  if (brandValIdx !== -1) {
    brandVal = remainingFields[brandValIdx];
    remainingFields.splice(brandValIdx, 1);
  }

  // 6. Identify Product Name
  let nameVal = "";
  if (remainingFields.length > 0) {
    nameVal = remainingFields[0];
    remainingFields.shift();
  }

  // 7. Identify Price
  let priceVal = "";
  const priceValIdx = remainingFields.findIndex(f => {
    let p = f.trim();
    if (p.startsWith('₹')) p = p.substring(1).trim();
    if (p.endsWith('₹')) p = p.substring(0, p.length - 1).trim();
    if (p.toLowerCase().endsWith('inr')) p = p.substring(0, p.length - 3).trim();
    return /^\d+(\.\d+)?$/.test(p);
  });
  if (priceValIdx !== -1) {
    priceVal = remainingFields[priceValIdx];
    remainingFields.splice(priceValIdx, 1);
  }

  // 8. Identify Variant Name
  let varVal = "";
  const varValIdx = remainingFields.findIndex(f => /\d+\s*[a-zA-Z]+/.test(f) && f.length < 15);
  if (varValIdx !== -1) {
    varVal = remainingFields[varValIdx];
    remainingFields.splice(varValIdx, 1);
  }

  // 9. Identify SKU
  let skuVal = "";
  const skuValIdx = remainingFields.findIndex(f => f.length < 25 && /[a-zA-Z0-9\-_]{3,}/.test(f));
  if (skuValIdx !== -1) {
    skuVal = remainingFields[skuValIdx];
    remainingFields.splice(skuValIdx, 1);
  }

  // 10. Image File
  let imgVal = "";
  const imgValIdx = remainingFields.findIndex(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  if (imgValIdx !== -1) {
    imgVal = remainingFields[imgValIdx];
    remainingFields.splice(imgValIdx, 1);
  }

  // 11. Description and Tech specs
  let descVal = "";
  let techVal = "";
  if (remainingFields.length > 0) {
    descVal = remainingFields[0];
    remainingFields.shift();
  }
  if (remainingFields.length > 0) {
    techVal = remainingFields[0];
    remainingFields.shift();
  }

  if (nameIdx !== -1) aligned[nameIdx] = nameVal;
  if (brandIdx !== -1) aligned[brandIdx] = brandVal;
  if (catIdx !== -1) aligned[catIdx] = catVal;
  if (descIdx !== -1) aligned[descIdx] = descVal;
  if (techIdx !== -1) aligned[techIdx] = techVal;
  if (skuIdx !== -1) aligned[skuIdx] = skuVal;
  if (varIdx !== -1) aligned[varIdx] = varVal;
  if (packIdx !== -1) aligned[packIdx] = packVal;
  if (unitIdx !== -1) aligned[unitIdx] = unitVal;
  if (imgIdx !== -1) aligned[imgIdx] = imgVal;
  if (statusIdx !== -1) aligned[statusIdx] = statusVal;
  if (priceIdx !== -1) aligned[priceIdx] = priceVal;

  return aligned;
};

export const parseCSVOrFWF = (csvText: string): { headers: string[]; rows: string[][] } => {
  const cleanText = csvText.replace(/^\uFEFF/, "");
  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const cleanLineFunc = (line: string) => {
    let cleanLine = line.trim();
    if (cleanLine.endsWith(',')) {
      cleanLine = cleanLine.slice(0, -1).trim();
    }
    if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
      cleanLine = cleanLine.slice(1, -1);
    }
    return cleanLine;
  };

  const headerLine = cleanLineFunc(lines[0]);
  const isTab = headerLine.includes('\t');
  const isComma = !isTab && headerLine.includes(',');
  const isFWF = !isTab && !isComma && /\s{2,}/.test(headerLine);

  let headers: string[] = [];
  let rows: string[][] = [];

  const cleanField = (field: string) => {
    if (!field) return "";
    let f = field.trim();
    if (f.startsWith('"') && f.endsWith('"')) {
      f = f.slice(1, -1);
    }
    return f.trim().replace(/\s+/g, " ");
  };

  const companiesList: any[] = JSON.parse(localStorage.getItem('ad_companies') || '[]');

  if (isTab) {
    headers = headerLine.split('\t').map(cleanField);
    for (let i = 1; i < lines.length; i++) {
      const rawLine = cleanLineFunc(lines[i]);
      let fields = rawLine.split('\t').map(cleanField);
      if (fields.length > 0 && /^\d+$/.test(fields[0])) {
        const firstHeader = headers[0];
        if (firstHeader === CANONICAL_FIELDS.PRODUCT_NAME || 
            firstHeader === CANONICAL_FIELDS.COMPANY || 
            firstHeader === CANONICAL_FIELDS.CATEGORY || 
            firstHeader === CANONICAL_FIELDS.SKU) {
          fields.shift();
        }
      }
      rows.push(fields);
    }
  } else if (isComma) {
    headers = parseCSVLine(headerLine).map(cleanField);
    for (let i = 1; i < lines.length; i++) {
      const rawLine = cleanLineFunc(lines[i]);
      let fields = parseCSVLine(rawLine).map(cleanField);
      if (fields.length > 0 && /^\d+$/.test(fields[0])) {
        const firstHeader = headers[0];
        if (firstHeader === CANONICAL_FIELDS.PRODUCT_NAME || 
            firstHeader === CANONICAL_FIELDS.COMPANY || 
            firstHeader === CANONICAL_FIELDS.CATEGORY || 
            firstHeader === CANONICAL_FIELDS.SKU) {
          fields.shift();
        }
      }
      rows.push(fields);
    }
  } else if (isFWF) {
    // Scan headerLine to find all present columns and their positions
    const foundColumns: { canonical: string; start: number; matchedText: string }[] = [];
    const columnsToFind = [
      { canonical: CANONICAL_FIELDS.PRODUCT_NAME, aliases: ["product name", "product_name", "productname", "name"] },
      { canonical: CANONICAL_FIELDS.COMPANY, aliases: ["company", "company_name", "companyname", "brand"] },
      { canonical: CANONICAL_FIELDS.CATEGORY, aliases: ["category"] },
      { canonical: CANONICAL_FIELDS.DESCRIPTION, aliases: ["description"] },
      { canonical: CANONICAL_FIELDS.TECH_SPECS, aliases: ["technical specifications", "technical_specifications", "technicalspecifications", "tech_specs", "techspecs", "tech specs"] },
      { canonical: CANONICAL_FIELDS.SKU, aliases: ["sku", "sku_code", "skucode"] },
      { canonical: CANONICAL_FIELDS.VARIANT_NAME, aliases: ["variant name", "variant_name", "variantname", "variant"] },
      { canonical: CANONICAL_FIELDS.PACK_SIZE, aliases: ["pack size", "pack_size", "packsize"] },
      { canonical: CANONICAL_FIELDS.UNIT, aliases: ["unit"] },
      { canonical: CANONICAL_FIELDS.IMAGE_FILE, aliases: ["image file", "image_file", "imagefile", "image_url", "imageurl"] },
      { canonical: CANONICAL_FIELDS.STATUS, aliases: ["status"] },
      { canonical: CANONICAL_FIELDS.PRICE, aliases: ["price"] }
    ];

    const lowerHeader = headerLine.toLowerCase();
    
    columnsToFind.forEach(col => {
      let bestStart = -1;
      let matchedText = "";
      const sortedAliases = [...col.aliases].sort((a, b) => b.length - a.length);
      for (const alias of sortedAliases) {
        const start = lowerHeader.indexOf(alias);
        if (start !== -1) {
          bestStart = start;
          matchedText = alias;
          break;
        }
      }
      if (bestStart !== -1) {
        foundColumns.push({
          canonical: col.canonical,
          start: bestStart,
          matchedText
        });
      }
    });

    // Sort found columns by start index to know their order in the file
    foundColumns.sort((a, b) => a.start - b.start);

    headers = foundColumns.map(c => c.canonical);
    const normalizedHeaders = [...headers];

    for (let i = 1; i < lines.length; i++) {
      const rawLine = cleanLineFunc(lines[i]);
      let fields = rawLine.split(/\s{2,}/).map(cleanField).filter(Boolean);
      
      if (fields.length > 0 && /^\d+$/.test(fields[0])) {
        const firstHeader = normalizedHeaders[0];
        if (firstHeader === CANONICAL_FIELDS.PRODUCT_NAME || 
            firstHeader === CANONICAL_FIELDS.COMPANY || 
            firstHeader === CANONICAL_FIELDS.CATEGORY || 
            firstHeader === CANONICAL_FIELDS.SKU) {
          fields.shift();
        }
      }
      
      if (fields.length !== normalizedHeaders.length) {
        fields = alignFieldsToHeaders(fields, normalizedHeaders, companiesList);
      }
      rows.push(fields);
    }
  } else {
    headers = [cleanField(headerLine)];
    for (let i = 1; i < lines.length; i++) {
      rows.push([cleanField(cleanLineFunc(lines[i]))]);
    }
  }

  return { headers, rows };
};

export const CANONICAL_FIELDS = {
  PRODUCT_NAME: "Product Name",
  COMPANY: "Company",
  CATEGORY: "Category",
  DESCRIPTION: "Description",
  TECH_SPECS: "Technical Specifications",
  SKU: "SKU",
  VARIANT_NAME: "Variant Name",
  PACK_SIZE: "Pack Size",
  UNIT: "Unit",
  IMAGE_FILE: "Image File",
  STATUS: "Status",
  PRICE: "Price"
};

export const ALIAS_MAP: Record<string, string> = {
  "product name": CANONICAL_FIELDS.PRODUCT_NAME,
  "product_name": CANONICAL_FIELDS.PRODUCT_NAME,
  "productname": CANONICAL_FIELDS.PRODUCT_NAME,
  "name": CANONICAL_FIELDS.PRODUCT_NAME,

  "company": CANONICAL_FIELDS.COMPANY,
  "company_name": CANONICAL_FIELDS.COMPANY,
  "companyname": CANONICAL_FIELDS.COMPANY,
  "brand": CANONICAL_FIELDS.COMPANY,

  "category": CANONICAL_FIELDS.CATEGORY,

  "description": CANONICAL_FIELDS.DESCRIPTION,

  "technical specifications": CANONICAL_FIELDS.TECH_SPECS,
  "technical_specifications": CANONICAL_FIELDS.TECH_SPECS,
  "technicalspecifications": CANONICAL_FIELDS.TECH_SPECS,
  "tech_specs": CANONICAL_FIELDS.TECH_SPECS,
  "techspecs": CANONICAL_FIELDS.TECH_SPECS,
  "tech specs": CANONICAL_FIELDS.TECH_SPECS,

  "sku": CANONICAL_FIELDS.SKU,
  "sku_code": CANONICAL_FIELDS.SKU,
  "skucode": CANONICAL_FIELDS.SKU,

  "variant name": CANONICAL_FIELDS.VARIANT_NAME,
  "variant_name": CANONICAL_FIELDS.VARIANT_NAME,
  "variantname": CANONICAL_FIELDS.VARIANT_NAME,
  "variant": CANONICAL_FIELDS.VARIANT_NAME,

  "pack size": CANONICAL_FIELDS.PACK_SIZE,
  "pack_size": CANONICAL_FIELDS.PACK_SIZE,
  "packsize": CANONICAL_FIELDS.PACK_SIZE,

  "unit": CANONICAL_FIELDS.UNIT,

  "image file": CANONICAL_FIELDS.IMAGE_FILE,
  "image_file": CANONICAL_FIELDS.IMAGE_FILE,
  "imagefile": CANONICAL_FIELDS.IMAGE_FILE,
  "image_url": CANONICAL_FIELDS.IMAGE_FILE,
  "imageurl": CANONICAL_FIELDS.IMAGE_FILE,

  "status": CANONICAL_FIELDS.STATUS,

  "price": CANONICAL_FIELDS.PRICE
};

export const getNormalizedVariantName = (varVal: string, packVal: string, unitVal: string): string => {
  if (varVal) {
    return varVal.trim().toLowerCase().replace(/\s+/g, "");
  }
  return (packVal + unitVal).trim().toLowerCase().replace(/\s+/g, "");
};

export interface BulkUploadRowPreview {
  rowNum: number;
  action: 'CREATE' | 'UPDATE' | 'ERROR' | 'WARNING';
  productName: string;
  companyName: string;
  category: string;
  variantName: string;
  packSize: string;
  unit: string;
  sku: string;
  price: string;
  imageFile: string;
  status: string;
  validationStatus: 'VALID' | 'WARNING' | 'ERROR';
  details: string;
  description?: string;
  techSpecs?: string;
}

export interface BulkUploadPreviewResult {
  success: boolean;
  rows: BulkUploadRowPreview[];
  summary: {
    newProducts: number;
    newVariants: number;
    existingVariantsToUpdate: number;
    imagesMatched: number;
    warnings: number;
    errors: number;
  };
  errorsList: string[];
}

export interface UserProfile {
  id: string;
  role: 'dealer' | 'admin';
  name: string;
  shopName: string;
  mobile: string;
  email: string;
  address: string;
  gstNumber: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  packSize: string;
  unit: string;
  price: number;
  sku: string;
  available: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DealerPrice {
  dealerId: string;
  variantId: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  companyId?: string;
  category: string;
  description: string;
  techSpecs: string;
  imageUrl: string;
  archived: boolean;
  variants?: ProductVariant[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  brand: string;
  variantId: string;
  packSize: string;
  price: number;
  quantity: number;
  confirmed_quantity?: number;
  cancelled_quantity?: number;
  item_status?: 'pending' | 'confirmed' | 'partially_confirmed' | 'cancelled';
  cancellation_reason?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  dealerId: string;
  dealerName: string;
  shopName: string;
  date: string;
  subtotal: number;
  total: number;
  paymentMethod: 'pay_now' | 'pay_later';
  paymentStatus: 'paid' | 'pending';
  orderStatus: 'new' | 'confirmed' | 'partially_confirmed' | 'processing' | 'dispatched' | 'completed' | 'cancelled';
  createdAt: string;
  items?: OrderItem[];
}

export interface SystemSettings {
  upiId: string;
  upiName: string;
  companyName: string;
  companyAddress: string;
  companyContact: string;
  companyEmail: string;
  companyGst: string;
  allowPayNow: boolean;
  allowPayLater: boolean;
  upiQrCode: string;
  companyLogo?: string;
  companyWhatsapp?: string;
  companyRegistration?: string;
}

export interface DeliveryChallan {
  id: string;
  challanNumber: string;
  orderId: string;
  dealerId: string;
  dispatchDate: string;
  businessSnapshot: SystemSettings;
  dealerSnapshot: UserProfile;
  itemsSnapshot: OrderItem[];
  transportDetails?: {
    transportThrough?: string;
    vehicleNumber?: string;
    driverName?: string;
    dispatchLocation?: string;
    deliveryLocation?: string;
  };
  hamali?: number;
  bhada?: number;
  otherCharges?: number;
  createdAt: string;
}

// Initial Data Seeds
const DEFAULT_SETTINGS: SystemSettings = {
  upiId: "shubhamkrishi@upi",
  upiName: BUSINESS_CONFIG.displayName,
  companyName: BUSINESS_CONFIG.name,
  companyAddress: BUSINESS_INFO.address,
  companyContact: BUSINESS_INFO.phone,
  companyEmail: "orders@shubhamkrishisewa.com",
  companyGst: "23ABCDE1234F1Z5",
  allowPayNow: true,
  allowPayLater: true,
  upiQrCode: "",
  companyLogo: "",
  companyWhatsapp: BUSINESS_INFO.phone,
  companyRegistration: "LIC-12345/UJN"
};

export function getCompanyPlaceholderLogo(name: string): string {
  const initials = name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
  const colors = [
    { bg: '#E6F4EA', text: '#137333' }, // Emerald
    { bg: '#E8F0FE', text: '#1A73E8' }, // Blue
    { bg: '#FCE8E6', text: '#C5221F' }, // Red
    { bg: '#FEF7E0', text: '#B06000' }, // Orange
    { bg: '#F3E8FD', text: '#8AB4F8' }, // Purple
  ];
  // Simple hash to select color consistently
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="${color.bg}" rx="16"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="${color.text}">${initials}</text></svg>`;
  
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}



const DEFAULT_COMPANIES: Company[] = [];
const DEFAULT_PRODUCTS: Product[] = [];
const DEFAULT_PRODUCT_VARIANTS: ProductVariant[] = [];

const DEFAULT_DEALERS: UserProfile[] = [];

const DEFAULT_ORDERS: Order[] = [];

const DEFAULT_ORDER_ITEMS: OrderItem[] = [];

// Helper to migrate database relationships and schema
export function migrateDatabase() {
  const companies: Company[] = JSON.parse(localStorage.getItem('ad_companies') || '[]');
  const products: Product[] = JSON.parse(localStorage.getItem('ad_products') || '[]');
  const orderItems: OrderItem[] = JSON.parse(localStorage.getItem('ad_order_items') || '[]');
  
  let companiesUpdated = false;
  let productsUpdated = false;
  let orderItemsUpdated = false;
  
  // 1. Master List of 22 Companies
  const masterCompaniesList = [
    "Krishaj",
    "BASF",
    "Rallis",
    "Syngenta",
    "Bayer",
    "Isagro",
    "Sumitomo Chemical",
    "Indo-Swiss",
    "Indofil Industries Limited",
    "ADAMA",
    "UPL",
    "Ghardha Chemicals Limited",
    "PI Agri Input",
    "Mahindra",
    "Nath Seeds",
    "Atul",
    "Godrej Agrovet",
    "Nagarjuna",
    "Dow",
    "DuPont",
    "NSC",
    "Shakti Vardhak Hybrid Seeds Pvt. Ltd."
  ];

  // Map of old names or variations to their correct seeded equivalents
  const mappings: Record<string, string> = {
    "bayer": "Bayer",
    "bayer india": "Bayer",
    "indofil": "Indofil Industries Limited",
    "indofil industries limited": "Indofil Industries Limited",
    "syngenta": "Syngenta",
    "syngenta india": "Syngenta",
    "adama": "ADAMA",
    "adama india": "ADAMA"
  };
  
  // Ensure status is updated from archived to inactive for all existing companies
  companies.forEach(c => {
    if ((c as any).status === 'archived') {
      c.status = 'inactive';
      companiesUpdated = true;
    }
  });

  // Ensure all 22 seed companies exist
  masterCompaniesList.forEach((name, idx) => {
    const exists = companies.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!exists) {
      companies.push({
        id: `comp-seed-${idx + 1}`,
        name,
        logo: getCompanyPlaceholderLogo(name),
        description: `${name} agricultural solutions and crop health products.`,
        status: 'active',
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      });
      companiesUpdated = true;
    }
  });

  const unmappedBrands = new Set<string>();

  // Map products to correct companyIds
  products.forEach(p => {
    const rawBrand = p.brand ? p.brand.trim() : "";
    if (!rawBrand) return;

    const normalized = rawBrand.toLowerCase();
    const targetName = mappings[normalized];

    if (targetName) {
      const comp = companies.find(c => c.name.toLowerCase() === targetName.toLowerCase());
      if (comp) {
        if (p.companyId !== comp.id || p.brand !== comp.name) {
          p.companyId = comp.id;
          p.brand = comp.name;
          productsUpdated = true;
        }
      }
    } else {
      // Check if it already matches a company directly in the DB
      const directComp = companies.find(c => c.name.toLowerCase() === normalized);
      if (directComp) {
        if (p.companyId !== directComp.id || p.brand !== directComp.name) {
          p.companyId = directComp.id;
          p.brand = directComp.name;
          productsUpdated = true;
        }
      } else {
        // Unmapped brand (e.g. Monsanto or FMC)
        unmappedBrands.add(rawBrand);
        
        // Preserve by creating a temporary company so the system keeps relationships intact
        const newCompId = `comp-auto-${normalized.replace(/[^a-z0-9]/g, '-')}`;
        const existsTemp = companies.find(c => c.id === newCompId);
        if (!existsTemp) {
          companies.push({
            id: newCompId,
            name: rawBrand,
            logo: getCompanyPlaceholderLogo(rawBrand),
            description: `${rawBrand} products directory (auto-preserved brand).`,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          companiesUpdated = true;
        }
        
        if (p.companyId !== newCompId || p.brand !== rawBrand) {
          p.companyId = newCompId;
          p.brand = rawBrand;
          productsUpdated = true;
        }
      }
    }
  });

  // Ensure historical order items maintain correct brand names
  orderItems.forEach(item => {
    if (item.productId) {
      const matchingProd = products.find(p => p.id === item.productId);
      if (matchingProd && item.brand !== matchingProd.brand) {
        item.brand = matchingProd.brand;
        orderItemsUpdated = true;
      }
    }
  });

  // Save changes
  if (companiesUpdated) {
    localStorage.setItem('ad_companies', JSON.stringify(companies));
  }
  if (productsUpdated) {
    localStorage.setItem('ad_products', JSON.stringify(products));
  }
  if (orderItemsUpdated) {
    localStorage.setItem('ad_order_items', JSON.stringify(orderItems));
  }

  // Update migration flags (for Admin display)
  if (unmappedBrands.size > 0) {
    localStorage.setItem('ad_migration_flags', JSON.stringify({
      unmappedBrands: Array.from(unmappedBrands)
    }));
  } else {
    localStorage.removeItem('ad_migration_flags');
  }
}

// Helper to initialize local storage
function initLocalStorage() {
  // One-time automatic local storage cleanup of demo data
  if (!localStorage.getItem('ad_demo_cleaned_permanently')) {
    localStorage.removeItem('ad_companies');
    localStorage.removeItem('ad_products');
    localStorage.removeItem('ad_product_variants');
    localStorage.removeItem('ad_dealers');
    localStorage.removeItem('ad_orders');
    localStorage.removeItem('ad_order_items');
    localStorage.removeItem('ad_delivery_challans');
    localStorage.removeItem('ad_dealer_prices');
    localStorage.removeItem('ad_migration_flags');
    localStorage.setItem('ad_demo_cleaned_permanently', 'true');
  }

  if (!localStorage.getItem('ad_companies')) {
    localStorage.setItem('ad_companies', JSON.stringify(DEFAULT_COMPANIES));
  }
  if (!localStorage.getItem('ad_products')) {
    localStorage.setItem('ad_products', JSON.stringify(DEFAULT_PRODUCTS));
  }
  
  const existingVariants = localStorage.getItem('ad_product_variants');
  if (!existingVariants || JSON.parse(existingVariants).length === 0) {
    localStorage.setItem('ad_product_variants', JSON.stringify(DEFAULT_PRODUCT_VARIANTS));
  }
  
  if (!localStorage.getItem('ad_dealers')) {
    localStorage.setItem('ad_dealers', JSON.stringify(DEFAULT_DEALERS));
  }
  if (!localStorage.getItem('ad_orders')) {
    localStorage.setItem('ad_orders', JSON.stringify(DEFAULT_ORDERS));
  }
  if (!localStorage.getItem('ad_order_items')) {
    localStorage.setItem('ad_order_items', JSON.stringify(DEFAULT_ORDER_ITEMS));
  }
  if (!localStorage.getItem('ad_settings')) {
    localStorage.setItem('ad_settings', JSON.stringify(DEFAULT_SETTINGS));
  } else {
    try {
      const settingsStr = localStorage.getItem('ad_settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings.companyName !== BUSINESS_INFO.name || 
            settings.companyAddress !== BUSINESS_INFO.address || 
            settings.companyContact !== BUSINESS_INFO.phone) {
          settings.companyName = BUSINESS_INFO.name;
          settings.companyAddress = BUSINESS_INFO.address;
          settings.companyContact = BUSINESS_INFO.phone;
          settings.upiName = BUSINESS_INFO.name;
          settings.companyWhatsapp = BUSINESS_INFO.phone;
          settings.upiId = "shubhamkrishi@upi";
          settings.companyRegistration = "LIC-12345/UJN";
          settings.companyGst = "23ABCDE1234F1Z5";
          settings.companyEmail = "orders@shubhamkrishisewa.com";
          localStorage.setItem('ad_settings', JSON.stringify(settings));
        }
      }
    } catch (err) {
      console.error("Migration of company settings failed:", err);
    }
  }
  if (!localStorage.getItem('ad_dealer_prices')) {
    localStorage.setItem('ad_dealer_prices', JSON.stringify([]));
  }
  if (!localStorage.getItem('ad_admins')) {
    const admins = [
      {
        id: "admin-1",
        role: "admin",
        name: `${BUSINESS_CONFIG.shortName} Administrator`,
        mobile: "9999999999",
        email: "admin@shubhamkrishisewa.com",
        password: "admin123"
      }
    ];
    localStorage.setItem('ad_admins', JSON.stringify(admins));
  } else {
    // Dynamic migration: Ensure seeded admin details reflect the updated business configuration
    try {
      const adminsStr = localStorage.getItem('ad_admins');
      if (adminsStr) {
        const admins = JSON.parse(adminsStr);
        let updated = false;
        const updatedAdmins = admins.map((a: any) => {
          let email = a.email;
          let name = a.name;
          if (email === "admin@agrodist.com") {
            email = "admin@shubhamkrishisewa.com";
            updated = true;
          }
          if (name && name.includes("AgroDist")) {
            name = name.replace("AgroDist", BUSINESS_CONFIG.shortName);
            updated = true;
          }
          return { ...a, email, name };
        });
        if (updated) {
          localStorage.setItem('ad_admins', JSON.stringify(updatedAdmins));
        }
      }
    } catch (e) {
      console.error("Failed to migrate admins: ", e);
    }
  }

  // Also migrate the active session if it exists and contains old naming
  try {
    const sessionStr = localStorage.getItem('ad_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      let updated = false;
      if (session.name && session.name.includes("AgroDist")) {
        session.name = session.name.replace("AgroDist", BUSINESS_CONFIG.shortName);
        updated = true;
      }
      if (session.email === "admin@agrodist.com") {
        session.email = "admin@shubhamkrishisewa.com";
        updated = true;
      }
      if (updated) {
        localStorage.setItem('ad_session', JSON.stringify(session));
      }
    }
  } catch (e) {
    console.error("Failed to migrate active session: ", e);
  }

  // Run the safe migration routine
  try {
    migrateDatabase();
  } catch (err) {
    console.error("Migration error during startup: ", err);
  }

  localStorage.setItem('ad_initialized', 'true');
}

initLocalStorage();

export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return url !== '' && key !== '' && !url.includes('your-project-id');
};

// Database Service Functions
export const dbService = {
  async ensureAdminAuth(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      const session = this.getCurrentSession();
      if (session && session.role === 'admin') {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const targetEmail = session.email || "admin@shubhamkrishisewa.com";
        const isCorrectSession = currentSession && currentSession.user && currentSession.user.email === targetEmail;
        if (!isCorrectSession) {
          console.log("[Auth] Restoring admin session in Supabase for " + targetEmail + "...");
          await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: "admin123"
          });
        }
      }
    } catch (e) {
      console.warn("[Auth] Auto-auth verification failed:", e);
    }
  },

  // --- OFFLINE FALLBACK LOGIC ---
  localLogin(cleanLogin: string, passwordVal?: string): { success: boolean; user?: UserProfile; error?: string } {
    // 1. Check if admin
    const admins = JSON.parse(localStorage.getItem('ad_admins') || '[]');
    const adminMatch = admins.find((a: any) => a.email.toLowerCase() === cleanLogin || a.mobile === cleanLogin);
    if (adminMatch) {
      if (passwordVal === adminMatch.password) {
        const user: UserProfile = {
          id: adminMatch.id,
          role: 'admin',
          name: adminMatch.name,
          shopName: `${BUSINESS_CONFIG.shortName} Corporate`,
          mobile: adminMatch.mobile,
          email: adminMatch.email,
          address: 'Corporate Headquarters',
          gstNumber: 'CorporateGST',
          createdAt: new Date().toISOString(),
          status: 'active'
        };
        localStorage.setItem('ad_session', JSON.stringify(user));
        return { success: true, user };
      } else {
        return { success: false, error: "Incorrect password for admin account" };
      }
    }
    
    // 2. Check if dealer
    const dealers = JSON.parse(localStorage.getItem('ad_dealers') || '[]');
    const dealerMatch = dealers.find((d: UserProfile) => d.email.toLowerCase() === cleanLogin || d.mobile === cleanLogin);
    if (dealerMatch) {
      localStorage.setItem('ad_session', JSON.stringify(dealerMatch));
      return { success: true, user: dealerMatch };
    }
    
    return { success: false, error: "Dealer account not found. Please register first." };
  },

  localRegister(dealerData: Omit<UserProfile, 'id' | 'role' | 'createdAt'>): { success: boolean; user?: UserProfile; error?: string } {
    const dealers = JSON.parse(localStorage.getItem('ad_dealers') || '[]');
    if (dealers.some((d: any) => d.mobile === dealerData.mobile || d.email === dealerData.email)) {
      return { success: false, error: "Dealer account already exists locally." };
    }

    const newId = `dealer-${Date.now()}`;
    const user: UserProfile = {
      id: newId,
      role: 'dealer',
      name: dealerData.name,
      shopName: dealerData.shopName,
      mobile: dealerData.mobile,
      email: dealerData.email || getDealerAuthEmail(dealerData.mobile),
      address: dealerData.address,
      gstNumber: dealerData.gstNumber,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    dealers.push(user);
    localStorage.setItem('ad_dealers', JSON.stringify(dealers));

    const currentSession = this.getCurrentSession();
    if (!currentSession || currentSession.role !== 'admin') {
      localStorage.setItem('ad_session', JSON.stringify(user));
    }

    return { success: true, user };
  },

  // --- OFFLINE BULK UPLOAD FALLBACK ---
  localBulkUploadProducts(csvText: string, zipFilesMap: Record<string, Blob>): {
    success: boolean;
    productsCreated: number;
    productsUpdated: number;
    variantsCreated: number;
    variantsUpdated: number;
    imagesImported: number;
    errors: string[];
  } {
    const valRes = this.validateBulkUpload(csvText, zipFilesMap);
    if (!valRes.success || valRes.summary.errors > 0) {
      return {
        success: false,
        productsCreated: 0,
        productsUpdated: 0,
        variantsCreated: 0,
        variantsUpdated: 0,
        imagesImported: 0,
        errors: ["Validation failed. Inspect details."]
      };
    }

    const localCompanies = JSON.parse(localStorage.getItem('ad_companies') || '[]');
    const localProducts = JSON.parse(localStorage.getItem('ad_products') || '[]');
    const localVariants = JSON.parse(localStorage.getItem('ad_product_variants') || '[]');

    let productsCreated = 0;
    let productsUpdated = 0;
    let variantsCreated = 0;
    let variantsUpdated = 0;
    let imagesImported = 0;

    for (const row of valRes.rows) {
      if (row.validationStatus === 'ERROR') continue;

      // 1. Resolve Company
      let comp = localCompanies.find((c: any) => c.name.toLowerCase().trim() === row.companyName.toLowerCase().trim());
      if (!comp) {
        comp = {
          id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: row.companyName,
          logo: getCompanyPlaceholderLogo(row.companyName),
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localCompanies.push(comp);
      }

      // 2. Resolve Image
      let imageUrl = '';
      if (row.imageFile) {
        const cleanImg = row.imageFile.trim();
        const lowerImg = cleanImg.toLowerCase();
        if (zipFilesMap[lowerImg]) {
          const blob = zipFilesMap[lowerImg];
          ImageStorageService.saveImage(cleanImg, blob);
          imageUrl = cleanImg;
          imagesImported++;
        } else {
          imageUrl = cleanImg;
        }
      }

      // 3. Resolve Product
      let prod = localProducts.find((p: any) => 
        p.name.toLowerCase().trim() === row.productName.toLowerCase().trim() && 
        p.brand.toLowerCase().trim() === row.companyName.toLowerCase().trim()
      );
      let productWasCreated = false;
      if (!prod) {
        prod = {
          id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: row.productName,
          brand: row.companyName,
          companyId: comp.id,
          category: row.category || 'others',
          description: row.description || '',
          techSpecs: row.techSpecs || '',
          imageUrl: imageUrl || (row.imageFile ? `https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500` : ''),
          archived: false
        };
        localProducts.push(prod);
        productsCreated++;
        productWasCreated = true;
      } else if (imageUrl) {
        prod.imageUrl = imageUrl;
      }

      // 4. Resolve Variant & Price
      const existingVar = localVariants.find((v: any) => v.sku.toLowerCase().trim() === row.sku.toLowerCase().trim());
      if (existingVar) {
        existingVar.productId = prod.id;
        existingVar.packSize = row.packSize;
        existingVar.unit = row.unit;
        existingVar.price = Number(row.price);
        existingVar.available = row.status.toLowerCase() === 'active';
        if (imageUrl) existingVar.imageUrl = imageUrl;
        variantsUpdated++;
        if (!productWasCreated) productsUpdated++;
      } else {
        localVariants.push({
          id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          productId: prod.id,
          sku: row.sku,
          packSize: row.packSize,
          unit: row.unit,
          price: Number(row.price),
          available: row.status.toLowerCase() === 'active',
          archived: false,
          imageUrl: imageUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        variantsCreated++;
      }
    }

    localStorage.setItem('ad_companies', JSON.stringify(localCompanies));
    localStorage.setItem('ad_products', JSON.stringify(localProducts));
    localStorage.setItem('ad_product_variants', JSON.stringify(localVariants));

    return {
      success: true,
      productsCreated,
      productsUpdated,
      variantsCreated,
      variantsUpdated,
      imagesImported,
      errors: []
    };
  },

  // --- CATALOGUE MIGRATION TO SUPABASE Central ---
  async migrateLocalCatalogueToSupabase(testOnly: boolean = false): Promise<{ success: boolean; count: number; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, count: 0, error: "Supabase is not configured." };
    }

    // Auto-auth logic (to satisfy RLS policies)
    try {
      const session = this.getCurrentSession();
      if (session && session.role === 'admin') {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          console.log("[Migration] No active Supabase auth session. Attempting auto-auth for admin...");
          const email = session.email || "admin@shubhamkrishisewa.com";
          const password = "admin123";
          
          let { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (authError) {
            console.log("[Migration] Admin user not found in Supabase auth. Auto-registering...");
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password
            });
            
            if (!signUpError && signUpData.user) {
              await supabase.from('profiles').upsert({
                id: signUpData.user.id,
                role: 'admin',
                name: session.name || "Shubham Krishi Sewa Administrator",
                mobile: session.mobile || "9999999999",
                email,
                status: 'active'
              }, { onConflict: 'email' });
              
              await supabase.auth.signInWithPassword({ email, password });
            }
          }
          console.log("[Migration] Successfully authenticated as admin in Supabase.");
        }
      }
    } catch (authErr: any) {
      console.warn("[Migration] Auto-auth failed, attempting migration anyway:", authErr);
    }

    try {
      // 1. Read existing local data
      let localCompanies = JSON.parse(localStorage.getItem('ad_companies') || '[]');
      let localProducts = JSON.parse(localStorage.getItem('ad_products') || '[]');
      let localVariants = JSON.parse(localStorage.getItem('ad_product_variants') || '[]');

      if (localCompanies.length === 0) localCompanies = DEFAULT_COMPANIES;
      if (localProducts.length === 0) localProducts = DEFAULT_PRODUCTS;
      if (localVariants.length === 0) localVariants = DEFAULT_PRODUCT_VARIANTS;

      // Filter to one company if testOnly is active
      if (testOnly) {
        console.log("[Migration] Running in TEST ONLY mode (Bayer only)");
        localCompanies = localCompanies.filter((c: any) => c.name.toLowerCase().trim() === 'bayer');
        if (localCompanies.length === 0) {
          const firstComp = JSON.parse(localStorage.getItem('ad_companies') || '[]')[0] || DEFAULT_COMPANIES[0];
          if (firstComp) {
            localCompanies = [firstComp];
          }
        }
        const testCompanyNames = localCompanies.map((c: any) => c.name.toLowerCase().trim());
        localProducts = localProducts.filter((p: any) => testCompanyNames.includes((p.brand || '').toLowerCase().trim()));
        const testProductIds = localProducts.map((p: any) => p.id);
        localVariants = localVariants.filter((v: any) => testProductIds.includes(v.productId || v.product_id));
      }

      console.log(`[Migration] Starting catalogue migration: ${localCompanies.length} companies, ${localProducts.length} products, ${localVariants.length} variants`);

      // Pre-migration validation stats calculation
      const validation = {
        totalCompanies: localCompanies.length,
        totalProducts: localProducts.length,
        totalVariants: localVariants.length,
        totalVariantsWithPrices: localVariants.filter((v: any) => v.price && Number(v.price) > 0).length,
        totalVariantsWithoutPrices: localVariants.filter((v: any) => !v.price || Number(v.price) <= 0).length,
        duplicateSKUs: 0,
        productsWithMissingCompany: 0,
        variantsWithMissingProduct: 0
      };

      const skuSet = new Set<string>();
      const duplicateSkuSet = new Set<string>();
      localVariants.forEach((v: any) => {
        if (!v.sku) return;
        const normSku = v.sku.toLowerCase().trim();
        if (skuSet.has(normSku)) {
          duplicateSkuSet.add(normSku);
        } else {
          skuSet.add(normSku);
        }
      });
      validation.duplicateSKUs = duplicateSkuSet.size;

      localProducts.forEach((p: any) => {
        const brandName = p.brand || "";
        const companyId = p.companyId || p.company_id || "";
        if (!brandName.trim() && !companyId) {
          validation.productsWithMissingCompany++;
        }
      });

      localVariants.forEach((v: any) => {
        const prodId = v.productId || v.product_id || "";
        const parent = localProducts.find((p: any) => p.id === prodId);
        if (!parent) {
          validation.variantsWithMissingProduct++;
        }
      });

      const preMigrationLog = 
        `[Migration Validation]\n` +
        `Total companies: ${validation.totalCompanies}\n` +
        `Total products: ${validation.totalProducts}\n` +
        `Total variants: ${validation.totalVariants}\n` +
        `Total variants with prices: ${validation.totalVariantsWithPrices}\n` +
        `Total variants without prices: ${validation.totalVariantsWithoutPrices}\n` +
        `Duplicate SKUs: ${validation.duplicateSKUs}\n` +
        `Products with missing company: ${validation.productsWithMissingCompany}\n` +
        `Variants with missing product: ${validation.variantsWithMissingProduct}\n`;
      
      console.log(preMigrationLog);

      let companiesCreated = 0;
      let companiesReused = 0;
      let productsCreated = 0;
      let productsUpdated = 0;
      let variantsCreated = 0;
      let variantsUpdated = 0;
      let pricesCreated = 0;
      let pricesUpdated = 0;
      let failedRecords = 0;
      let missingPrices = 0;
      const migrationErrors: string[] = [];

      const BATCH_SIZE = 50;
      const chunk = <T>(arr: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };

      // Fetch all existing db companies to avoid redundant selects
      const { data: dbCompanies, error: dbCompErr } = await supabase.from('companies').select('*');
      if (dbCompErr) throw new Error("Failed to fetch database companies: " + dbCompErr.message);

      const dbCompanyMap = new Map<string, any>(); // name (normalized) -> company object
      if (dbCompanies) {
        dbCompanies.forEach(c => dbCompanyMap.set(c.name.toLowerCase().trim(), c));
      }

      const companyIdMap = new Map<string, string>(); // local_id -> supabase_id
      const companyUpserts: any[] = [];

      // 2. Migrate Companies
      for (const lc of localCompanies) {
        const normName = lc.name.toLowerCase().trim();
        if (!normName) {
          migrationErrors.push(`Company ID '${lc.id}' skipped: name is empty`);
          failedRecords++;
          continue;
        }

        const existingComp = dbCompanyMap.get(normName);
        if (existingComp) {
          companiesReused++;
          companyIdMap.set(lc.id, existingComp.id);
        } else {
          companiesCreated++;
        }

        companyUpserts.push({
          name: lc.name,
          logo: lc.logo || getCompanyPlaceholderLogo(lc.name),
          status: lc.status === 'active' || lc.status === 'inactive' ? lc.status : 'active'
        });
      }

      // Batch upsert companies
      const companyBatches = chunk(companyUpserts, BATCH_SIZE);
      for (const batch of companyBatches) {
        const { data: insertedComps, error: insErr } = await supabase
          .from('companies')
          .upsert(batch, { onConflict: 'name' })
          .select('id, name');

        if (insErr) {
          migrationErrors.push(`Companies batch upsert failed: ${insErr.message}`);
          failedRecords += batch.length;
        } else if (insertedComps) {
          insertedComps.forEach(c => {
            dbCompanyMap.set(c.name.toLowerCase().trim(), c);
          });
        }
      }

      // Map IDs for all companies
      for (const lc of localCompanies) {
        const normName = lc.name.toLowerCase().trim();
        const resolved = dbCompanyMap.get(normName);
        if (resolved) {
          companyIdMap.set(lc.id, resolved.id);
        } else if (normName) {
          migrationErrors.push(`Company '${lc.name}' failed to resolve Supabase UUID`);
          failedRecords++;
        }
      }

      // Fetch all existing db products
      const { data: dbProducts, error: dbProdErr } = await supabase.from('products').select('*');
      if (dbProdErr) throw new Error("Failed to fetch database products: " + dbProdErr.message);

      const dbProductMap = new Map<string, any>(); // "companyId||name" (normalized) -> product object
      if (dbProducts) {
        dbProducts.forEach(p => dbProductMap.set(`${p.company_id}||${p.name.toLowerCase().trim()}`, p));
      }

      const productIdMap = new Map<string, string>(); // local_id -> supabase_id
      const productUpserts: any[] = [];

      // 3. Migrate Products
      for (const lp of localProducts) {
        const brandName = lp.brand || "";
        const companyId = dbCompanyMap.get(brandName.toLowerCase().trim())?.id || companyIdMap.get(lp.companyId || lp.company_id);

        if (!lp.name || !lp.name.trim()) {
          migrationErrors.push(`Product ID '${lp.id}' skipped: name is empty`);
          failedRecords++;
          continue;
        }

        if (!companyId) {
          migrationErrors.push(`Product '${lp.name}' skipped: parent company '${brandName}' not resolved`);
          failedRecords++;
          continue;
        }

        const normProdKey = `${companyId}||${lp.name.toLowerCase().trim()}`;
        const existingProd = dbProductMap.get(normProdKey);

        if (existingProd) {
          productsUpdated++;
          productIdMap.set(lp.id, existingProd.id);
        } else {
          productsCreated++;
        }

        productUpserts.push({
          company_id: companyId,
          name: lp.name,
          brand: brandName,
          category: lp.category || 'others',
          description: lp.description || '',
          tech_specs: lp.techSpecs || lp.tech_specs || '',
          image_url: lp.imageUrl || lp.image_url || '',
          archived: lp.archived === true
        });
      }

      // Batch upsert products
      const productBatches = chunk(productUpserts, BATCH_SIZE);
      for (const batch of productBatches) {
        const { data: upsertedProds, error: upsertErr } = await supabase
          .from('products')
          .upsert(batch, { onConflict: 'company_id, name' })
          .select('id, company_id, name');

        if (upsertErr) {
          migrationErrors.push(`Products batch upsert failed: ${upsertErr.message}`);
          failedRecords += batch.length;
        } else if (upsertedProds) {
          upsertedProds.forEach(p => {
            dbProductMap.set(`${p.company_id}||${p.name.toLowerCase().trim()}`, p);
          });
        }
      }

      // Map IDs for all products
      for (const lp of localProducts) {
        const brandName = lp.brand || "";
        const companyId = dbCompanyMap.get(brandName.toLowerCase().trim())?.id || companyIdMap.get(lp.companyId || lp.company_id);
        if (companyId) {
          const normProdKey = `${companyId}||${lp.name.toLowerCase().trim()}`;
          const resolved = dbProductMap.get(normProdKey);
          if (resolved) {
            productIdMap.set(lp.id, resolved.id);
          } else {
            migrationErrors.push(`Product '${lp.name}' failed to resolve Supabase UUID`);
            failedRecords++;
          }
        }
      }

      // Fetch all existing db variants
      const { data: dbVariants, error: dbVarErr } = await supabase.from('product_variants').select('*');
      if (dbVarErr) throw new Error("Failed to fetch database variants: " + dbVarErr.message);

      const dbVariantMap = new Map<string, any>(); // sku (normalized) -> variant object
      if (dbVariants) {
        dbVariants.forEach(v => dbVariantMap.set(v.sku.toLowerCase().trim(), v));
      }

      const variantIdMap = new Map<string, string>(); // local_id -> supabase_id
      const variantUpserts: any[] = [];

      // 4. Migrate Variants
      for (const lv of localVariants) {
        const normSku = (lv.sku || "").toLowerCase().trim();
        if (!normSku) {
          migrationErrors.push(`Variant ID '${lv.id}' skipped: SKU is empty`);
          failedRecords++;
          continue;
        }

        const localProd = localProducts.find((p: any) => p.id === (lv.productId || lv.product_id));
        if (!localProd) {
          migrationErrors.push(`Variant SKU '${lv.sku}' skipped: local parent product not found`);
          failedRecords++;
          continue;
        }

        const supabaseProductId = productIdMap.get(localProd.id);
        if (!supabaseProductId) {
          migrationErrors.push(`Variant SKU '${lv.sku}' skipped: Supabase parent product not resolved`);
          failedRecords++;
          continue;
        }

        // Parse pack size exactly
        let packSizeNum = Number(lv.packSize || lv.pack_size);
        if (isNaN(packSizeNum)) {
          const parsed = parseFloat(String(lv.packSize || lv.pack_size));
          if (!isNaN(parsed)) {
            packSizeNum = parsed;
          } else {
            packSizeNum = 1;
            migrationErrors.push(`Warning: Variant SKU '${lv.sku}' has unparseable pack size '${lv.packSize || lv.pack_size}', defaulted to 1`);
          }
        }

        const existingVar = dbVariantMap.get(normSku);
        if (existingVar) {
          variantsUpdated++;
          variantIdMap.set(lv.id, existingVar.id);
        } else {
          variantsCreated++;
        }

        variantUpserts.push({
          product_id: supabaseProductId,
          sku: lv.sku,
          pack_size: packSizeNum,
          unit: lv.unit || 'ml',
          available: lv.available !== false,
          archived: lv.archived === true,
          image_url: lv.imageUrl || lv.image_url || null
        });
      }

      // Batch upsert variants
      const variantBatches = chunk(variantUpserts, BATCH_SIZE);
      for (const batch of variantBatches) {
        const { data: upsertedVars, error: upsertErr } = await supabase
          .from('product_variants')
          .upsert(batch, { onConflict: 'sku' })
          .select('id, sku');

        if (upsertErr) {
          migrationErrors.push(`Variants batch upsert failed: ${upsertErr.message}`);
          failedRecords += batch.length;
        } else if (upsertedVars) {
          upsertedVars.forEach(v => {
            dbVariantMap.set(v.sku.toLowerCase().trim(), v);
          });
        }
      }

      // Map IDs for all variants
      for (const lv of localVariants) {
        const normSku = (lv.sku || "").toLowerCase().trim();
        if (normSku) {
          const resolved = dbVariantMap.get(normSku);
          if (resolved) {
            variantIdMap.set(lv.id, resolved.id);
          } else {
            migrationErrors.push(`Variant SKU '${lv.sku}' failed to resolve Supabase UUID`);
            failedRecords++;
          }
        }
      }

      // Fetch all existing base prices
      const { data: dbPrices, error: dbPriceErr } = await supabase.from('variant_base_prices').select('*');
      if (dbPriceErr) throw new Error("Failed to fetch database base prices: " + dbPriceErr.message);

      const dbPriceMap = new Map<string, any>(); // variant_id -> price object
      if (dbPrices) {
        dbPrices.forEach(p => dbPriceMap.set(p.variant_id, p));
      }

      const priceUpserts: any[] = [];

      // 5. Migrate Base Prices
      for (const lv of localVariants) {
        const supabaseVariantId = variantIdMap.get(lv.id);
        if (!supabaseVariantId) {
          continue;
        }

        const priceNum = Number(lv.price);
        if (isNaN(priceNum) || priceNum <= 0) {
          missingPrices++;
          migrationErrors.push(`Variant SKU '${lv.sku}' has invalid/missing base price: ${lv.price}`);
          continue;
        }

        const existingPrice = dbPriceMap.get(supabaseVariantId);
        if (existingPrice) {
          pricesUpdated++;
        } else {
          pricesCreated++;
        }

        priceUpserts.push({
          variant_id: supabaseVariantId,
          price: priceNum
        });
      }

      // Batch upsert base prices
      const priceBatches = chunk(priceUpserts, BATCH_SIZE);
      for (const batch of priceBatches) {
        const { error: upsertErr } = await supabase
          .from('variant_base_prices')
          .upsert(batch, { onConflict: 'variant_id' });

        if (upsertErr) {
          migrationErrors.push(`Base prices batch upsert failed: ${upsertErr.message}`);
          failedRecords += batch.length;
        }
      }

      console.log(`[Migration] Complete. Syncing back dynamic cache...`);
      await this.syncFromSupabase();

      // --- POST-MIGRATION VERIFICATION FROM SUPABASE ---
      const { data: vComps } = await supabase.from('companies').select('id, name');
      const { data: vProds } = await supabase.from('products').select('id, company_id, name, brand');
      const { data: vVars } = await supabase.from('product_variants').select('id, product_id, sku, pack_size, unit');
      const { data: vPrices } = await supabase.from('variant_base_prices').select('id, variant_id, price');

      const comps = vComps || [];
      const prods = vProds || [];
      const vars = vVars || [];
      const prices = vPrices || [];

      // Calculate distributions
      const prodByComp = new Map<string, number>();
      prods.forEach(p => {
        const cnt = prodByComp.get(p.company_id) || 0;
        prodByComp.set(p.company_id, cnt + 1);
      });

      const varByComp = new Map<string, number>();
      vars.forEach(v => {
        const p = prods.find(pr => pr.id === v.product_id);
        if (p) {
          const cnt = varByComp.get(p.company_id) || 0;
          varByComp.set(p.company_id, cnt + 1);
        }
      });

      // Products by company distribution lines
      const prodDistLines = comps.map(c => {
        const cnt = prodByComp.get(c.id) || 0;
        return `  - ${c.name}: ${cnt}`;
      }).join('\n');

      // Variants by company distribution lines
      const varDistLines = comps.map(c => {
        const cnt = varByComp.get(c.id) || 0;
        return `  - ${c.name}: ${cnt}`;
      }).join('\n');

      // Price coverage
      const priceMap = new Set(prices.map(p => p.variant_id));
      let varsWithPrices = 0;
      let varsWithoutPrices = 0;
      vars.forEach(v => {
        if (priceMap.has(v.id)) {
          varsWithPrices++;
        } else {
          varsWithoutPrices++;
        }
      });

      // Duplicate SKUs in Supabase
      const skuCounts = new Map<string, number>();
      vars.forEach(v => {
        const norm = v.sku.toLowerCase().trim();
        skuCounts.set(norm, (skuCounts.get(norm) || 0) + 1);
      });
      let dupSkusCount = 0;
      skuCounts.forEach((cnt) => {
        if (cnt > 1) dupSkusCount += (cnt - 1);
      });

      // Orphans checks
      const compIds = new Set(comps.map(c => c.id));
      const prodIds = new Set(prods.map(p => p.id));
      const varIds = new Set(vars.map(v => v.id));

      let orphanProducts = 0;
      prods.forEach(p => {
        if (!compIds.has(p.company_id)) orphanProducts++;
      });

      let orphanVariants = 0;
      vars.forEach(v => {
        if (!prodIds.has(v.product_id)) orphanVariants++;
      });

      let orphanPrices = 0;
      prices.forEach(p => {
        if (!varIds.has(p.variant_id)) orphanPrices++;
      });

      // End-to-end single product verification
      let e2eDetails = "No valid product found for E2E verification.";
      const sampleVar = vars.find(v => v.sku);
      if (sampleVar) {
        const sampleProd = prods.find(p => p.id === sampleVar.product_id);
        const sampleComp = sampleProd ? comps.find(c => c.id === sampleProd.company_id) : null;
        const samplePrice = prices.find(p => p.variant_id === sampleVar.id);

        if (sampleProd && sampleComp) {
          e2eDetails = 
            `  - Company: "${sampleComp.name}" (ID: ${sampleComp.id})\n` +
            `  - Product Name: "${sampleProd.name}" (ID: ${sampleProd.id})\n` +
            `  - Product brand (cached): "${sampleProd.brand}"\n` +
            `  - Variant SKU: "${sampleVar.sku}" (ID: ${sampleVar.id})\n` +
            `  - Pack Size: ${sampleVar.pack_size} ${sampleVar.unit}\n` +
            `  - Base Price: Rs. ${samplePrice ? samplePrice.price : 'N/A'} (Price ID: ${samplePrice ? samplePrice.id : 'N/A'})\n` +
            `  - Relationship checks:\n` +
            `    - products.company_id == companies.id: ${sampleProd.company_id === sampleComp.id ? 'VERIFIED' : 'FAILED'}\n` +
            `    - product_variants.product_id == products.id: ${sampleVar.product_id === sampleProd.id ? 'VERIFIED' : 'FAILED'}\n` +
            `    - variant_base_prices.variant_id == product_variants.id: ${samplePrice && samplePrice.variant_id === sampleVar.id ? 'VERIFIED' : 'FAILED'}`;
        }
      }

      const report = 
        `MIGRATION REPORT\n` +
        `=========================================\n` +
        `1. Validation Summary (Before Migration):\n` +
        `  - Total companies: ${validation.totalCompanies}\n` +
        `  - Total products: ${validation.totalProducts}\n` +
        `  - Total variants: ${validation.totalVariants}\n` +
        `  - Total variants with prices: ${validation.totalVariantsWithPrices}\n` +
        `  - Total variants without prices: ${validation.totalVariantsWithoutPrices}\n` +
        `  - Duplicate SKUs: ${validation.duplicateSKUs}\n` +
        `  - Products with missing company: ${validation.productsWithMissingCompany}\n` +
        `  - Variants with missing product: ${validation.variantsWithMissingProduct}\n` +
        `\n` +
        `2. Execution Summary (Upsert Counts):\n` +
        `  - Companies created: ${companiesCreated}\n` +
        `  - Companies reused: ${companiesReused}\n` +
        `  - Products created: ${productsCreated}\n` +
        `  - Products updated/reused: ${productsUpdated}\n` +
        `  - Variants created: ${variantsCreated}\n` +
        `  - Variants updated/reused: ${variantsUpdated}\n` +
        `  - Prices created: ${pricesCreated}\n` +
        `  - Prices updated: ${pricesUpdated}\n` +
        `\n` +
        `3. Problems encountered:\n` +
        `  - Duplicate SKUs: ${validation.duplicateSKUs}\n` +
        `  - Missing prices: ${missingPrices}\n` +
        `  - Missing companies: ${validation.productsWithMissingCompany}\n` +
        `  - Missing products: ${validation.variantsWithMissingProduct}\n` +
        `  - Failed records: ${failedRecords}\n` +
        `  - Total migration errors: ${migrationErrors.length}\n` +
        `\n` +
        `4. Supabase Verification (Actual Row Counts):\n` +
        `  - companies: ${comps.length}\n` +
        `  - products: ${prods.length}\n` +
        `  - product_variants: ${vars.length}\n` +
        `  - variant_base_prices: ${prices.length}\n` +
        `\n` +
        `5. Database Distributions:\n` +
        `  * Products by company:\n` +
        `${prodDistLines}\n` +
        `  * Variants by company:\n` +
        `${varDistLines}\n` +
        `  * Price Coverage:\n` +
        `    - Variants with base prices: ${varsWithPrices}\n` +
        `    - Variants without base prices: ${varsWithoutPrices}\n` +
        `  * Foreign Key & Integrity Checks:\n` +
        `    - Orphan products: ${orphanProducts}\n` +
        `    - Orphan variants: ${orphanVariants}\n` +
        `    - Orphan prices: ${orphanPrices}\n` +
        `    - Duplicate SKUs in DB: ${dupSkusCount}\n` +
        `\n` +
        `6. End-to-End Product Verification:\n` +
        `${e2eDetails}\n` +
        `=========================================\n`;

      console.log(report);
      if (migrationErrors.length > 0) {
        console.error("Migration Errors details:\n", migrationErrors.join("\n"));
      }

      // 6. Seed/Repair Demo Dealers
      console.log(`[Migration] Seeding/repairing demo dealers...`);
      for (const d of DEFAULT_DEALERS) {
        const authEmail = getDealerAuthEmail(d.mobile);
        const passwordToUse = 'dealer123';
        
        let userId: string | null = null;
        
        // Try sign-in first to see if they exist
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: passwordToUse
        });
        
        if (signInData && signInData.user) {
          userId = signInData.user.id;
        } else {
          // If sign-in failed, try sign-up
          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email: authEmail,
            password: passwordToUse
          });
          
          if (signUpData && signUpData.user) {
            userId = signUpData.user.id;
          } else {
            console.warn(`[Migration] Failed to seed/repair auth for demo dealer ${d.name}:`, signUpErr?.message || signInErr?.message);
          }
        }
        
        if (userId) {
          // Upsert profile
          const { error: profileErr } = await supabase.from('profiles').upsert({
            id: userId,
            role: 'dealer',
            name: d.name,
            shop_name: d.shopName,
            mobile: d.mobile,
            email: d.email || authEmail, // store real email if present, else synthetic
            address: d.address,
            gst_number: d.gstNumber,
            status: 'active'
          }, { onConflict: 'mobile' });
          
          if (profileErr) {
            console.error(`[Migration] Failed to seed profile for demo dealer ${d.name}:`, profileErr.message);
          } else {
            console.log(`[Migration] Successfully seeded/updated profile for demo dealer ${d.name}`);
          }
        }
      }

      return { 
        success: true, 
        count: productsCreated + productsUpdated,
        error: report 
      };
    } catch (err: any) {
      console.error("[Migration] Catalogue migration failed:", err);
      return { success: false, count: 0, error: err.message };
    }
  },

  // --- SYNC ROUTINE ---
  async syncFromSupabase(): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('[Sync] Supabase is unconfigured/placeholder. Running in offline fallback mode.');
      return;
    }

    await this.ensureAdminAuth();

    try {
      const sessionUser = this.getCurrentSession();
      
      // Pull public data (available to anyone including anon/guests)
      const { data: companies } = await supabase.from('companies').select('*');
      const { data: products } = await supabase.from('products').select('*');
      const { data: settings } = await supabase.from('system_settings').select('*');

      // Auto-migrate if Supabase catalogue is completely empty, configured, and user is an admin
      if (products && products.length === 0 && sessionUser && sessionUser.role === 'admin') {
        console.log("[Sync] Supabase catalogue is empty. Auto-migrating local catalogue...");
        const migRes = await this.migrateLocalCatalogueToSupabase();
        if (migRes.success) {
          // Re-fetch now that it is migrated
          await this.syncFromSupabase();
          return;
        }
      }

      // Fetch base product variants (secure from guest pricing)
      const { data: rawVariants } = await supabase.from('product_variants').select('*');

      // Guest base-price security: Only fetch base prices if authenticated
      let variantsWithPrices = (rawVariants || []).map((rv: any) => ({
        id: rv.id,
        productId: rv.product_id,
        sku: rv.sku,
        packSize: String(rv.pack_size),
        unit: rv.unit,
        price: 0, // Guest default is 0/hidden
        available: rv.available !== false,
        archived: rv.archived === true,
        imageUrl: rv.image_url || '',
        createdAt: rv.created_at,
        updatedAt: rv.updated_at
      }));

      if (companies) localStorage.setItem('ad_companies', JSON.stringify(companies));
      if (products) {
        const normalizedProds = products.map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          companyId: p.company_id,
          category: p.category,
          description: p.description || '',
          techSpecs: p.tech_specs || '',
          imageUrl: p.image_url || '',
          archived: p.archived === true
        }));
        localStorage.setItem('ad_products', JSON.stringify(normalizedProds));
      }
      if (settings && settings[0]) {
        const s = settings[0];
        localStorage.setItem('ad_settings', JSON.stringify({
          upiId: s.upi_id,
          upiName: s.upi_name,
          companyName: s.company_name,
          companyAddress: s.company_address,
          companyContact: s.company_contact,
          companyEmail: s.company_email,
          companyGst: s.company_gst,
          allowPayNow: s.allow_pay_now !== false,
          allowPayLater: s.allow_pay_later !== false,
          upiQrCode: s.upi_qr_code || '',
          companyLogo: s.company_logo || '',
          companyWhatsapp: s.company_whatsapp || '',
          companyRegistration: s.company_registration || ''
        }));
      }

      if (sessionUser) {
        // Authenticated data queries
        const { data: basePrices } = await supabase.from('variant_base_prices').select('*');
        const { data: orders } = await supabase.from('orders').select('*');
        const { data: orderItems } = await supabase.from('order_items').select('*');
        const { data: challans } = await supabase.from('delivery_challans').select('*');
        const { data: challanItems } = await supabase.from('delivery_challan_items').select('*');
        const { data: prices } = await supabase.from('dealer_prices').select('*');

        // Map base prices into authenticated variants
        if (basePrices) {
          variantsWithPrices = variantsWithPrices.map(v => {
            const bp = basePrices.find((p: any) => p.variant_id === v.id);
            return {
              ...v,
              price: bp ? Number(bp.price) : 0
            };
          });
        }

        if (orders) {
          const normalizedOrders = orders.map((o: any) => ({
            id: o.id,
            orderNumber: o.order_number,
            dealerId: o.dealer_id,
            dealerName: o.dealer_name,
            shopName: o.shop_name,
            date: o.order_date,
            subtotal: Number(o.subtotal),
            total: Number(o.total),
            paymentMethod: o.payment_method,
            paymentStatus: o.payment_status,
            orderStatus: o.order_status,
            createdAt: o.created_at
          }));
          localStorage.setItem('ad_orders', JSON.stringify(normalizedOrders));
        }

        if (orderItems) {
          const normalizedItems = orderItems.map((ii: any) => ({
            id: ii.id,
            orderId: ii.order_id,
            productId: ii.product_id,
            productName: ii.product_name,
            brand: ii.brand,
            variantId: ii.variant_id,
            packSize: ii.pack_size,
            price: Number(ii.price),
            quantity: ii.quantity,
            confirmed_quantity: ii.confirmed_quantity,
            cancelled_quantity: ii.cancelled_quantity,
            item_status: ii.item_status,
            cancellation_reason: ii.cancellation_reason || ''
          }));
          localStorage.setItem('ad_order_items', JSON.stringify(normalizedItems));
        }

        if (challans) {
          const localOrderItems = JSON.parse(localStorage.getItem('ad_order_items') || '[]');
          const normalizedChallans = challans.map((c: any) => {
            const itemsForChallan = (challanItems || [])
              .filter(ci => ci.challan_id === c.id)
              .map(ci => {
                const matchedItem = localOrderItems.find((oi: any) => oi.id === ci.order_item_id);
                if (matchedItem) {
                  return {
                    ...matchedItem,
                    quantity: ci.quantity
                  };
                }
                return null;
              })
              .filter(Boolean);

            return {
              id: c.id,
              challanNumber: c.challan_number,
              orderId: c.order_id,
              dealerId: c.dealer_id,
              dispatchDate: c.dispatch_date,
              businessSnapshot: c.business_snapshot,
              dealerSnapshot: c.dealer_snapshot,
              itemsSnapshot: itemsForChallan,
              transportDetails: {
                transportThrough: c.transport_through,
                vehicleNumber: c.vehicle_number,
                driverName: c.driver_name,
                dispatchLocation: c.dispatch_location,
                deliveryLocation: c.delivery_location
              },
              hamali: Number(c.hamali),
              bhada: Number(c.bhada),
              otherCharges: Number(c.other_charges),
              createdAt: c.created_at
            };
          });
          localStorage.setItem('ad_delivery_challans', JSON.stringify(normalizedChallans));
        }

        if (prices) {
          const normalizedPrices = prices.map((dp: any) => ({
            dealerId: dp.dealer_id,
            variantId: dp.variant_id,
            price: Number(dp.price)
          }));
          localStorage.setItem('ad_dealer_prices', JSON.stringify(normalizedPrices));
        }

        if (sessionUser.role === 'admin') {
          const { data: dealers } = await supabase.from('profiles').select('*').eq('role', 'dealer');
          if (dealers) {
            const normalizedDealers = dealers.map((d: any) => ({
              id: d.id,
              role: d.role,
              name: d.name,
              shopName: d.shop_name,
              mobile: d.mobile,
              email: d.email,
              address: d.address || '',
              gstNumber: d.gst_number || '',
              createdAt: d.created_at,
              status: d.status || 'active'
            }));
            localStorage.setItem('ad_dealers', JSON.stringify(normalizedDealers));
          }
        }
      }

      localStorage.setItem('ad_product_variants', JSON.stringify(variantsWithPrices));
      console.log('[Sync] Local storage synchronized successfully with Supabase');
    } catch (error) {
      console.warn('[Sync] Sync connection deferred (running offline):', error);
    }
  },

  // --- AUTHENTICATION ---
  async login(loginVal: string, passwordVal?: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    initLocalStorage();
    const cleanLogin = loginVal.trim().toLowerCase();
    
    if (!isSupabaseConfigured()) {
      console.warn("[Auth] Supabase is unconfigured. Falling back to local offline authentication.");
      return this.localLogin(cleanLogin, passwordVal);
    }

    try {
      // Check if email or mobile
      const isEmail = cleanLogin.includes('@');
      let emailToSignIn = cleanLogin;
      
      if (isEmail) {
        // If it's a dealer's real email, resolve it to their synthetic Auth email first
        if (cleanLogin !== 'admin@shubhamkrishisewa.com') {
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('mobile')
            .eq('email', cleanLogin)
            .maybeSingle();
            
          if (profileErr) {
            console.error("[Auth] Profile email lookup failed:", profileErr);
            return { success: false, error: "Unable to connect to the server. Please try again." };
          }
          if (profile && profile.mobile) {
            emailToSignIn = getDealerAuthEmail(profile.mobile);
          }
        }
      } else {
        // Mobile login lookup via public RPC
        const { data: foundEmail, error: rpcError } = await supabase.rpc('get_email_by_mobile', { mobile_number: cleanLogin });
        if (rpcError) {
          console.error("[Auth] RPC error:", rpcError);
          return { success: false, error: "Unable to connect to the server. Please try again." };
        }
        if (!foundEmail) {
          return { success: false, error: "Dealer account not found. Please register first." };
        }
        emailToSignIn = foundEmail;
      }

      // Call Supabase auth with the user-defined password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToSignIn,
        password: passwordVal || ''
      });

      if (authError) {
        console.warn("[Auth] Supabase Auth sign-in failed:", authError.message);
        if (authError.message.includes('Failed to fetch') || authError.message.includes('NetworkError')) {
          return { success: false, error: "Unable to connect to the server. Please try again." };
        }
        return { success: false, error: "Invalid mobile/email or password." };
      }

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error("[Auth] Profile fetch failed:", profileError);
        return { success: false, error: 'Failed to load user profile: ' + (profileError?.message || 'Profile not found') };
      }

      const user: UserProfile = {
        id: profile.id,
        role: profile.role,
        name: profile.name,
        shopName: profile.shop_name || '',
        mobile: profile.mobile,
        email: profile.email,
        address: profile.address || '',
        gstNumber: profile.gst_number || '',
        createdAt: profile.created_at,
        status: profile.status || 'active'
      };

      localStorage.setItem('ad_session', JSON.stringify(user));
      
      // Sync all database tables immediately
      await this.syncFromSupabase();
      
      return { success: true, user };
    } catch (err: any) {
      console.warn("[Auth] Supabase connection failed. Falling back to local offline authentication:", err);
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
        return { success: false, error: "Unable to connect to the server. Please try again." };
      }
      return this.localLogin(cleanLogin, passwordVal);
    }
  },

  async register(dealerData: Omit<UserProfile, 'id' | 'role' | 'createdAt'>, passwordVal: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    initLocalStorage();
    
    if (!isSupabaseConfigured()) {
      console.warn("[Register] Supabase is unconfigured. Falling back to local offline registration.");
      return this.localRegister(dealerData);
    }

    try {
      const cleanMobile = dealerData.mobile.replace(/\D/g, '').slice(-10);
      const authEmail = getDealerAuthEmail(cleanMobile);
      const emailToStore = dealerData.email ? dealerData.email.trim().toLowerCase() : authEmail;

      // 1. Check if mobile already exists in profiles
      const { data: existingMobile, error: mobileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('mobile', cleanMobile);
        
      if (mobileCheckError) {
        console.error("[Register] Mobile check failed:", mobileCheckError);
        return { success: false, error: "Unable to connect to the server. Please try again." };
      }
      if (existingMobile && existingMobile.length > 0) {
        return { success: false, error: "This mobile number is already registered. Please login." };
      }

      // 2. Check if email already exists in profiles (if real email provided)
      if (dealerData.email) {
        const cleanEmail = dealerData.email.trim().toLowerCase();
        const { data: existingEmail, error: emailCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', cleanEmail);
          
        if (emailCheckError) {
          console.error("[Register] Email check failed:", emailCheckError);
          return { success: false, error: "Unable to connect to the server. Please try again." };
        }
        if (existingEmail && existingEmail.length > 0) {
          return { success: false, error: "This email address is already registered. Please login." };
        }
      }

      // 3. Sign up in Supabase Auth using the user created password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: passwordVal
      });

      if (authError || !authData.user) {
        console.error("[Register] Supabase Auth error:", authError);
        if (authError?.message?.includes('rate limit')) {
          return { success: false, error: "Registration rate limit exceeded. Please try again in a few minutes." };
        }
        return { success: false, error: "Unable to create your account. Please check your mobile number and try again." };
      }

      // 4. Insert profile row
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          role: 'dealer',
          name: dealerData.name,
          shop_name: dealerData.shopName,
          mobile: cleanMobile,
          email: emailToStore,
          address: dealerData.address,
          gst_number: dealerData.gstNumber,
          status: 'active'
        });

      if (profileError) {
        console.error("[Register] Profile registration insert failed:", profileError);
        return { success: false, error: "Unable to create your account. Please check your mobile number and try again." };
      }

      const user: UserProfile = {
        id: authData.user.id,
        role: 'dealer',
        name: dealerData.name,
        shopName: dealerData.shopName,
        mobile: cleanMobile,
        email: emailToStore,
        address: dealerData.address,
        gstNumber: dealerData.gstNumber,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      // If registering for another dealer (e.g. seeded by admin), do NOT overwrite current admin/dealer session!
      const currentSession = this.getCurrentSession();
      if (!currentSession || currentSession.role !== 'admin') {
        localStorage.setItem('ad_session', JSON.stringify(user));
      }
      
      // Sync from Supabase immediately
      await this.syncFromSupabase();

      return { success: true, user };
    } catch (err: any) {
      console.warn("[Register] Supabase connection failed. Falling back to local offline registration:", err);
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
        return { success: false, error: "Unable to connect to the server. Please try again." };
      }
      return this.localRegister(dealerData);
    }
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem('ad_session');
    // Clear dynamic data in localStorage but keep catalog cache for guest browsing
    localStorage.removeItem('ad_orders');
    localStorage.removeItem('ad_order_items');
    localStorage.removeItem('ad_delivery_challans');
    localStorage.removeItem('ad_dealer_prices');
  },

  getCurrentSession(): UserProfile | null {
    const sessionStr = localStorage.getItem('ad_session');
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr);
    } catch {
      return null;
    }
  },

  // --- PRODUCTS ---
  getProducts(includeArchived = false): Product[] {
    initLocalStorage();
    const products: Product[] = JSON.parse(localStorage.getItem('ad_products') || '[]');
    const allVariants: ProductVariant[] = JSON.parse(localStorage.getItem('ad_product_variants') || '[]');
    
    let list = products;
    if (!includeArchived) {
      list = products.filter(p => !p.archived);
    }
    
    return list.map(p => {
      let vList = allVariants.filter(v => v.productId === p.id);
      if (!includeArchived) {
        vList = vList.filter(v => !v.archived);
      }
      return {
        ...p,
        variants: vList
      };
    });
  },

  async addProduct(productData: Omit<Product, 'id' | 'archived'>): Promise<{ success: boolean; product?: Product; error?: string }> {
    await this.ensureAdminAuth();
    const { variants, ...parentData } = productData as any;
    
    // Insert parent product
    const { data: insertedProduct, error: productError } = await supabase
      .from('products')
      .insert({
        company_id: parentData.companyId || null,
        name: parentData.name,
        brand: parentData.brand,
        category: parentData.category,
        description: parentData.description,
        tech_specs: parentData.techSpecs,
        image_url: parentData.imageUrl || '',
        archived: false
      })
      .select()
      .single();

    if (productError || !insertedProduct) {
      return { success: false, error: "Failed to create product: " + productError?.message };
    }

    // Insert variants
    if (variants && Array.isArray(variants)) {
      const variantsToInsert = variants.map((v, idx) => ({
        product_id: insertedProduct.id,
        pack_size: Number(v.packSize),
        unit: v.unit,
        sku: v.sku || `SKU-${Date.now()}-${idx}`,
        available: v.available !== false,
        archived: v.archived === true,
        image_url: v.imageUrl || null
      }));

      const { data: insertedVariants, error: variantError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert)
        .select();

      if (variantError) {
        return { success: false, error: "Product created but variants failed: " + variantError.message };
      }

      // Handle base price insertion
      if (insertedVariants) {
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          const matchedInserted = insertedVariants.find(iv => iv.sku === v.sku);
          if (matchedInserted) {
            await supabase.from('variant_base_prices').insert({
              variant_id: matchedInserted.id,
              price: Number(v.price)
            });

            // Handle custom pricing if present
            if (v.dealerPrices && Object.keys(v.dealerPrices).length > 0) {
              await this.saveDealerPricesForVariant(matchedInserted.id, v.dealerPrices);
            }
          }
        }
      }
    }

    await this.syncFromSupabase();
    return { success: true };
  },

  async updateProduct(product: Product): Promise<{ success: boolean; error?: string }> {
    await this.ensureAdminAuth();
    const { variants, ...parentData } = product as any;

    // Update parent product
    const { error: productError } = await supabase
      .from('products')
      .update({
        company_id: parentData.companyId || null,
        name: parentData.name,
        brand: parentData.brand,
        category: parentData.category,
        description: parentData.description,
        tech_specs: parentData.techSpecs,
        image_url: parentData.imageUrl,
        archived: parentData.archived
      })
      .eq('id', product.id);

    if (productError) {
      return { success: false, error: "Failed to update product: " + productError.message };
    }

    if (variants && Array.isArray(variants)) {
      // Upsert variants
      for (const v of variants) {
        if (v.id && !v.id.startsWith('var-')) {
          // Update existing variant
          const { error: varError } = await supabase
            .from('product_variants')
            .update({
              sku: v.sku,
              pack_size: Number(v.packSize),
              unit: v.unit,
              available: v.available !== false,
              archived: v.archived === true
            })
            .eq('id', v.id);

          if (varError) return { success: false, error: "Failed to update variant: " + varError.message };
          
          // Update base price
          await supabase.from('variant_base_prices').upsert({
            variant_id: v.id,
            price: Number(v.price)
          }, { onConflict: 'variant_id' });

          if (v.dealerPrices) {
            await this.saveDealerPricesForVariant(v.id, v.dealerPrices);
          }
        } else {
          // Insert new variant
          const { data: newV, error: varError } = await supabase
            .from('product_variants')
            .insert({
              product_id: product.id,
              sku: v.sku || `SKU-${Date.now()}-${Math.random()}`,
              pack_size: Number(v.packSize),
              unit: v.unit,
              available: v.available !== false,
              archived: v.archived === true
            })
            .select()
            .single();

          if (varError) return { success: false, error: "Failed to insert variant: " + varError.message };
          
          if (newV) {
            // Insert base price
            await supabase.from('variant_base_prices').insert({
              variant_id: newV.id,
              price: Number(v.price)
            });

            if (v.dealerPrices) {
              await this.saveDealerPricesForVariant(newV.id, v.dealerPrices);
            }
          }
        }
      }
    }

    await this.syncFromSupabase();
    return { success: true };
  },

  // --- CSV BULK UPLOAD HANDLERS ---
  validateBulkUpload(csvText: string, currentZipFiles: Record<string, Blob>): BulkUploadPreviewResult {
    try {
      const parsed = parseCSVOrFWF(csvText);
      if (!parsed.headers || parsed.headers.length === 0) {
        return {
          success: false,
          rows: [],
          summary: { newProducts: 0, newVariants: 0, existingVariantsToUpdate: 0, imagesMatched: 0, warnings: 0, errors: 0 },
          errorsList: ["Empty or invalid CSV layout"]
        };
      }

      // Map header aliases
      const mappedHeaders = parsed.headers.map(h => {
        const lower = h.trim().toLowerCase();
        return ALIAS_MAP[lower] || h;
      });

      const required = [
        CANONICAL_FIELDS.PRODUCT_NAME,
        CANONICAL_FIELDS.COMPANY,
        CANONICAL_FIELDS.CATEGORY,
        CANONICAL_FIELDS.SKU,
        CANONICAL_FIELDS.PACK_SIZE,
        CANONICAL_FIELDS.UNIT,
        CANONICAL_FIELDS.PRICE
      ];

      const missing = required.filter(r => !mappedHeaders.includes(r));
      if (missing.length > 0) {
        return {
          success: false,
          rows: [],
          summary: { newProducts: 0, newVariants: 0, existingVariantsToUpdate: 0, imagesMatched: 0, warnings: 0, errors: 0 },
          errorsList: [`Missing required columns: ${missing.join(', ')}`]
        };
      }

      const prodNameIdx = mappedHeaders.indexOf(CANONICAL_FIELDS.PRODUCT_NAME);
      const companyIdx = mappedHeaders.indexOf(CANONICAL_FIELDS.COMPANY);
      const categoryIdx = mappedHeaders.indexOf(CANONICAL_FIELDS.CATEGORY);
      const skuIdx = mappedHeaders.indexOf(CANONICAL_FIELDS.SKU);
      const variantNameIdx = mappedHeaders.indexOf(CANONICAL_FIELDS.VARIANT_NAME);
      const packSizeIdx = mappedHeaders.indexOf(CANONICAL_FIELDS.PACK_SIZE);
      const unitIdx = mappedHeaders.indexOf(CANONICAL_FIELDS.UNIT);
      const imageIdx = mappedHeaders.indexOf(CANONICAL_FIELDS.IMAGE_FILE);
      const statusIdx = mappedHeaders.indexOf(CANONICAL_FIELDS.STATUS);
      const priceIdx = mappedHeaders.indexOf(CANONICAL_FIELDS.PRICE);
      const descIdx = mappedHeaders.indexOf(CANONICAL_FIELDS.DESCRIPTION);
      const techSpecsIdx = mappedHeaders.indexOf(CANONICAL_FIELDS.TECH_SPECS);

      const localProducts: Product[] = JSON.parse(localStorage.getItem('ad_products') || '[]');
      const localVariants: ProductVariant[] = JSON.parse(localStorage.getItem('ad_product_variants') || '[]');

      const resultRows: BulkUploadRowPreview[] = [];
      let newProductsCount = 0;
      let newVariantsCount = 0;
      let updateVariantsCount = 0;
      let imagesMatchedCount = 0;
      let totalWarnings = 0;
      let totalErrors = 0;

      // Keep track of products we are creating in this batch to avoid double counting
      const uniqueBatchProducts = new Set<string>();

      for (let i = 0; i < parsed.rows.length; i++) {
        const fields = parsed.rows[i];
        const rowNum = i + 2; // 1-based index plus header

        const productName = fields[prodNameIdx]?.trim() || "";
        const companyName = fields[companyIdx]?.trim() || "";
        const category = fields[categoryIdx]?.trim() || "";
        const sku = fields[skuIdx]?.trim() || "";
        const packSizeStr = fields[packSizeIdx]?.trim() || "";
        const unit = fields[unitIdx]?.trim() || "";
        const priceStr = fields[priceIdx]?.trim() || "";
        const imageFile = imageIdx !== -1 ? fields[imageIdx]?.trim() : "";
        const status = statusIdx !== -1 ? fields[statusIdx]?.trim() || "Active" : "Active";
        const variantName = variantNameIdx !== -1 && fields[variantNameIdx] ? fields[variantNameIdx].trim() : `${packSizeStr} ${unit}`;
        const description = descIdx !== -1 ? fields[descIdx]?.trim() || "" : "";
        const techSpecs = techSpecsIdx !== -1 ? fields[techSpecsIdx]?.trim() || "" : "";

        let details = "";
        let isError = false;
        let isWarning = false;

        if (!productName) { isError = true; details += "Product Name is required. "; }
        if (!companyName) { isError = true; details += "Company is required. "; }
        if (!sku) { isError = true; details += "SKU is required. "; }
        if (!packSizeStr || isNaN(Number(packSizeStr)) || Number(packSizeStr) <= 0) { isError = true; details += "Valid Pack Size is required. "; }
        if (!unit) { isError = true; details += "Unit is required. "; }
        if (!priceStr || isNaN(Number(priceStr)) || Number(priceStr) <= 0) { isError = true; details += "Valid Price is required. "; }

        let action: BulkUploadRowPreview['action'] = 'CREATE';

        if (!isError) {
          // Check if SKU exists
          const existingVar = localVariants.find(v => v.sku.toLowerCase() === sku.toLowerCase());
          if (existingVar) {
            action = 'UPDATE';
            updateVariantsCount++;
            
            // Check if matches existing parent product brand
            const parentProduct = localProducts.find(p => p.id === existingVar.productId);
            if (parentProduct && parentProduct.brand.toLowerCase() !== companyName.toLowerCase()) {
              isWarning = true;
              details += `SKU already matches company "${parentProduct.brand}" but CSV lists "${companyName}". Will be re-mapped. `;
            }
          } else {
            newVariantsCount++;
            // Check if parent product exists by (company, name)
            const parentProduct = localProducts.find(p => 
              p.name.toLowerCase() === productName.toLowerCase() && 
              p.brand.toLowerCase() === companyName.toLowerCase()
            );
            const batchKey = `${companyName.toLowerCase()}||${productName.toLowerCase()}`;
            if (!parentProduct && !uniqueBatchProducts.has(batchKey)) {
              newProductsCount++;
              uniqueBatchProducts.add(batchKey);
            }
          }

          // Check image matching
          if (imageFile) {
            const cleanImgName = imageFile.trim().toLowerCase();
            if (currentZipFiles[cleanImgName]) {
              imagesMatchedCount++;
            } else {
              isWarning = true;
              details += "Image file not found in ZIP (running offline fallback for image). ";
            }
          }
        }

        let valStatus: BulkUploadRowPreview['validationStatus'] = 'VALID';
        if (isError) {
          valStatus = 'ERROR';
          action = 'ERROR';
          totalErrors++;
        } else if (isWarning) {
          valStatus = 'WARNING';
          action = 'WARNING';
          totalWarnings++;
        }

        resultRows.push({
          rowNum,
          action,
          productName,
          companyName,
          category,
          variantName,
          packSize: packSizeStr,
          unit,
          sku,
          price: priceStr,
          imageFile,
          status,
          validationStatus: valStatus,
          details: details || "Ready to import",
          description,
          techSpecs
        });
      }

      return {
        success: true,
        rows: resultRows,
        summary: {
          newProducts: newProductsCount,
          newVariants: newVariantsCount,
          existingVariantsToUpdate: updateVariantsCount,
          imagesMatched: imagesMatchedCount,
          warnings: totalWarnings,
          errors: totalErrors
        },
        errorsList: []
      };
    } catch (err: any) {
      return {
        success: false,
        rows: [],
        summary: { newProducts: 0, newVariants: 0, existingVariantsToUpdate: 0, imagesMatched: 0, warnings: 0, errors: 0 },
        errorsList: ["Failed to validate: " + err.message]
      };
    }
  },

  async bulkUploadProducts(csvText: string, zipFilesMap: Record<string, Blob>): Promise<{
    success: boolean;
    productsCreated: number;
    productsUpdated: number;
    variantsCreated: number;
    variantsUpdated: number;
    imagesImported: number;
    errors: string[];
  }> {
    if (!isSupabaseConfigured()) {
      console.warn("[BulkUpload] Supabase is unconfigured. Performing local catalogue upload.");
      return Promise.resolve(this.localBulkUploadProducts(csvText, zipFilesMap));
    }

    await this.ensureAdminAuth();

    try {
      const valRes = this.validateBulkUpload(csvText, zipFilesMap);
      if (!valRes.success || valRes.summary.errors > 0) {
        return {
          success: false,
          productsCreated: 0,
          productsUpdated: 0,
          variantsCreated: 0,
          variantsUpdated: 0,
          imagesImported: 0,
          errors: valRes.errorsList.concat(valRes.rows.filter((r: any) => r.validationStatus === 'ERROR').map((r: any) => `Row ${r.rowNum}: ${r.details}`))
        };
      }

      // Fetch all companies, products, variants from Supabase
      const { data: dbCompanies } = await supabase.from('companies').select('*');
      const { data: dbProducts } = await supabase.from('products').select('*');
      const { data: dbVariants } = await supabase.from('product_variants').select('*');

      const companyMap = new Map<string, string>(); // name -> id
      if (dbCompanies) {
        dbCompanies.forEach(c => companyMap.set(c.name.toLowerCase().trim(), c.id));
      }

      const productMap = new Map<string, string>(); // "companyId||productName" -> id
      if (dbProducts) {
        dbProducts.forEach(p => productMap.set(`${p.company_id}||${p.name.toLowerCase().trim()}`, p.id));
      }

      const variantMap = new Map<string, any>(); // sku -> variant row
      if (dbVariants) {
        dbVariants.forEach(v => variantMap.set(v.sku.toLowerCase().trim(), v));
      }

      let productsCreated = 0;
      let productsUpdated = 0;
      let variantsCreated = 0;
      let variantsUpdated = 0;
      let imagesImported = 0;

      // Process row by row
      for (const row of valRes.rows) {
        if (row.validationStatus === 'ERROR') continue;

        // 1. Resolve Company
        const normCompany = row.companyName.toLowerCase().trim();
        let companyId = companyMap.get(normCompany);
        if (!companyId) {
          // Create company
          const { data: insertedComp, error: compError } = await supabase
            .from('companies')
            .insert({
              name: row.companyName,
              logo: getCompanyPlaceholderLogo(row.companyName),
              status: 'active'
            })
            .select()
            .single();

          if (compError || !insertedComp) {
            throw new Error(`Failed to create company "${row.companyName}": ${compError?.message}`);
          }
          companyId = insertedComp.id;
          companyMap.set(normCompany, companyId!);
        }

        // 2. Resolve Image
        let imageUrl = '';
        if (row.imageFile) {
          const cleanImg = row.imageFile.trim();
          const lowerImg = cleanImg.toLowerCase();
          if (zipFilesMap[lowerImg]) {
            const blob = zipFilesMap[lowerImg];
            await ImageStorageService.saveImage(cleanImg, blob);
            imageUrl = cleanImg;
            imagesImported++;
          } else {
            imageUrl = cleanImg;
          }
        }

        // 3. Resolve Product
        const normProdName = row.productName.toLowerCase().trim();
        const prodKey = `${companyId}||${normProdName}`;
        let productId = productMap.get(prodKey);
        let productWasCreated = false;
        
        if (!productId) {
          // Create Product
          const { data: insertedProd, error: prodError } = await supabase
            .from('products')
            .insert({
              company_id: companyId,
              name: row.productName,
              brand: row.companyName,
              category: row.category || 'others',
              description: row.description || '',
              tech_specs: row.techSpecs || '',
              image_url: imageUrl || (row.imageFile ? `https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500` : ''),
              archived: false
            })
            .select()
            .single();

          if (prodError || !insertedProd) {
            throw new Error(`Failed to create product "${row.productName}": ${prodError?.message}`);
          }
          productId = insertedProd.id;
          productMap.set(prodKey, productId!);
          productsCreated++;
          productWasCreated = true;
        } else if (imageUrl) {
          // Update product's image_url if we have a new one
          const { error: prodUpdateError } = await supabase
            .from('products')
            .update({ image_url: imageUrl })
            .eq('id', productId);

          if (prodUpdateError) {
            console.error(`Failed to update product image for "${row.productName}":`, prodUpdateError.message);
          }
        }

        // 4. Resolve Variant & Base Price
        const normSku = row.sku.toLowerCase().trim();
        const existingVar = variantMap.get(normSku);

        if (existingVar) {
          // Update variant
          const { error: varError } = await supabase
            .from('product_variants')
            .update({
              product_id: productId,
              pack_size: Number(row.packSize),
              unit: row.unit,
              available: row.status.toLowerCase() === 'active',
              image_url: imageUrl || existingVar.image_url
            })
            .eq('id', existingVar.id);

          if (varError) {
            throw new Error(`Failed to update variant with SKU "${row.sku}": ${varError.message}`);
          }

          // Update Base Price
          const { error: priceError } = await supabase
            .from('variant_base_prices')
            .upsert({
              variant_id: existingVar.id,
              price: Number(row.price)
            }, { onConflict: 'variant_id' });

          if (priceError) {
            throw new Error(`Failed to update base price for SKU "${row.sku}": ${priceError.message}`);
          }

          variantsUpdated++;
          if (!productWasCreated) productsUpdated++;
        } else {
          // Insert variant
          const { data: insertedVar, error: varError } = await supabase
            .from('product_variants')
            .insert({
              product_id: productId,
              sku: row.sku,
              pack_size: Number(row.packSize),
              unit: row.unit,
              available: row.status.toLowerCase() === 'active',
              archived: false,
              image_url: imageUrl
            })
            .select()
            .single();

          if (varError || !insertedVar) {
            throw new Error(`Failed to insert variant with SKU "${row.sku}": ${varError?.message}`);
          }

          // Insert Base Price
          const { error: priceError } = await supabase
            .from('variant_base_prices')
            .insert({
              variant_id: insertedVar.id,
              price: Number(row.price)
            });

          if (priceError) {
            throw new Error(`Failed to create base price for SKU "${row.sku}": ${priceError.message}`);
          }

          variantsCreated++;
        }
      }

      // Synchronize changes to local cache immediately
      await this.syncFromSupabase();

      return {
        success: true,
        productsCreated,
        productsUpdated,
        variantsCreated,
        variantsUpdated,
        imagesImported,
        errors: []
      };
    } catch (err: any) {
      return {
        success: false,
        productsCreated: 0,
        productsUpdated: 0,
        variantsCreated: 0,
        variantsUpdated: 0,
        imagesImported: 0,
        errors: [err.message || "Unknown import error"]
      };
    }
  },

  async archiveProduct(id: string): Promise<{ success: boolean; error?: string }> {
    await this.ensureAdminAuth();
    const { error } = await supabase
      .from('products')
      .update({ archived: true })
      .eq('id', id);
    
    if (error) return { success: false, error: error.message };
    await this.syncFromSupabase();
    return { success: true };
  },

  async restoreProduct(id: string): Promise<{ success: boolean; error?: string }> {
    await this.ensureAdminAuth();
    const { error } = await supabase
      .from('products')
      .update({ archived: false })
      .eq('id', id);
    
    if (error) return { success: false, error: error.message };
    await this.syncFromSupabase();
    return { success: true };
  },

  // --- ORDERS ---
  getOrders(userId: string, role: 'admin' | 'dealer'): Order[] {
    initLocalStorage();
    const orders: Order[] = JSON.parse(localStorage.getItem('ad_orders') || '[]');
    const items: OrderItem[] = JSON.parse(localStorage.getItem('ad_order_items') || '[]');
    
    let userOrders = role === 'admin' ? orders : orders.filter(o => o.dealerId === userId);
    
    userOrders = userOrders.map(order => {
      const orderItems = items.filter(item => item.orderId === order.id).map(item => {
        const confirmed = item.confirmed_quantity !== undefined ? item.confirmed_quantity : (order.orderStatus === 'cancelled' ? 0 : item.quantity);
        const cancelled = item.cancelled_quantity !== undefined ? item.cancelled_quantity : (order.orderStatus === 'cancelled' ? item.quantity : 0);
        const status = item.item_status || (order.orderStatus === 'cancelled' ? 'cancelled' : (order.orderStatus === 'new' ? 'pending' : 'confirmed'));
        return {
          ...item,
          confirmed_quantity: confirmed,
          cancelled_quantity: cancelled,
          item_status: status,
          cancellation_reason: item.cancellation_reason || ''
        };
      });
      return { ...order, items: orderItems };
    });
    
    return userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createOrder(orderData: {
    dealerId: string;
    dealerName: string;
    shopName: string;
    paymentMethod: 'pay_now' | 'pay_later';
    subtotal: number;
    total: number;
  }, cartItems: { product: Product; variant: ProductVariant; quantity: number }[]): Promise<{ success: boolean; order?: Order; error?: string }> {
    
    const { data: countData, error: countError } = await supabase
      .from('orders')
      .select('id', { count: 'exact' });

    if (countError) return { success: false, error: "Failed to generate order number" };
    
    const nextNum = (countData?.length || 0) + 1;
    const orderNumber = 'ORD-' + String(1000 + nextNum);
    const paymentStatus = orderData.paymentMethod === 'pay_now' ? 'paid' : 'pending';

    // Insert order header
    const { data: insertedOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        dealer_id: orderData.dealerId,
        dealer_name: orderData.dealerName,
        shop_name: orderData.shopName,
        order_status: 'new',
        payment_status: paymentStatus,
        payment_method: orderData.paymentMethod,
        subtotal: orderData.subtotal,
        total: orderData.total
      })
      .select()
      .single();

    if (orderError || !insertedOrder) {
      return { success: false, error: "Failed to place order header: " + orderError?.message };
    }

    // Insert order items
    const itemsToInsert = cartItems.map((item) => ({
      order_id: insertedOrder.id,
      product_id: item.product.id,
      product_name: item.product.name,
      brand: item.product.brand,
      variant_id: item.variant.id,
      pack_size: `${item.variant.packSize} ${item.variant.unit}`,
      price: item.variant.price,
      quantity: item.quantity,
      confirmed_quantity: item.quantity,
      cancelled_quantity: 0,
      item_status: 'pending',
      cancellation_reason: ''
    }));

    const { data: insertedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      return { success: false, error: "Order placed but items failed: " + itemsError.message };
    }

    await this.syncFromSupabase();

    // Map database properties back to original Order interface
    const order: Order = {
      id: insertedOrder.id,
      orderNumber: insertedOrder.order_number,
      dealerId: insertedOrder.dealer_id,
      dealerName: insertedOrder.dealer_name,
      shopName: insertedOrder.shop_name,
      date: insertedOrder.order_date,
      subtotal: Number(insertedOrder.subtotal),
      total: Number(insertedOrder.total),
      paymentMethod: insertedOrder.payment_method,
      paymentStatus: insertedOrder.payment_status,
      orderStatus: insertedOrder.order_status,
      createdAt: insertedOrder.created_at,
      items: insertedItems?.map((ii: any) => ({
        id: ii.id,
        orderId: ii.order_id,
        productId: ii.product_id,
        productName: ii.product_name,
        brand: ii.brand,
        variantId: ii.variant_id,
        packSize: ii.pack_size,
        price: Number(ii.price),
        quantity: ii.quantity,
        confirmed_quantity: ii.confirmed_quantity,
        cancelled_quantity: ii.cancelled_quantity,
        item_status: ii.item_status,
        cancellation_reason: ii.cancellation_reason || ''
      }))
    };

    return { success: true, order };
  },

  async updateOrderStatus(orderId: string, orderStatus: Order['orderStatus'], paymentStatus: Order['paymentStatus']): Promise<{ success: boolean; error?: string }> {
    await this.ensureAdminAuth();
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        order_status: orderStatus,
        payment_status: paymentStatus
      })
      .eq('id', orderId);

    if (orderError) return { success: false, error: orderError.message };

    if (orderStatus === 'cancelled') {
      const { data: currentItems } = await supabase.from('order_items').select('*').eq('order_id', orderId);
      if (currentItems) {
        for (const item of currentItems) {
          await supabase
            .from('order_items')
            .update({
              confirmed_quantity: 0,
              cancelled_quantity: item.quantity,
              item_status: 'cancelled',
              cancellation_reason: 'Order cancelled by administrator or dealer request'
            })
            .eq('id', item.id);
        }
      }
      await supabase.from('orders').update({ subtotal: 0, total: 0 }).eq('id', orderId);
    }

    await this.syncFromSupabase();
    return { success: true };
  },

  async confirmOrderItems(orderId: string, itemsData: { itemId: string; confirmedQuantity: number; cancellationReason: string }[]): Promise<{ success: boolean; error?: string }> {
    await this.ensureAdminAuth();
    for (const editData of itemsData) {
      const { data: item } = await supabase
        .from('order_items')
        .select('*')
        .eq('id', editData.itemId)
        .single();

      if (item) {
        const confirmed = editData.confirmedQuantity;
        const cancelled = item.quantity - confirmed;
        let status = 'confirmed';
        if (confirmed === 0) {
          status = 'cancelled';
        } else if (confirmed < item.quantity) {
          status = 'partially_confirmed';
        }

        await supabase
          .from('order_items')
          .update({
            confirmed_quantity: confirmed,
            cancelled_quantity: cancelled,
            item_status: status,
            cancellation_reason: cancelled > 0 ? editData.cancellationReason : ''
          })
          .eq('id', editData.itemId);
      }
    }

    const { data: currentOrderItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (currentOrderItems) {
      const allConfirmed = currentOrderItems.every(item => item.confirmed_quantity === item.quantity);
      const allCancelled = currentOrderItems.every(item => item.confirmed_quantity === 0);
      
      let computedStatus = 'partially_confirmed';
      if (allConfirmed) {
        computedStatus = 'confirmed';
      } else if (allCancelled) {
        computedStatus = 'cancelled';
      }

      const newSubtotal = currentOrderItems.reduce((sum, item) => sum + (Number(item.price) * (item.confirmed_quantity ?? 0)), 0);
      const newTotal = newSubtotal;

      await supabase
        .from('orders')
        .update({
          order_status: computedStatus,
          subtotal: newSubtotal,
          total: newTotal
        })
        .eq('id', orderId);
    }

    await this.syncFromSupabase();
    return { success: true };
  },

  // --- DEALERS ---
  getDealers(): UserProfile[] {
    initLocalStorage();
    return JSON.parse(localStorage.getItem('ad_dealers') || '[]');
  },

  getDealerDetails(dealerId: string): UserProfile | null {
    initLocalStorage();
    const dealers = this.getDealers();
    return dealers.find((d: UserProfile) => d.id === dealerId) || null;
  },

  // --- SETTINGS ---
  getSettings(): SystemSettings {
    initLocalStorage();
    return JSON.parse(localStorage.getItem('ad_settings') || JSON.stringify(DEFAULT_SETTINGS));
  },

  async updateSettings(settings: SystemSettings): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        id: 1, // single row enforcement
        upi_id: settings.upiId,
        upi_name: settings.upiName,
        company_name: settings.companyName,
        company_address: settings.companyAddress,
        company_contact: settings.companyContact,
        company_email: settings.companyEmail,
        company_gst: settings.companyGst,
        allow_pay_now: settings.allowPayNow,
        allow_pay_later: settings.allowPayLater,
        upi_qr_code: settings.upiQrCode || '',
        company_logo: settings.companyLogo || '',
        company_whatsapp: settings.companyWhatsapp || '',
        company_registration: settings.companyRegistration || ''
      });

    if (error) {
      console.error("Failed to update system settings:", error);
      return { success: false };
    }

    await this.syncFromSupabase();
    return { success: true };
  },

  // --- COMPANIES / BRANDS ---
  getCompanies(includeArchived = false): Company[] {
    initLocalStorage();
    const companies: Company[] = JSON.parse(localStorage.getItem('ad_companies') || '[]');
    if (includeArchived) {
      return companies;
    }
    return companies.filter(c => c.status === 'active');
  },

  async addCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; company?: Company; error?: string }> {
    await this.ensureAdminAuth();
    const { data: inserted, error } = await supabase
      .from('companies')
      .insert({
        name: companyData.name,
        logo: companyData.logo || getCompanyPlaceholderLogo(companyData.name),
        description: companyData.description || '',
        status: 'active'
      })
      .select()
      .single();

    if (error || !inserted) {
      return { success: false, error: error?.message || "Failed to create company" };
    }

    await this.syncFromSupabase();

    const company: Company = {
      id: inserted.id,
      name: inserted.name,
      logo: inserted.logo,
      description: inserted.description,
      status: inserted.status,
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at
    };

    return { success: true, company };
  },

  async updateCompany(company: Company): Promise<{ success: boolean; company?: Company; error?: string }> {
    await this.ensureAdminAuth();
    const { error } = await supabase
      .from('companies')
      .update({
        name: company.name,
        logo: company.logo,
        description: company.description,
        status: company.status
      })
      .eq('id', company.id);

    if (error) return { success: false, error: error.message };

    await this.syncFromSupabase();
    return { success: true, company };
  },

  async archiveCompany(id: string): Promise<{ success: boolean; error?: string }> {
    await this.ensureAdminAuth();
    const { error } = await supabase
      .from('companies')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    await this.syncFromSupabase();
    return { success: true };
  },

  async restoreCompany(id: string): Promise<{ success: boolean; error?: string }> {
    await this.ensureAdminAuth();
    const { error } = await supabase
      .from('companies')
      .update({ status: 'active' })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    await this.syncFromSupabase();
    return { success: true };
  },

  async deleteCompany(id: string): Promise<{ success: boolean; error?: string }> {
    await this.ensureAdminAuth();
    const { data: countProducts } = await supabase.from('products').select('id').eq('company_id', id);
    if (countProducts && countProducts.length > 0) {
      return { success: false, error: `Cannot delete company. This company has ${countProducts.length} products associated with it.` };
    }

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await this.syncFromSupabase();
    return { success: true };
  },

  getMigrationFlags(): { unmappedBrands: string[] } | null {
    const flagsStr = localStorage.getItem('ad_migration_flags');
    if (!flagsStr) return null;
    try {
      return JSON.parse(flagsStr);
    } catch {
      return null;
    }
  },

  async resolveMigration(brand: string, action: 'create' | 'map', targetCompanyId?: string): Promise<{ success: boolean; error?: string }> {
    const tempCompId = `comp-auto-${brand.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    if (action === 'create') {
      const { data: inserted } = await supabase
        .from('companies')
        .insert({
          id: tempCompId,
          name: brand,
          description: `${brand} agricultural solutions and crop health products.`,
          logo: getCompanyPlaceholderLogo(brand),
          status: 'active'
        })
        .select()
        .single();
      
      if (!inserted) {
        await this.addCompany({ name: brand });
      }
    } else if (action === 'map') {
      if (!targetCompanyId) return { success: false, error: "Target company is required" };
      const { data: targetComp } = await supabase.from('companies').select('*').eq('id', targetCompanyId).single();
      if (!targetComp) return { success: false, error: "Target company not found" };

      await supabase
        .from('products')
        .update({
          company_id: targetComp.id,
          brand: targetComp.name
        })
        .eq('company_id', tempCompId);

      await supabase
        .from('products')
        .update({
          company_id: targetComp.id,
          brand: targetComp.name
        })
        .eq('brand', brand);

      await supabase.from('companies').delete().eq('id', tempCompId);
    }

    const flagsStr = localStorage.getItem('ad_migration_flags');
    if (flagsStr) {
      try {
        const flags = JSON.parse(flagsStr);
        const unmappedIdx = flags.unmappedBrands.indexOf(brand);
        if (unmappedIdx !== -1) {
          flags.unmappedBrands.splice(unmappedIdx, 1);
          if (flags.unmappedBrands.length > 0) {
            localStorage.setItem('ad_migration_flags', JSON.stringify(flags));
          } else {
            localStorage.removeItem('ad_migration_flags');
          }
        }
      } catch (e) {
        // skip
      }
    }

    await this.syncFromSupabase();
    return { success: true };
  },

  getDealerPrice(dealerId: string | undefined, variant: ProductVariant): number {
    if (!dealerId) return 0;
    
    // Look up custom dealer price
    const dealerPrices = JSON.parse(localStorage.getItem('ad_dealer_prices') || '[]');
    const dp = dealerPrices.find((p: any) => 
      (p.dealerId === dealerId || p.dealer_id === dealerId) && 
      (p.variantId === variant.id || p.variant_id === variant.id)
    );
    
    if (dp && Number(dp.price) > 0) {
      return Number(dp.price);
    }
    
    return Number(variant.price) || 0;
  },

  getDealerPricesForVariant(variantId: string): Record<string, number> {
    const dealerPrices = JSON.parse(localStorage.getItem('ad_dealer_prices') || '[]');
    const result: Record<string, number> = {};
    dealerPrices.forEach((dp: any) => {
      if (dp.variantId === variantId || dp.variant_id === variantId) {
        result[dp.dealerId || dp.dealer_id] = dp.price;
      }
    });
    return result;
  },

  async saveDealerPricesForVariant(variantId: string, prices: Record<string, number>): Promise<void> {
    await supabase.from('dealer_prices').delete().eq('variant_id', variantId);
    
    const pricesToInsert = Object.entries(prices)
      .filter(([_, price]) => price > 0)
      .map(([dealerId, price]) => ({
        dealer_id: dealerId,
        variant_id: variantId,
        price: Number(price)
      }));

    if (pricesToInsert.length > 0) {
      await supabase.from('dealer_prices').insert(pricesToInsert);
    }

    await this.syncFromSupabase();
  },

  getDeliveryChallans(): DeliveryChallan[] {
    initLocalStorage();
    return JSON.parse(localStorage.getItem('ad_delivery_challans') || '[]');
  },

  getDeliveryChallanByOrderId(orderId: string): DeliveryChallan | null {
    const challans = this.getDeliveryChallans();
    return challans.find((c: DeliveryChallan) => c.orderId === orderId) || null;
  },

  getDeliveryChallan(challanId: string, currentUserId?: string, role?: 'admin' | 'dealer'): DeliveryChallan | null {
    const challans = this.getDeliveryChallans();
    const challan = challans.find((c: DeliveryChallan) => c.id === challanId || c.challanNumber === challanId) || null;
    if (!challan) return null;
    if (!role) return null;
    if (role === 'admin') return challan;
    if (role === 'dealer' && challan.dealerId === currentUserId) return challan;
    return null;
  },

  async createDeliveryChallan(
    orderId: string, 
    transportDetails?: {
      transportThrough?: string;
      vehicleNumber?: string;
      driverName?: string;
      dispatchLocation?: string;
      deliveryLocation?: string;
    }, 
    charges?: { hamali?: number; bhada?: number; otherCharges?: number }
  ): Promise<DeliveryChallan | null> {
    const { data: existing } = await supabase
      .from('delivery_challans')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existing) {
      return this.getDeliveryChallanByOrderId(orderId);
    }

    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);

    if (!order || !items) return null;

    const totalConfirmed = items.reduce((sum, item) => sum + item.confirmed_quantity, 0);
    if (order.order_status === 'cancelled' || totalConfirmed === 0) {
      return null;
    }

    const { data: countData } = await supabase.from('delivery_challans').select('id');
    const nextNum = (countData?.length || 0) + 1;
    const challanNumber = 'DC-' + String(nextNum).padStart(5, '0');

    const businessSnapshot = this.getSettings();
    const dealerDetails = this.getDealerDetails(order.dealer_id);
    const dealerSnapshot = dealerDetails || {
      id: order.dealer_id,
      role: 'dealer',
      name: order.dealer_name,
      shopName: order.shop_name,
      mobile: '',
      email: '',
      address: '',
      gstNumber: '',
      createdAt: ''
    };

    const confirmedItemsSnapshot = items
      .filter(item => item.confirmed_quantity > 0)
      .map(item => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        productName: item.product_name,
        brand: item.brand,
        variantId: item.variant_id,
        packSize: item.pack_size,
        price: Number(item.price),
        quantity: item.confirmed_quantity,
        confirmed_quantity: item.confirmed_quantity,
        cancelled_quantity: item.cancelled_quantity,
        item_status: item.item_status,
        cancellation_reason: item.cancellation_reason || ''
      }));

    const { data: insertedChallan, error: challanError } = await supabase
      .from('delivery_challans')
      .insert({
        challan_number: challanNumber,
        order_id: orderId,
        dealer_id: order.dealer_id,
        hamali: Number(charges?.hamali || 0),
        bhada: Number(charges?.bhada || 0),
        other_charges: Number(charges?.otherCharges || 0),
        transport_through: transportDetails?.transportThrough || null,
        vehicle_number: transportDetails?.vehicleNumber || null,
        driver_name: transportDetails?.driverName || null,
        dispatch_location: transportDetails?.dispatchLocation || null,
        delivery_location: transportDetails?.deliveryLocation || null,
        business_snapshot: businessSnapshot,
        dealer_snapshot: dealerSnapshot
      })
      .select()
      .single();

    if (challanError || !insertedChallan) {
      console.error("Failed to insert delivery challan:", challanError);
      return null;
    }

    const challanItemsToInsert = confirmedItemsSnapshot.map(item => ({
      challan_id: insertedChallan.id,
      order_item_id: item.id,
      quantity: item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('delivery_challan_items')
      .insert(challanItemsToInsert);

    if (itemsError) {
      console.error("Failed to insert challan items:", itemsError);
    }

    await this.updateOrderStatus(orderId, 'dispatched', order.payment_status);

    await this.syncFromSupabase();

    return this.getDeliveryChallanByOrderId(orderId);
  }
} as any;


const DB_NAME = 'agrodist_image_db';
const STORE_NAME = 'images';

function getIDBStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, mode);
      resolve(tx.objectStore(STORE_NAME));
    };
    request.onerror = () => reject(request.error);
  });
}

export const ImageStorageService = {
  async saveImage(fileName: string, blob: Blob): Promise<string> {
    const cleanName = fileName.trim().toLowerCase();
    const store = await getIDBStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(blob, cleanName);
      req.onsuccess = () => resolve(cleanName);
      req.onerror = () => reject(req.error);
    });
  },

  async getImageAsDataUrl(fileName: string): Promise<string | null> {
    if (!fileName) return null;
    if (fileName.startsWith('http://') || fileName.startsWith('https://') || fileName.startsWith('data:')) {
      return fileName;
    }
    const cleanName = fileName.trim().toLowerCase();
    try {
      const store = await getIDBStore('readonly');
      return new Promise((resolve) => {
        const req = store.get(cleanName);
        req.onsuccess = () => {
          const val = req.result;
          if (val instanceof Blob) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(val);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }
};

