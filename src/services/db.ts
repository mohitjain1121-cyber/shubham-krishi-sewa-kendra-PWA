// Simulated Database Layer (localStorage persistence) for Shubham Krishi Sewa Kendra PWA
import { BUSINESS_CONFIG, BUSINESS_INFO } from '../config/business';

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

const DEFAULT_COMPANIES: Company[] = [
  {
    id: "comp-seed-1",
    name: "Krishaj",
    logo: getCompanyPlaceholderLogo("Krishaj"),
    description: "Krishaj crop protection and growth enhancers.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-2",
    name: "BASF",
    logo: getCompanyPlaceholderLogo("BASF"),
    description: "Global chemical leader offering innovative agricultural solutions.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-3",
    name: "Rallis",
    logo: getCompanyPlaceholderLogo("Rallis"),
    description: "Tata enterprise specializing in agri inputs, seeds, and crop care.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-4",
    name: "Syngenta",
    logo: getCompanyPlaceholderLogo("Syngenta"),
    description: "Leading science-based agritech company for seeds and crop protection.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-5",
    name: "Bayer",
    logo: getCompanyPlaceholderLogo("Bayer"),
    description: "World-class health and nutrition company with innovative crop science.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-6",
    name: "Isagro",
    logo: getCompanyPlaceholderLogo("Isagro"),
    description: "Italian crop protection manufacturer with green agrochemicals focus.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-7",
    name: "Sumitomo Chemical",
    logo: getCompanyPlaceholderLogo("Sumitomo Chemical"),
    description: "Japanese multinational specializing in top-tier crop solutions.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-8",
    name: "Indo-Swiss",
    logo: getCompanyPlaceholderLogo("Indo-Swiss"),
    description: "Premium fertilisers and growth management solutions.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-9",
    name: "Indofil Industries Limited",
    logo: getCompanyPlaceholderLogo("Indofil Industries Limited"),
    description: "High quality crop protection and chemical synthesis products.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-10",
    name: "ADAMA",
    logo: getCompanyPlaceholderLogo("ADAMA"),
    description: "Comprehensive agricultural solutions and comprehensive crop protection.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-11",
    name: "UPL",
    logo: getCompanyPlaceholderLogo("UPL"),
    description: "Global provider of sustainable agricultural products and solutions.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-12",
    name: "Ghardha Chemicals Limited",
    logo: getCompanyPlaceholderLogo("Ghardha Chemicals Limited"),
    description: "Leading manufacturer of high-quality agrochemicals and pigments.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-13",
    name: "PI Agri Input",
    logo: getCompanyPlaceholderLogo("PI Agri Input"),
    description: "Premium chemicals and tech services for agricultural efficiency.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-14",
    name: "Mahindra",
    logo: getCompanyPlaceholderLogo("Mahindra"),
    description: "Indian conglomerate serving farming with seeds and machinery.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-15",
    name: "Nath Seeds",
    logo: getCompanyPlaceholderLogo("Nath Seeds"),
    description: "High yielding hybrid seeds and crop variety developer.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-16",
    name: "Atul",
    logo: getCompanyPlaceholderLogo("Atul"),
    description: "Eco-friendly crop protection chemicals and fertilizers.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-17",
    name: "Godrej Agrovet",
    logo: getCompanyPlaceholderLogo("Godrej Agrovet"),
    description: "Diversified agri-business offering seeds, animal feed, and protection.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-18",
    name: "Nagarjuna",
    logo: getCompanyPlaceholderLogo("Nagarjuna"),
    description: "Leading fertilizer and chemical manufacturer in South India.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-19",
    name: "Dow",
    logo: getCompanyPlaceholderLogo("Dow"),
    description: "Science-based crop defense and material solutions.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-20",
    name: "DuPont",
    logo: getCompanyPlaceholderLogo("DuPont"),
    description: "Specialized crop protection and high-yielding agriculture seeds.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-21",
    name: "NSC",
    logo: getCompanyPlaceholderLogo("NSC"),
    description: "National Seeds Corporation of India - High-standard seed provider.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-22",
    name: "Shakti Vardhak Hybrid Seeds Pvt. Ltd.",
    logo: getCompanyPlaceholderLogo("Shakti Vardhak Hybrid Seeds Pvt. Ltd."),
    description: "Shakti Vardhak hybrid seeds for field crops and vegetables.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "comp-seed-23",
    name: "FMC",
    logo: getCompanyPlaceholderLogo("FMC"),
    description: "FMC Corporation is an agricultural sciences company.",
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  // Company A -> 5 products
  {
    id: "prod-1",
    name: "Glyphosate 41% SL (SuperWeed)",
    brand: "Monsanto",
    companyId: "comp-1",
    category: "Herbicides",
    description: "Broad-spectrum systemic herbicide for control of annual and perennial weeds in non-crop areas, orchards and plantations.",
    techSpecs: "Glyphosate isopropylamine salt 41% w/w",
    imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&auto=format&fit=crop&q=60",
    archived: false
  },
  {
    id: "prod-7",
    name: "Paraquat Dichloride 24% SL (WeedKill)",
    brand: "Monsanto",
    companyId: "comp-1",
    category: "Herbicides",
    description: "Quick acting non-selective contact herbicide for control of broad-leaved weeds and grasses in agricultural crops.",
    techSpecs: "Paraquat dichloride 24% w/w",
    imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500&auto=format&fit=crop&q=60",
    archived: false
  },
  {
    id: "prod-8",
    name: "Neem Gold Bio-Insecticide",
    brand: "Monsanto",
    companyId: "comp-1",
    category: "Insecticides",
    description: "Natural organic botanical pesticide derived from pure neem oil seeds, effective against leaf eating pests.",
    techSpecs: "Azadirachtin 0.03% EC (300 ppm)",
    imageUrl: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=500&auto=format&fit=crop&q=60",
    archived: false
  },
  {
    id: "prod-9",
    name: "NPK 19-19-19 Growth Booster",
    brand: "Monsanto",
    companyId: "comp-1",
    category: "Fertilizers",
    description: "Water soluble fertilizer containing essential macronutrients nitrogen, phosphorus, and potassium in balanced ratio.",
    techSpecs: "Total Nitrogen 19%, Phosphate 19%, Potash 19%",
    imageUrl: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=500&auto=format&fit=crop&q=60",
    archived: false
  },
  {
    id: "prod-10",
    name: "Hybrid Tomato Seeds",
    brand: "Monsanto",
    companyId: "comp-1",
    category: "Seeds",
    description: "Premium high-yielding hybrid seeds with disease resistance, producing juicy sweet tomato fruits.",
    techSpecs: "Tomato Hybrid F1 Seeds, Germination 85% Min",
    imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&auto=format&fit=crop&q=60",
    archived: false
  },

  // Company B -> 4 products
  {
    id: "prod-2",
    name: "Imidacloprid 17.8% SL (Confidor-type)",
    brand: "Bayer",
    companyId: "comp-2",
    category: "Insecticides",
    description: "Systemic insecticide containing Imidacloprid, highly effective against sucking pests like aphids, thrips, jassids, and whiteflies.",
    techSpecs: "Imidacloprid 17.8% SL",
    imageUrl: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=500&auto=format&fit=crop&q=60",
    archived: false
  },
  {
    id: "prod-3",
    name: "Chlorpyriphos 20% EC (Terminator)",
    brand: "Bayer",
    companyId: "comp-2",
    category: "Insecticides",
    description: "Organophosphorus insecticide for soil and foliar applications, widely used against termites, root borer, and leaf folders.",
    techSpecs: "Chlorpyriphos 20% EC",
    imageUrl: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=500&auto=format&fit=crop&q=60",
    archived: false
  },
  {
    id: "prod-11",
    name: "Fipronil 5% SC (Shield)",
    brand: "Bayer",
    companyId: "comp-2",
    category: "Insecticides",
    description: "Modern phenylpyrazole insecticide offering control of broad spectrum of chewing and sucking insect pests in crops.",
    techSpecs: "Fipronil 5% SC w/w",
    imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&auto=format&fit=crop&q=60",
    archived: false
  },
  {
    id: "prod-12",
    name: "DAP (Di-Ammonium Phosphate)",
    brand: "Bayer",
    companyId: "comp-2",
    category: "Fertilizers",
    description: "Highly concentrated phosphorus based fertilizer, ideal for application during crop planting stage.",
    techSpecs: "Nitrogen 18%, Phosphate P2O5 46%",
    imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500&auto=format&fit=crop&q=60",
    archived: false
  },

  // Company C -> 6 products
  {
    id: "prod-4",
    name: "Mancozeb 75% WP (Indofil M-45)",
    brand: "Indofil",
    companyId: "comp-3",
    category: "Fungicides",
    description: "Contact broad-spectrum fungicide with protective action, highly effective against early blight, late blight, and leaf spots.",
    techSpecs: "Mancozeb 75% WP",
    imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&auto=format&fit=crop&q=60",
    archived: false
  },
  {
    id: "prod-5",
    name: "Hexaconazole 5% EC (Anvil-type)",
    brand: "Indofil",
    companyId: "comp-3",
    category: "Fungicides",
    description: "Systemic fungicide containing Hexaconazole, excellent control of sheath blight in paddy, powdery mildew in mangoes and grapes.",
    techSpecs: "Hexaconazole 5% EC",
    imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500&auto=format&fit=crop&q=60",
    archived: false
  },
  {
    id: "prod-6",
    name: "Atrazine 50% WP (WeedFree)",
    brand: "Indofil",
    companyId: "comp-3",
    category: "Herbicides",
    description: "Selective herbicide for control of broad-leaf weeds and grasses in Maize and Sugarcane.",
    techSpecs: "Atrazine 50% WP",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?w=500&auto=format&fit=crop&q=60",
    archived: false
  },
  {
    id: "prod-13",
    name: "Carbendazim 50% WP Systemic Fungicide",
    brand: "Indofil",
    companyId: "comp-3",
    category: "Fungicides",
    description: "Broad-spectrum systemic fungicide used to control wide range of fungal diseases in crops and plantation.",
    techSpecs: "Carbendazim 50% WP",
    imageUrl: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=500&auto=format&fit=crop&q=60",
    archived: false
  },
  {
    id: "prod-14",
    name: "Hybrid Mustard Seeds (Yellow Gold)",
    brand: "Indofil",
    companyId: "comp-3",
    category: "Seeds",
    description: "High oil content mustard seeds, highly branched hybrid and frost tolerant with excellent yield potential.",
    techSpecs: "Mustard Hybrid Yellow Seeds, Oil Content 42%",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?w=500&auto=format&fit=crop&q=60",
    archived: false
  },
  {
    id: "prod-15",
    name: "Zinc Sulphate Monohydrate 33%",
    brand: "Indofil",
    companyId: "comp-3",
    category: "Others",
    description: "Micronutrient fertilizer correcting zinc deficiency in soils, promoting root development and chlorophyll synthesis.",
    techSpecs: "Zinc (Zn) 33% Min, Sulphur (S) 15% Min",
    imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&auto=format&fit=crop&q=60",
    archived: false
  },
  {
    id: "prod-coragen",
    name: "Coragen",
    brand: "FMC",
    companyId: "comp-seed-23",
    category: "Insecticides",
    description: "FMC Coragen insecticide is an anthranilic diamide broad-spectrum insecticide.",
    techSpecs: "Chlorantraniliprole 18.5% SC",
    imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&auto=format&fit=crop&q=60",
    archived: false
  }
];

const DEFAULT_PRODUCT_VARIANTS: ProductVariant[] = [
  // prod-1 variants
  { id: "prod-1-v1", productId: "prod-1", packSize: "250", unit: "ml", price: 150, sku: "GLY-41-250M", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-1-v2", productId: "prod-1", packSize: "500", unit: "ml", price: 280, sku: "GLY-41-500M", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-1-v3", productId: "prod-1", packSize: "1", unit: "L", price: 450, sku: "GLY-41-1L", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-7 variants
  { id: "prod-7-v1", productId: "prod-7", packSize: "500", unit: "ml", price: 200, sku: "PAR-24-500M", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-7-v2", productId: "prod-7", packSize: "1", unit: "L", price: 350, sku: "PAR-24-1L", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-8 variants
  { id: "prod-8-v1", productId: "prod-8", packSize: "250", unit: "ml", price: 160, sku: "NEE-03-250M", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-8-v2", productId: "prod-8", packSize: "500", unit: "ml", price: 280, sku: "NEE-03-500M", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-9 variants
  { id: "prod-9-v1", productId: "prod-9", packSize: "1", unit: "Kg", price: 180, sku: "NPK-19-1K", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-10 variants
  { id: "prod-10-v1", productId: "prod-10", packSize: "10", unit: "gm", price: 120, sku: "TOM-HYB-10G", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-2 variants
  { id: "prod-2-v1", productId: "prod-2", packSize: "100", unit: "ml", price: 180, sku: "IMI-178-100M", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-2-v2", productId: "prod-2", packSize: "250", unit: "ml", price: 380, sku: "IMI-178-250M", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-2-v3", productId: "prod-2", packSize: "500", unit: "ml", price: 700, sku: "IMI-178-500M", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-3 variants
  { id: "prod-3-v1", productId: "prod-3", packSize: "1", unit: "L", price: 380, sku: "CHL-20-1L", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-3-v2", productId: "prod-3", packSize: "5", unit: "L", price: 1650, sku: "CHL-20-5L", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-11 variants
  { id: "prod-11-v1", productId: "prod-11", packSize: "250", unit: "ml", price: 260, sku: "FIP-5-250M", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-11-v2", productId: "prod-11", packSize: "1", unit: "L", price: 850, sku: "FIP-5-1L", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-12 variants
  { id: "prod-12-v1", productId: "prod-12", packSize: "50", unit: "Kg", price: 1450, sku: "DAP-50K", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-4 variants
  { id: "prod-4-v1", productId: "prod-4", packSize: "500", unit: "gm", price: 220, sku: "MAN-75-500G", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-4-v2", productId: "prod-4", packSize: "1", unit: "Kg", price: 400, sku: "MAN-75-1K", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-5 variants
  { id: "prod-5-v1", productId: "prod-5", packSize: "500", unit: "ml", price: 350, sku: "HEX-5-500M", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-5-v2", productId: "prod-5", packSize: "1", unit: "L", price: 620, sku: "HEX-5-1L", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-6 variants
  { id: "prod-6-v1", productId: "prod-6", packSize: "500", unit: "gm", price: 180, sku: "ATR-50-500G", available: false, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-6-v2", productId: "prod-6", packSize: "1", unit: "Kg", price: 310, sku: "ATR-50-1K", available: false, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-13 variants
  { id: "prod-13-v1", productId: "prod-13", packSize: "250", unit: "gm", price: 190, sku: "CAR-50-250G", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-13-v2", productId: "prod-13", packSize: "500", unit: "gm", price: 350, sku: "CAR-50-500G", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-14 variants
  { id: "prod-14-v1", productId: "prod-14", packSize: "1", unit: "Kg", price: 350, sku: "MUS-HYB-1K", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-15 variants
  { id: "prod-15-v1", productId: "prod-15", packSize: "5", unit: "Kg", price: 420, sku: "ZIN-33-5K", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // prod-coragen variants
  { id: "prod-coragen-v1", productId: "prod-coragen", packSize: "100", unit: "ml", price: 320, sku: "COR-185-100M", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-coragen-v2", productId: "prod-coragen", packSize: "250", unit: "ml", price: 650, sku: "COR-185-250M", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-coragen-v3", productId: "prod-coragen", packSize: "500", unit: "ml", price: 1150, sku: "COR-185-500M", available: false, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-coragen-v4", productId: "prod-coragen", packSize: "1", unit: "L", price: 2100, sku: "COR-185-1L", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const DEFAULT_DEALERS: UserProfile[] = [
  {
    id: "dealer-1",
    role: "dealer",
    name: "Vijay Kumar",
    shopName: "Kisan Agro Agencies",
    mobile: "9876543211",
    email: "vijay@kisanagro.com",
    address: "Main Bazaar, Opp. Grain Market, Karnal, Haryana",
    gstNumber: "06AAAAA1111A1Z1",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "dealer-2",
    role: "dealer",
    name: "Rajesh Patel",
    shopName: "Patel Fertilizer Store",
    mobile: "9876543212",
    email: "rajesh@patelstore.com",
    address: "Station Road, Anand, Gujarat",
    gstNumber: "24BBBBB2222B2Z2",
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: "ORD-1001",
    dealerId: "dealer-1",
    dealerName: "Vijay Kumar",
    shopName: "Kisan Agro Agencies",
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    subtotal: 10450,
    total: 10450,
    paymentMethod: "pay_later",
    paymentStatus: "pending",
    orderStatus: "processing",
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "ORD-1002",
    dealerId: "dealer-2",
    dealerName: "Rajesh Patel",
    shopName: "Patel Fertilizer Store",
    date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    subtotal: 4400,
    total: 4400,
    paymentMethod: "pay_now",
    paymentStatus: "paid",
    orderStatus: "completed",
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  }
];

const DEFAULT_ORDER_ITEMS: OrderItem[] = [
  {
    id: "item-1",
    orderId: "ORD-1001",
    productId: "prod-1",
    productName: "Glyphosate 41% SL (SuperWeed)",
    brand: "Monsanto",
    variantId: "prod-1-v3",
    packSize: "1 L",
    price: 450,
    quantity: 10
  },
  {
    id: "item-2",
    orderId: "ORD-1001",
    productId: "prod-2",
    productName: "Imidacloprid 17.8% SL (Confidor-type)",
    brand: "Bayer",
    variantId: "prod-2-v2",
    packSize: "250 ml",
    price: 380,
    quantity: 10
  },
  {
    id: "item-3",
    orderId: "ORD-1002",
    productId: "prod-2",
    productName: "Imidacloprid 17.8% SL (Confidor-type)",
    brand: "Bayer",
    variantId: "prod-2-v2",
    packSize: "250 ml",
    price: 380,
    quantity: 5
  },
  {
    id: "item-4",
    orderId: "ORD-1002",
    productId: "prod-4",
    productName: "Mancozeb 75% WP (Indofil M-45)",
    brand: "Indofil",
    variantId: "prod-4-v1",
    packSize: "500 gm",
    price: 220,
    quantity: 10
  }
];

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
    const DEFAULT_DEALER_PRICES = [
      { dealerId: 'dealer-1', variantId: 'prod-coragen-v2', price: 500 },
      { dealerId: 'dealer-2', variantId: 'prod-coragen-v2', price: 550 }
    ];
    localStorage.setItem('ad_dealer_prices', JSON.stringify(DEFAULT_DEALER_PRICES));
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

  // Guarantee FMC, Coragen, variants, and dealer prices are seeded in local storage
  try {
    const products = JSON.parse(localStorage.getItem('ad_products') || '[]');
    if (!products.some((p: any) => p.id === 'prod-coragen')) {
      const companies = JSON.parse(localStorage.getItem('ad_companies') || '[]');
      if (!companies.some((c: any) => c.id === 'comp-seed-23')) {
        companies.push({
          id: "comp-seed-23",
          name: "FMC",
          logo: getCompanyPlaceholderLogo("FMC"),
          description: "FMC Corporation is an agricultural sciences company.",
          status: "active",
          createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
        });
        localStorage.setItem('ad_companies', JSON.stringify(companies));
      }
      
      products.push({
        id: "prod-coragen",
        name: "Coragen",
        brand: "FMC",
        companyId: "comp-seed-23",
        category: "Insecticides",
        description: "FMC Coragen insecticide is an anthranilic diamide broad-spectrum insecticide.",
        techSpecs: "Chlorantraniliprole 18.5% SC",
        imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&auto=format&fit=crop&q=60",
        archived: false
      });
      localStorage.setItem('ad_products', JSON.stringify(products));

      const variants = JSON.parse(localStorage.getItem('ad_product_variants') || '[]');
      const coragenVariants = [
        { id: "prod-coragen-v1", productId: "prod-coragen", packSize: "100", unit: "ml", price: 320, sku: "COR-185-100M", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "prod-coragen-v2", productId: "prod-coragen", packSize: "250", unit: "ml", price: 650, sku: "COR-185-250M", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "prod-coragen-v3", productId: "prod-coragen", packSize: "500", unit: "ml", price: 1150, sku: "COR-185-500M", available: false, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "prod-coragen-v4", productId: "prod-coragen", packSize: "1", unit: "L", price: 2100, sku: "COR-185-1L", available: true, archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ];
      coragenVariants.forEach(cv => {
        if (!variants.some((v: any) => v.id === cv.id)) {
          variants.push(cv);
        }
      });
      localStorage.setItem('ad_product_variants', JSON.stringify(variants));

      let dPrices = JSON.parse(localStorage.getItem('ad_dealer_prices') || '[]');
      const coragenDPrices = [
        { dealerId: 'dealer-1', variantId: 'prod-coragen-v2', price: 500 },
        { dealerId: 'dealer-2', variantId: 'prod-coragen-v2', price: 550 }
      ];
      coragenDPrices.forEach(cdp => {
        if (!dPrices.some((dp: any) => dp.dealerId === cdp.dealerId && dp.variantId === cdp.variantId)) {
          dPrices.push(cdp);
        }
      });
      localStorage.setItem('ad_dealer_prices', JSON.stringify(dPrices));
    }
  } catch (err) {
    console.error("Error seeding FMC Coragen dynamically: ", err);
  }

  // --- SEED DEMO DISPATCHED ORDER & CHALLAN FOR RAJ AGRO TRADERS ---
  try {
    const dealers = JSON.parse(localStorage.getItem('ad_dealers') || '[]');
    if (!dealers.some((d: any) => d.id === 'dealer-3')) {
      dealers.push({
        id: "dealer-3",
        role: "dealer",
        name: "Rajesh Kumar",
        shopName: "Raj Agro Traders",
        mobile: "9876543213",
        email: "raj@rajagro.com",
        address: "Near Bus Stand, Pehowa, Kurukshetra, Haryana",
        gstNumber: "06ABCDE2222F1Z6",
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('ad_dealers', JSON.stringify(dealers));
    }

    const products = JSON.parse(localStorage.getItem('ad_products') || '[]');
    if (!products.some((p: any) => p.id === 'prod-roundup')) {
      products.push({
        id: "prod-roundup",
        name: "Roundup",
        brand: "Bayer",
        companyId: "comp-seed-5", // Bayer
        category: "Herbicides",
        description: "Roundup Glyphosate Herbicide.",
        techSpecs: "Glyphosate 41% SL",
        imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&auto=format&fit=crop&q=60",
        archived: false
      });
      localStorage.setItem('ad_products', JSON.stringify(products));

      const variants = JSON.parse(localStorage.getItem('ad_product_variants') || '[]');
      variants.push({
        id: "prod-roundup-v1",
        productId: "prod-roundup",
        packSize: "500",
        unit: "ml",
        price: 365,
        sku: "RND-500M",
        available: true,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      localStorage.setItem('ad_product_variants', JSON.stringify(variants));
    }

    const orders = JSON.parse(localStorage.getItem('ad_orders') || '[]');
    if (!orders.some((o: any) => o.id === 'ORD-1025')) {
      orders.push({
        id: "ORD-1025",
        dealerId: "dealer-3",
        dealerName: "Rajesh Kumar",
        shopName: "Raj Agro Traders",
        date: new Date().toISOString().split('T')[0],
        subtotal: 2795,
        total: 2795,
        paymentMethod: "pay_later",
         paymentStatus: "pending",
        orderStatus: "dispatched",
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('ad_orders', JSON.stringify(orders));

      const orderItems = JSON.parse(localStorage.getItem('ad_order_items') || '[]');
      orderItems.push(
        {
          id: "item-demo-1",
          orderId: "ORD-1025",
          productId: "prod-roundup",
          productName: "Roundup",
          brand: "Bayer",
          variantId: "prod-roundup-v1",
          packSize: "500 ml",
          price: 365,
          quantity: 5
        },
        {
          id: "item-demo-2",
          orderId: "ORD-1025",
          productId: "prod-coragen",
          productName: "Coragen",
          brand: "FMC",
          variantId: "prod-coragen-v2",
          packSize: "250 ml",
          price: 485,
          quantity: 2
        }
      );
      localStorage.setItem('ad_order_items', JSON.stringify(orderItems));
    }

    const challans = JSON.parse(localStorage.getItem('ad_delivery_challans') || '[]');
    if (!challans.some((c: any) => c.challanNumber === 'DC-00001')) {
      const settings = JSON.parse(localStorage.getItem('ad_settings') || JSON.stringify(DEFAULT_SETTINGS));
      const dealer = {
        id: "dealer-3",
        role: "dealer",
        name: "Rajesh Kumar",
        shopName: "Raj Agro Traders",
        mobile: "9876543213",
        email: "raj@rajagro.com",
        address: "Near Bus Stand, Pehowa, Kurukshetra, Haryana",
        gstNumber: "06ABCDE2222F1Z6",
        createdAt: new Date().toISOString()
      };
      const items = [
        {
          id: "item-demo-1",
          orderId: "ORD-1025",
          productId: "prod-roundup",
          productName: "Roundup",
          brand: "Bayer",
          variantId: "prod-roundup-v1",
          packSize: "500 ml",
          price: 365,
          quantity: 5
        },
        {
          id: "item-demo-2",
          orderId: "ORD-1025",
          productId: "prod-coragen",
          productName: "Coragen",
          brand: "FMC",
          variantId: "prod-coragen-v2",
          packSize: "250 ml",
          price: 485,
          quantity: 2
        }
      ];
      challans.push({
        id: "challan-demo-1",
        challanNumber: "DC-00001",
        orderId: "ORD-1025",
        dealerId: "dealer-3",
        dispatchDate: new Date().toISOString(),
        businessSnapshot: settings,
        dealerSnapshot: dealer,
        itemsSnapshot: items,
        transportDetails: {
          transportThrough: "Super Express Transport",
          vehicleNumber: "HR-65-A-1234",
          driverName: "Ram Singh",
          dispatchLocation: "Karnal",
          deliveryLocation: "Pehowa"
        },
        hamali: 50,
        bhada: 150,
        otherCharges: 0,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('ad_delivery_challans', JSON.stringify(challans));
    }
  } catch (err) {
    console.error("Error seeding Raj Agro Traders demo order & challan: ", err);
  }

  localStorage.setItem('ad_initialized', 'true');
}

initLocalStorage();

// Database Service Functions
export const dbService = {
  // --- AUTHENTICATION ---
  login(loginVal: string, passwordVal?: string): { success: boolean; user?: UserProfile; error?: string } {
    initLocalStorage();
    const cleanLogin = loginVal.trim().toLowerCase();
    
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
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('ad_session', JSON.stringify(user));
        return { success: true, user };
      } else {
        return { success: false, error: "Incorrect password for admin account" };
      }
    }
    
    // 2. Check if dealer
    const dealers = JSON.parse(localStorage.getItem('ad_dealers') || '[]');
    // For dealers, login is passwordless/OTP-based or simple passwordless.
    // Spec says: "Mobile number / email according to chosen authentication architecture. Login / Register".
    // We will implement simple mobile/email based passwordless immediate login (or simple password, but mobile number immediate login is extremely user friendly and robust).
    // Let's allow instant login with mobile/email. If password is provided, we can validate or skip. Let's do instant activation / login.
    const dealerMatch = dealers.find((d: UserProfile) => d.email.toLowerCase() === cleanLogin || d.mobile === cleanLogin);
    if (dealerMatch) {
      localStorage.setItem('ad_session', JSON.stringify(dealerMatch));
      return { success: true, user: dealerMatch };
    }
    
    return { success: false, error: "Dealer account not found. Please register first." };
  },

  register(dealerData: Omit<UserProfile, 'id' | 'role' | 'createdAt'>): { success: boolean; user?: UserProfile; error?: string } {
    initLocalStorage();
    const dealers = JSON.parse(localStorage.getItem('ad_dealers') || '[]');
    
    // Check if mobile or email exists
    if (dealers.some((d: UserProfile) => d.mobile === dealerData.mobile)) {
      return { success: false, error: "Mobile number already registered" };
    }
    if (dealerData.email && dealers.some((d: UserProfile) => d.email.toLowerCase() === dealerData.email.toLowerCase())) {
      return { success: false, error: "Email already registered" };
    }
    
    const newDealer: UserProfile = {
      ...dealerData,
      id: `dealer-${Date.now()}`,
      role: 'dealer',
      createdAt: new Date().toISOString()
    };
    
    dealers.push(newDealer);
    localStorage.setItem('ad_dealers', JSON.stringify(dealers));
    localStorage.setItem('ad_session', JSON.stringify(newDealer)); // auto log-in after registration
    
    return { success: true, user: newDealer };
  },

  logout(): void {
    localStorage.removeItem('ad_session');
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

  addProduct(productData: Omit<Product, 'id' | 'archived'>): { success: boolean; product?: Product; error?: string } {
    initLocalStorage();
    const products: Product[] = JSON.parse(localStorage.getItem('ad_products') || '[]');
    const allVariants: ProductVariant[] = JSON.parse(localStorage.getItem('ad_product_variants') || '[]');
    
    const newProductId = `prod-${Date.now()}`;
    const { variants, ...parentData } = productData as any;

    const newProduct: Product = {
      ...parentData,
      id: newProductId,
      archived: false
    };
    
    products.push(newProduct);
    localStorage.setItem('ad_products', JSON.stringify(products));

    if (variants && Array.isArray(variants)) {
      variants.forEach((v, idx) => {
        const variantId = `var-${Date.now()}-${idx}`;
        const newV: ProductVariant = {
          id: variantId,
          productId: newProductId,
          packSize: v.packSize,
          unit: v.unit || 'ml',
          price: Number(v.price),
          sku: v.sku || `SKU-${Date.now()}-${idx}`,
          available: v.available !== false,
          archived: v.archived === true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        allVariants.push(newV);
        if (v.dealerPrices) {
          dbService.saveDealerPricesForVariant(variantId, v.dealerPrices);
        }
      });
      localStorage.setItem('ad_product_variants', JSON.stringify(allVariants));
    }

    return { success: true, product: { ...newProduct, variants: allVariants.filter(v => v.productId === newProductId) } };
  },

  updateProduct(product: Product): { success: boolean; product?: Product; error?: string } {
    initLocalStorage();
    const products: Product[] = JSON.parse(localStorage.getItem('ad_products') || '[]');
    const allVariants: ProductVariant[] = JSON.parse(localStorage.getItem('ad_product_variants') || '[]');
    const idx = products.findIndex(p => p.id === product.id);
    
    if (idx === -1) {
      return { success: false, error: "Product not found" };
    }
    
    const { variants, ...parentData } = product as any;

    products[idx] = {
      ...products[idx],
      ...parentData
    };
    localStorage.setItem('ad_products', JSON.stringify(products));

    if (variants && Array.isArray(variants)) {
      // Archive variants not in the submitted list
      const submittedVariantIds = variants.map(v => v.id).filter(Boolean);
      allVariants.forEach(item => {
        if (item.productId === product.id && !submittedVariantIds.includes(item.id)) {
          item.archived = true;
        }
      });

      variants.forEach((v, vIdx) => {
        if (v.id) {
          const existingIdx = allVariants.findIndex(item => item.id === v.id);
          if (existingIdx !== -1) {
            allVariants[existingIdx] = {
              ...allVariants[existingIdx],
              packSize: v.packSize,
              unit: v.unit || 'ml',
              price: Number(v.price),
              sku: v.sku,
              available: v.available,
              archived: v.archived,
              updatedAt: new Date().toISOString()
            };
            if (v.dealerPrices) {
              dbService.saveDealerPricesForVariant(v.id, v.dealerPrices);
            }
          }
        } else {
          const variantId = `var-${Date.now()}-${vIdx}`;
          const newV: ProductVariant = {
            id: variantId,
            productId: product.id,
            packSize: v.packSize,
            unit: v.unit || 'ml',
            price: Number(v.price),
            sku: v.sku || `SKU-${Date.now()}-${vIdx}`,
            available: v.available !== false,
            archived: v.archived === true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          allVariants.push(newV);
          if (v.dealerPrices) {
            dbService.saveDealerPricesForVariant(variantId, v.dealerPrices);
          }
        }
      });
      localStorage.setItem('ad_product_variants', JSON.stringify(allVariants));
    }

    return { success: true, product };
  },

  archiveProduct(id: string): { success: boolean; error?: string } {
    initLocalStorage();
    const products: Product[] = JSON.parse(localStorage.getItem('ad_products') || '[]');
    const idx = products.findIndex(p => p.id === id);
    
    if (idx === -1) {
      return { success: false, error: "Product not found" };
    }
    
    products[idx].archived = true;
    localStorage.setItem('ad_products', JSON.stringify(products));

    // Archive all child variants too
    const allVariants: ProductVariant[] = JSON.parse(localStorage.getItem('ad_product_variants') || '[]');
    allVariants.forEach(v => {
      if (v.productId === id) {
        v.archived = true;
      }
    });
    localStorage.setItem('ad_product_variants', JSON.stringify(allVariants));

    return { success: true };
  },

  restoreProduct(id: string): { success: boolean; error?: string } {
    initLocalStorage();
    const products: Product[] = JSON.parse(localStorage.getItem('ad_products') || '[]');
    const idx = products.findIndex(p => p.id === id);
    
    if (idx === -1) {
      return { success: false, error: "Product not found" };
    }
    
    products[idx].archived = false;
    localStorage.setItem('ad_products', JSON.stringify(products));

    // Restore all child variants too
    const allVariants: ProductVariant[] = JSON.parse(localStorage.getItem('ad_product_variants') || '[]');
    allVariants.forEach(v => {
      if (v.productId === id) {
        v.archived = false;
      }
    });
    localStorage.setItem('ad_product_variants', JSON.stringify(allVariants));

    return { success: true };
  },

  // CSV/Excel Import simulation
  validateBulkUpload(
    csvText: string,
    zipFiles: Record<string, Blob> = {}
  ): BulkUploadPreviewResult {
    initLocalStorage();
    const products: Product[] = JSON.parse(localStorage.getItem('ad_products') || '[]');
    const allVariants: ProductVariant[] = JSON.parse(localStorage.getItem('ad_product_variants') || '[]');
    const companiesList: Company[] = JSON.parse(localStorage.getItem('ad_companies') || '[]');

    const { headers: rawHeaders, rows: parsedRows } = parseCSVOrFWF(csvText);
    if (rawHeaders.length === 0) {
      return {
        success: false,
        rows: [],
        summary: { newProducts: 0, newVariants: 0, existingVariantsToUpdate: 0, imagesMatched: 0, warnings: 0, errors: 0 },
        errorsList: ["Empty CSV file or headers missing"]
      };
    }

    // Clean field function
    const cleanField = (field: string) => {
      if (!field) return "";
      let f = field.trim();
      if (f.startsWith('"') && f.endsWith('"')) {
        f = f.slice(1, -1);
      }
      return f.trim().replace(/\s+/g, " ");
    };

    // Parse headers using parseCSVLine and ALIAS_MAP
    const normalizedHeaders = rawHeaders.map(h => {
      const cleaned = cleanField(h).toLowerCase();
      return ALIAS_MAP[cleaned] || cleaned;
    });

    const nameIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.PRODUCT_NAME);
    const brandIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.COMPANY);
    const catIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.CATEGORY);
    const skuIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.SKU);

    const varIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.VARIANT_NAME);
    const packIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.PACK_SIZE);
    const unitIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.UNIT);
    const imgIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.IMAGE_FILE);
    const statusIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.STATUS);
    const priceIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.PRICE);

    // Get detected columns list of canonical fields (for layout error display)
    const detectedList = normalizedHeaders
      .filter(h => Object.values(CANONICAL_FIELDS).includes(h))
      .filter((v, idx, self) => self.indexOf(v) === idx); // Deduplicate

    // Check required columns in headers
    const requiredCanonical = [
      CANONICAL_FIELDS.PRODUCT_NAME,
      CANONICAL_FIELDS.COMPANY,
      CANONICAL_FIELDS.SKU,
      CANONICAL_FIELDS.PACK_SIZE,
      CANONICAL_FIELDS.UNIT,
      CANONICAL_FIELDS.PRICE
    ];

    for (const req of requiredCanonical) {
      if (normalizedHeaders.indexOf(req) === -1) {
        return {
          success: false,
          rows: [],
          summary: { newProducts: 0, newVariants: 0, existingVariantsToUpdate: 0, imagesMatched: 0, warnings: 0, errors: 0 },
          errorsList: [
            `Missing required column: ${req}`,
            `Detected columns: ${detectedList.join(", ") || "None"}`
          ]
        };
      }
    }

    const validCategories = new Set([
      'Herbicides', 
      'Insecticides', 
      'Fertilizers', 
      'Seeds', 
      'Fungicides', 
      'Others'
    ].map(c => c.toLowerCase()));

    const rows: BulkUploadRowPreview[] = [];
    const errorsList: string[] = [];

    const csvVariantsSeen = new Set<string>();
    const csvSkusSeen = new Map<string, number>();
    const csvProductsMap = new Map<string, boolean>();

    let newProducts = 0;
    let newVariants = 0;
    let existingVariantsToUpdate = 0;
    let imagesMatched = 0;
    let totalWarnings = 0;
    let totalErrors = 0;

    for (let i = 0; i < parsedRows.length; i++) {
      const fields = parsedRows[i];
      const nameVal = nameIdx !== -1 && nameIdx < fields.length ? fields[nameIdx] : "";
      const brandVal = brandIdx !== -1 && brandIdx < fields.length ? fields[brandIdx] : BUSINESS_CONFIG.name;
      const catVal = catIdx !== -1 && catIdx < fields.length ? fields[catIdx] : "Others";
      const packVal = packIdx !== -1 && packIdx < fields.length ? fields[packIdx] : "1";
      const unitVal = unitIdx !== -1 && unitIdx < fields.length ? fields[unitIdx] : "L";
      const skuVal = skuIdx !== -1 && skuIdx < fields.length ? fields[skuIdx] : "";
      const imgVal = imgIdx !== -1 && imgIdx < fields.length ? fields[imgIdx] : "";
      const priceVal = priceIdx !== -1 && priceIdx < fields.length ? fields[priceIdx] : "";
      const statusVal = statusIdx !== -1 && statusIdx < fields.length ? fields[statusIdx] : "Active";
      const varVal = varIdx !== -1 && varIdx < fields.length ? fields[varIdx] : "";

      const rowNum = i + 2;
      let rowErrors: string[] = [];
      let rowWarnings: string[] = [];

      // Required validations
      if (!nameVal) {
        rowErrors.push("Product Name is required.");
      }
      if (!brandVal) {
        rowErrors.push("Company is required.");
      }
      if (!packVal) {
        rowErrors.push("Pack Size is required.");
      }
      if (!unitVal) {
        rowErrors.push("Unit is required.");
      }
      if (!skuVal) {
        rowErrors.push("SKU is required.");
      }

      // Price cleaning & validations (strip ₹ symbol and INR)
      let cleanedPrice = priceVal.trim();
      if (cleanedPrice.startsWith('₹')) {
        cleanedPrice = cleanedPrice.substring(1).trim();
      } else if (cleanedPrice.endsWith('₹')) {
        cleanedPrice = cleanedPrice.substring(0, cleanedPrice.length - 1).trim();
      }
      if (cleanedPrice.toLowerCase().endsWith('inr')) {
        cleanedPrice = cleanedPrice.substring(0, cleanedPrice.length - 3).trim();
      }

      if (!cleanedPrice) {
        rowErrors.push("Price is required.");
      } else {
        if (cleanedPrice.includes(',')) {
          rowErrors.push("Price must not contain commas.");
        } else {
          const numericRegex = /^\d+(\.\d+)?$/;
          if (!numericRegex.test(cleanedPrice)) {
            rowErrors.push(`Invalid price format: '${priceVal}'. Price must be a positive numeric value.`);
          } else {
            const parsedPrice = parseFloat(cleanedPrice);
            if (isNaN(parsedPrice) || parsedPrice <= 0) {
              rowErrors.push("Price must be greater than 0.");
            }
          }
        }
      }

      // Format validations
      if (packVal) {
        const pSize = parseFloat(packVal);
        if (isNaN(pSize) || pSize <= 0) {
          rowErrors.push(`Invalid Pack Size: '${packVal}'. Must be a valid positive number.`);
        }
      }
      if (catVal && !validCategories.has(catVal.toLowerCase())) {
        rowErrors.push(`Category '${catVal}' does not exist.`);
      }
      const normStatus = statusVal.trim().toLowerCase();
      if (normStatus !== 'active' && normStatus !== 'inactive' && normStatus !== 'archived') {
        rowErrors.push(`Invalid status value: '${statusVal}'. Must be Active or Inactive.`);
      }

      // Company mapping check
      let companyObj = null;
      if (brandVal) {
        const normBrand = normalizeCompanyName(brandVal);
        companyObj = companiesList.find(c => normalizeCompanyName(c.name) === normBrand);
        if (!companyObj) {
          rowErrors.push(`Company '${brandVal}' not found. Please create this company first.`);
        }
      }

      // Normalization comparison
      const normProdName = normalizeProductName(nameVal);
      const normBrandName = brandVal ? normalizeCompanyName(brandVal) : "";
      const normVarName = getNormalizedVariantName(varVal, packVal, unitVal);
      const prodKey = `${normProdName}|${normBrandName}`;
      const varKey = `${prodKey}|${normVarName}`;

      // Duplicate variant check in CSV (using Product Name + Variant Name)
      if (nameVal && (varVal || (packVal && unitVal))) {
        if (csvVariantsSeen.has(varKey)) {
          rowErrors.push(`Duplicate row: Product '${nameVal}' + Variant '${varVal || (packVal + " " + unitVal)}' appears more than once in this CSV.`);
        } else {
          csvVariantsSeen.add(varKey);
        }
      }

      // Duplicate SKU check in CSV
      if (skuVal) {
        const normSku = skuVal.trim().toLowerCase();
        if (csvSkusSeen.has(normSku)) {
          const firstSeenRow = csvSkusSeen.get(normSku);
          rowErrors.push(`Duplicate SKU: '${skuVal}' is used multiple times in this CSV (first seen at row ${firstSeenRow}).`);
        } else {
          csvSkusSeen.set(normSku, rowNum);
        }
      }

      // Find matching entities in Database (avoid duplicate products on same SKU)
      let matchingProductByName = nameVal && brandVal ? products.find(p => 
        normalizeProductName(p.name) === normProdName && 
        normalizeCompanyName(p.brand) === normBrandName
      ) : undefined;

      let matchingVariantBySku = skuVal ? allVariants.find(v => 
        v.sku.trim().toLowerCase() === skuVal.trim().toLowerCase() && !v.archived
      ) : undefined;

      let parentOfSkuVariant = matchingVariantBySku ? products.find(p => 
        p.id === matchingVariantBySku!.productId
      ) : undefined;

      // Database level Product + Variant existence checks
      let dbProductExists = false;
      let dbVariantExists = false;

      if (rowErrors.length === 0) {
        if (matchingProductByName) {
          dbProductExists = true;
          // Check if there is a variant under this product with the same pack size and unit (or variant name)
          const matchingVariantByName = allVariants.find(v => 
            v.productId === matchingProductByName!.id && 
            normalizeVariantName(v.packSize, v.unit) === normVarName && 
            !v.archived
          );
          if (matchingVariantByName || matchingVariantBySku) {
            dbVariantExists = true;
          }
        } else if (matchingVariantBySku && parentOfSkuVariant) {
          dbProductExists = true;
          dbVariantExists = true;
        }
      }

      // Image matched checks
      if (imgVal) {
        const cleanImgName = imgVal.trim().toLowerCase();
        if (zipFiles[cleanImgName]) {
          imagesMatched++;
        } else {
          rowWarnings.push(`Image '${imgVal}' not found in ZIP.`);
        }
      }

      // Outcome classifications
      let action: 'CREATE' | 'UPDATE' | 'ERROR' | 'WARNING' = 'CREATE';
      let validationStatus: 'VALID' | 'WARNING' | 'ERROR' = 'VALID';
      let details = "";

      if (rowErrors.length > 0) {
        action = 'ERROR';
        validationStatus = 'ERROR';
        details = rowErrors.join(' ');
        totalErrors++;
        errorsList.push(`Row ${rowNum}: ${details}`);
      } else if (rowWarnings.length > 0) {
        action = 'WARNING';
        validationStatus = 'WARNING';
        details = rowWarnings.join(' ');
        totalWarnings++;
        if (dbVariantExists) {
          existingVariantsToUpdate++;
        } else {
          newVariants++;
          if (!dbProductExists && !csvProductsMap.has(prodKey)) {
            csvProductsMap.set(prodKey, true);
            newProducts++;
          }
        }
      } else {
        if (dbVariantExists) {
          action = 'UPDATE';
          existingVariantsToUpdate++;
        } else {
          action = 'CREATE';
          newVariants++;
          if (!dbProductExists && !csvProductsMap.has(prodKey)) {
            csvProductsMap.set(prodKey, true);
            newProducts++;
          }
        }
      }

      rows.push({
        rowNum,
        action,
        productName: nameVal || "",
        companyName: brandVal || "",
        category: catVal || "",
        variantName: varVal || `${packVal} ${unitVal}`,
        packSize: packVal || "",
        unit: unitVal || "",
        sku: skuVal || "",
        price: cleanedPrice || "",
        imageFile: imgVal || "",
        status: statusVal || "",
        validationStatus,
        details
      });
    }

    return {
      success: totalErrors === 0,
      rows,
      summary: {
        newProducts,
        newVariants,
        existingVariantsToUpdate,
        imagesMatched,
        warnings: totalWarnings,
        errors: totalErrors
      },
      errorsList
    };
  },

  async bulkUploadProducts(
    csvText: string,
    zipFiles: Record<string, Blob> = {}
  ): Promise<{
    success: boolean;
    importedCount: number;
    errors: string[];
    productsCreated: number;
    productsUpdated: number;
    variantsCreated: number;
    variantsUpdated: number;
    imagesImported: number;
    productsSkipped: number;
  }> {
    initLocalStorage();

    const valResult = this.validateBulkUpload(csvText, zipFiles);
    if (!valResult.success) {
      return {
        success: false,
        importedCount: 0,
        errors: valResult.errorsList,
        productsCreated: 0,
        productsUpdated: 0,
        variantsCreated: 0,
        variantsUpdated: 0,
        imagesImported: 0,
        productsSkipped: 0
      };
    }

    const products: Product[] = JSON.parse(localStorage.getItem('ad_products') || '[]');
    const allVariants: ProductVariant[] = JSON.parse(localStorage.getItem('ad_product_variants') || '[]');
    const companiesList: Company[] = JSON.parse(localStorage.getItem('ad_companies') || '[]');

    let productsCreated = 0;
    let productsUpdated = 0;
    let variantsCreated = 0;
    let variantsUpdated = 0;
    let imagesImported = 0;

    const productsToUpdate = [...products];
    const variantsToUpdate = [...allVariants];

    try {
      const productGroups: Record<string, {
        productId?: string;
        name: string;
        brand: string;
        companyId: string;
        category: string;
        description: string;
        techSpecs: string;
        imageFile: string;
        status: string;
        rows: typeof valResult.rows;
      }> = {};

      valResult.rows.forEach((row: BulkUploadRowPreview) => {
        const normProdName = normalizeProductName(row.productName);
        const normBrandName = normalizeCompanyName(row.companyName);

        // Find existing entities by name or by SKU
        const matchingProductByName = productsToUpdate.find(p => 
          normalizeProductName(p.name) === normProdName && 
          normalizeCompanyName(p.brand) === normBrandName
        );
        const matchingVariantBySku = row.sku ? variantsToUpdate.find(v => 
          v.sku.trim().toLowerCase() === row.sku.trim().toLowerCase() && !v.archived
        ) : undefined;
        const parentOfSkuVariant = matchingVariantBySku ? productsToUpdate.find(p => 
          p.id === matchingVariantBySku!.productId
        ) : undefined;

        let groupKey = "";
        let targetProductId = "";
        let resolvedName = row.productName;
        let resolvedBrand = row.companyName;

        if (matchingProductByName) {
          targetProductId = matchingProductByName.id;
          groupKey = `id-${targetProductId}`;
          resolvedName = matchingProductByName.name;
          resolvedBrand = matchingProductByName.brand;
        } else if (parentOfSkuVariant) {
          targetProductId = parentOfSkuVariant.id;
          groupKey = `id-${targetProductId}`;
        } else {
          groupKey = `new-${normProdName}|${normBrandName}`;
        }

        if (!productGroups[groupKey]) {
          const matchedCompany = companiesList.find(c => normalizeCompanyName(c.name) === normBrandName);
          productGroups[groupKey] = {
            productId: targetProductId || undefined,
            name: resolvedName,
            brand: matchedCompany ? matchedCompany.name : resolvedBrand,
            companyId: matchedCompany ? matchedCompany.id : "",
            category: row.category,
            description: "Wholesale agricultural product.",
            techSpecs: "Contact admin for tech specs.",
            imageFile: row.imageFile,
            status: row.status,
            rows: []
          };
        }
        productGroups[groupKey].rows.push(row);
      });

      // Parse detailed techSpecs and description from CSV rows
      const { headers: rawHeaders, rows: parsedRows } = parseCSVOrFWF(csvText);
      
      const cleanField = (field: string) => {
        if (!field) return "";
        let f = field.trim();
        if (f.startsWith('"') && f.endsWith('"')) {
          f = f.slice(1, -1);
        }
        return f.trim().replace(/\s+/g, " ");
      };

      const normalizedHeaders = rawHeaders.map(h => {
        const cleaned = cleanField(h).toLowerCase();
        return ALIAS_MAP[cleaned] || cleaned;
      });

      const nameIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.PRODUCT_NAME);
      const brandIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.COMPANY);
      const skuIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.SKU);
      const descIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.DESCRIPTION);
      const techIdx = normalizedHeaders.indexOf(CANONICAL_FIELDS.TECH_SPECS);

      for (let i = 0; i < parsedRows.length; i++) {
        const fields = parsedRows[i];
        const nameVal = nameIdx !== -1 && nameIdx < fields.length ? fields[nameIdx] : "";
        const brandVal = brandIdx !== -1 && brandIdx < fields.length ? fields[brandIdx] : "";
        const skuVal = skuIdx !== -1 && skuIdx < fields.length ? fields[skuIdx] : "";

        if (nameVal && brandVal) {
          const normProdName = normalizeProductName(nameVal);
          const normBrandName = normalizeCompanyName(brandVal);

          const matchingProductByName = productsToUpdate.find(p => 
            normalizeProductName(p.name) === normProdName && 
            normalizeCompanyName(p.brand) === normBrandName
          );
          const matchingVariantBySku = skuVal ? variantsToUpdate.find(v => 
            v.sku.trim().toLowerCase() === skuVal.trim().toLowerCase() && !v.archived
          ) : undefined;
          const parentOfSkuVariant = matchingVariantBySku ? productsToUpdate.find(p => 
            p.id === matchingVariantBySku!.productId
          ) : undefined;

          let groupKey = "";
          if (matchingProductByName) {
            groupKey = `id-${matchingProductByName.id}`;
          } else if (parentOfSkuVariant) {
            groupKey = `id-${parentOfSkuVariant.id}`;
          } else {
            groupKey = `new-${normProdName}|${normBrandName}`;
          }

          if (productGroups[groupKey]) {
            if (descIdx !== -1 && descIdx < fields.length && fields[descIdx]) {
              productGroups[groupKey].description = fields[descIdx];
            }
            if (techIdx !== -1 && techIdx < fields.length && fields[techIdx]) {
              productGroups[groupKey].techSpecs = fields[techIdx];
            }
          }
        }
      }

      // Apply changes
      for (const group of Object.values(productGroups)) {
        let targetProduct: Product;

        if (group.productId) {
          const existingProductIdx = productsToUpdate.findIndex(p => p.id === group.productId);
          productsToUpdate[existingProductIdx] = {
            ...productsToUpdate[existingProductIdx],
            name: group.name,
            brand: group.brand,
            companyId: group.companyId,
            category: group.category.charAt(0).toUpperCase() + group.category.slice(1).toLowerCase(),
            description: group.description,
            techSpecs: group.techSpecs,
            archived: group.status.toLowerCase() === 'inactive' || group.status.toLowerCase() === 'archived'
          };
          targetProduct = productsToUpdate[existingProductIdx];
          productsUpdated++;
        } else {
          targetProduct = {
            id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: group.name,
            brand: group.brand,
            companyId: group.companyId,
            category: group.category.charAt(0).toUpperCase() + group.category.slice(1).toLowerCase(),
            description: group.description,
            techSpecs: group.techSpecs,
            imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&auto=format&fit=crop&q=60',
            archived: group.status.toLowerCase() === 'inactive' || group.status.toLowerCase() === 'archived'
          };
          productsToUpdate.push(targetProduct);
          productsCreated++;
        }

        // Matched images storage
        if (group.imageFile) {
          const cleanImgName = group.imageFile.trim().toLowerCase();
          const imgBlob = zipFiles[cleanImgName];
          if (imgBlob) {
            await ImageStorageService.saveImage(group.imageFile, imgBlob);
            targetProduct.imageUrl = group.imageFile;
            imagesImported++;
          }
        }

        // Match and update/create variants
        for (const row of group.rows) {
          const normVarName = getNormalizedVariantName(row.variantName, row.packSize, row.unit);

          let existingVarIdx = -1;
          if (row.sku) {
            existingVarIdx = variantsToUpdate.findIndex(v => 
              v.sku.trim().toLowerCase() === row.sku.trim().toLowerCase() && !v.archived
            );
          }

          if (existingVarIdx === -1) {
            existingVarIdx = variantsToUpdate.findIndex(v =>
              v.productId === targetProduct.id &&
              normalizeVariantName(v.packSize, v.unit) === normVarName &&
              !v.archived
            );
          }

          const parsedPrice = parseFloat(row.price);

          if (existingVarIdx !== -1) {
            variantsToUpdate[existingVarIdx] = {
              ...variantsToUpdate[existingVarIdx],
              productId: targetProduct.id,
              sku: row.sku,
              packSize: row.packSize,
              unit: row.unit,
              price: parsedPrice,
              available: row.status.toLowerCase() === 'active',
              archived: false,
              updatedAt: new Date().toISOString()
            };
            variantsUpdated++;
          } else {
            const newVar: ProductVariant = {
              id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              productId: targetProduct.id,
              packSize: row.packSize,
              unit: row.unit,
              price: parsedPrice,
              sku: row.sku,
              available: row.status.toLowerCase() === 'active',
              archived: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            variantsToUpdate.push(newVar);
            variantsCreated++;
          }
        }
      }

      // Write atomically to localStorage
      localStorage.setItem('ad_products', JSON.stringify(productsToUpdate));
      localStorage.setItem('ad_product_variants', JSON.stringify(variantsToUpdate));

      return {
        success: true,
        importedCount: productsCreated + productsUpdated + variantsCreated + variantsUpdated,
        errors: [],
        productsCreated,
        productsUpdated,
        variantsCreated,
        variantsUpdated,
        imagesImported,
        productsSkipped: 0
      };

    } catch (err) {
      console.error("Bulk upload transaction write error: ", err);
      return {
        success: false,
        importedCount: 0,
        errors: ["Atomic database update failed: " + String(err)],
        productsCreated: 0,
        productsUpdated: 0,
        variantsCreated: 0,
        variantsUpdated: 0,
        imagesImported: 0,
        productsSkipped: 0
      };
    }
  },

  // --- ORDERS ---
  getOrders(userId: string, role: 'admin' | 'dealer'): Order[] {
    initLocalStorage();
    const orders: Order[] = JSON.parse(localStorage.getItem('ad_orders') || '[]');
    const items: OrderItem[] = JSON.parse(localStorage.getItem('ad_order_items') || '[]');
    
    // Filter orders based on authorization
    let userOrders = role === 'admin' ? orders : orders.filter(o => o.dealerId === userId);
    
    // Attach order items
    userOrders = userOrders.map(order => {
      const orderItems = items.filter(item => item.orderId === order.id).map(item => {
        // Populate default values for backward compatibility
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
    
    // Sort by date/createdAt descending
    return userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createOrder(orderData: {
    dealerId: string;
    dealerName: string;
    shopName: string;
    paymentMethod: 'pay_now' | 'pay_later';
    subtotal: number;
    total: number;
  }, cartItems: { product: Product; variant: ProductVariant; quantity: number }[]): { success: boolean; order?: Order; error?: string } {
    initLocalStorage();
    const orders: Order[] = JSON.parse(localStorage.getItem('ad_orders') || '[]');
    const orderItems: OrderItem[] = JSON.parse(localStorage.getItem('ad_order_items') || '[]');
    
    const orderId = `ORD-${1000 + orders.length + 1}`;
    const paymentStatus = orderData.paymentMethod === 'pay_now' ? 'paid' : 'pending';
    
    const newOrder: Order = {
      id: orderId,
      dealerId: orderData.dealerId,
      dealerName: orderData.dealerName,
      shopName: orderData.shopName,
      date: new Date().toISOString().split('T')[0],
      subtotal: orderData.subtotal,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: paymentStatus,
      orderStatus: 'new',
      createdAt: new Date().toISOString()
    };
    
    // Create items with snapshots of product properties
    const newItems: OrderItem[] = cartItems.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      orderId: orderId,
      productId: item.product.id,
      productName: item.product.name,
      brand: item.product.brand,
      variantId: item.variant.id,
      packSize: `${item.variant.packSize} ${item.variant.unit}`,
      price: item.variant.price, // snapshot price
      quantity: item.quantity,
      confirmed_quantity: item.quantity, // initial same as quantity
      cancelled_quantity: 0,
      item_status: 'pending',
      cancellation_reason: ''
    }));
    
    orders.push(newOrder);
    orderItems.push(...newItems);
    
    localStorage.setItem('ad_orders', JSON.stringify(orders));
    localStorage.setItem('ad_order_items', JSON.stringify(orderItems));
    
    return { success: true, order: { ...newOrder, items: newItems } };
  },

  updateOrderStatus(orderId: string, orderStatus: Order['orderStatus'], paymentStatus: Order['paymentStatus']): { success: boolean; error?: string } {
    initLocalStorage();
    const orders: Order[] = JSON.parse(localStorage.getItem('ad_orders') || '[]');
    const idx = orders.findIndex(o => o.id === orderId);
    
    if (idx === -1) {
      return { success: false, error: "Order not found" };
    }
    
    orders[idx].orderStatus = orderStatus;
    orders[idx].paymentStatus = paymentStatus;
    
    // If order status is explicitly set to cancelled, mark all items as cancelled
    if (orderStatus === 'cancelled') {
      const items: OrderItem[] = JSON.parse(localStorage.getItem('ad_order_items') || '[]');
      const updatedItems = items.map(item => {
        if (item.orderId === orderId) {
          return {
            ...item,
            confirmed_quantity: 0,
            cancelled_quantity: item.quantity,
            item_status: 'cancelled' as const,
            cancellation_reason: item.cancellation_reason || 'Dealer requested cancellation'
          };
        }
        return item;
      });
      localStorage.setItem('ad_order_items', JSON.stringify(updatedItems));
      orders[idx].subtotal = 0;
      orders[idx].total = 0;
    }
    
    localStorage.setItem('ad_orders', JSON.stringify(orders));
    return { success: true };
  },

  confirmOrderItems(orderId: string, itemsData: { itemId: string; confirmedQuantity: number; cancellationReason: string }[]): { success: boolean; error?: string } {
    initLocalStorage();
    const orders: Order[] = JSON.parse(localStorage.getItem('ad_orders') || '[]');
    const items: OrderItem[] = JSON.parse(localStorage.getItem('ad_order_items') || '[]');
    
    const orderIdx = orders.findIndex(o => o.id === orderId);
    if (orderIdx === -1) {
      return { success: false, error: "Order not found" };
    }
    
    const order = orders[orderIdx];
    
    // Update matching items
    let updatedItemsCount = 0;
    const updatedItems = items.map(item => {
      if (item.orderId === orderId) {
        const editData = itemsData.find(d => d.itemId === item.id);
        if (editData) {
          updatedItemsCount++;
          const confirmed = editData.confirmedQuantity;
          const cancelled = item.quantity - confirmed;
          let status: OrderItem['item_status'] = 'confirmed';
          if (confirmed === 0) {
            status = 'cancelled';
          } else if (confirmed < item.quantity) {
            status = 'partially_confirmed';
          }
          return {
            ...item,
            confirmed_quantity: confirmed,
            cancelled_quantity: cancelled,
            item_status: status,
            cancellation_reason: cancelled > 0 ? editData.cancellationReason : ''
          };
        }
      }
      return item;
    });
    
    if (updatedItemsCount === 0) {
      return { success: false, error: "No items updated" };
    }
    
    // Save updated items
    localStorage.setItem('ad_order_items', JSON.stringify(updatedItems));
    
    // Find current items for this order to calculate totals and status
    const currentOrderItems = updatedItems.filter(item => item.orderId === orderId);
    
    // Check overall status
    const allConfirmed = currentOrderItems.every(item => item.confirmed_quantity === item.quantity);
    const allCancelled = currentOrderItems.every(item => item.confirmed_quantity === 0);
    
    let computedStatus: Order['orderStatus'] = 'partially_confirmed';
    if (allConfirmed) {
      computedStatus = 'confirmed';
    } else if (allCancelled) {
      computedStatus = 'cancelled';
    }
    
    // Calculate new total and subtotal based on confirmed quantities only
    const newSubtotal = currentOrderItems.reduce((sum, item) => sum + (item.price * (item.confirmed_quantity ?? 0)), 0);
    const newTotal = newSubtotal;
    
    order.orderStatus = computedStatus;
    order.subtotal = newSubtotal;
    order.total = newTotal;
    
    // Save orders
    localStorage.setItem('ad_orders', JSON.stringify(orders));
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

  updateSettings(settings: SystemSettings): { success: boolean } {
    initLocalStorage();
    localStorage.setItem('ad_settings', JSON.stringify(settings));
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

  addCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; company?: Company; error?: string } {
    initLocalStorage();
    const companies: Company[] = JSON.parse(localStorage.getItem('ad_companies') || '[]');
    
    // Check if company already exists
    if (companies.some(c => c.name.toLowerCase() === companyData.name.toLowerCase())) {
      return { success: false, error: "A company with this name already exists" };
    }

    const newCompany: Company = {
      ...companyData,
      id: `comp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    companies.push(newCompany);
    localStorage.setItem('ad_companies', JSON.stringify(companies));
    return { success: true, company: newCompany };
  },

  updateCompany(company: Company): { success: boolean; company?: Company; error?: string } {
    initLocalStorage();
    const companies: Company[] = JSON.parse(localStorage.getItem('ad_companies') || '[]');
    const idx = companies.findIndex(c => c.id === company.id);

    if (idx === -1) {
      return { success: false, error: "Company not found" };
    }

    // Check if name is taken by another company
    if (companies.some(c => c.id !== company.id && c.name.toLowerCase() === company.name.toLowerCase())) {
      return { success: false, error: "Another company with this name already exists" };
    }

    const updatedCompany = {
      ...company,
      updatedAt: new Date().toISOString()
    };

    companies[idx] = updatedCompany;
    localStorage.setItem('ad_companies', JSON.stringify(companies));

    // Update product brands cache to match the updated company name!
    const products: Product[] = JSON.parse(localStorage.getItem('ad_products') || '[]');
    let productsUpdated = false;
    products.forEach((p, pIdx) => {
      if (p.companyId === company.id) {
        products[pIdx].brand = company.name;
        productsUpdated = true;
      }
    });
    if (productsUpdated) {
      localStorage.setItem('ad_products', JSON.stringify(products));
    }

    return { success: true, company: updatedCompany };
  },

  archiveCompany(id: string): { success: boolean; error?: string } {
    initLocalStorage();
    const companies: Company[] = JSON.parse(localStorage.getItem('ad_companies') || '[]');
    const idx = companies.findIndex(c => c.id === id);

    if (idx === -1) {
      return { success: false, error: "Company not found" };
    }

    companies[idx].status = 'inactive';
    companies[idx].updatedAt = new Date().toISOString();
    localStorage.setItem('ad_companies', JSON.stringify(companies));
    return { success: true };
  },

  restoreCompany(id: string): { success: boolean; error?: string } {
    initLocalStorage();
    const companies: Company[] = JSON.parse(localStorage.getItem('ad_companies') || '[]');
    const idx = companies.findIndex(c => c.id === id);

    if (idx === -1) {
      return { success: false, error: "Company not found" };
    }

    companies[idx].status = 'active';
    companies[idx].updatedAt = new Date().toISOString();
    localStorage.setItem('ad_companies', JSON.stringify(companies));
    return { success: true };
  },

  deleteCompany(id: string): { success: boolean; error?: string } {
    initLocalStorage();
    const companies: Company[] = JSON.parse(localStorage.getItem('ad_companies') || '[]');
    const idx = companies.findIndex(c => c.id === id);
    if (idx === -1) {
      return { success: false, error: "Company not found" };
    }
    
    const products: Product[] = JSON.parse(localStorage.getItem('ad_products') || '[]');
    const hasProducts = products.some(p => p.companyId === id);
    if (hasProducts) {
      const activeCount = products.filter(p => p.companyId === id).length;
      return { success: false, error: `Cannot delete company. This company has ${activeCount} products associated with it.` };
    }
    
    companies.splice(idx, 1);
    localStorage.setItem('ad_companies', JSON.stringify(companies));
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

  resolveMigration(brand: string, action: 'create' | 'map', targetCompanyId?: string): { success: boolean; error?: string } {
    initLocalStorage();
    const companies: Company[] = JSON.parse(localStorage.getItem('ad_companies') || '[]');
    const products: Product[] = JSON.parse(localStorage.getItem('ad_products') || '[]');
    const orderItems: OrderItem[] = JSON.parse(localStorage.getItem('ad_order_items') || '[]');
    const flagsStr = localStorage.getItem('ad_migration_flags');
    if (!flagsStr) return { success: false, error: "No pending migrations found" };
    
    let flags: { unmappedBrands: string[] } = { unmappedBrands: [] };
    try {
      flags = JSON.parse(flagsStr);
    } catch {
      return { success: false, error: "Failed to parse migration flags" };
    }
    
    const unmappedIdx = flags.unmappedBrands.indexOf(brand);
    if (unmappedIdx === -1) {
      return { success: false, error: "Brand migration not flagged" };
    }
    
    const tempCompId = `comp-auto-${brand.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const tempCompIdx = companies.findIndex(c => c.id === tempCompId);
    
    if (action === 'create') {
      if (tempCompIdx !== -1) {
        companies[tempCompIdx].description = `${brand} agricultural solutions and crop health products.`;
        companies[tempCompIdx].logo = getCompanyPlaceholderLogo(brand);
        companies[tempCompIdx].updatedAt = new Date().toISOString();
        localStorage.setItem('ad_companies', JSON.stringify(companies));
      }
    } else if (action === 'map') {
      if (!targetCompanyId) {
        return { success: false, error: "Target company is required for mapping action" };
      }
      const targetComp = companies.find(c => c.id === targetCompanyId);
      if (!targetComp) {
        return { success: false, error: "Target company not found" };
      }
      
      products.forEach((p, idx) => {
        if (p.companyId === tempCompId || p.brand.toLowerCase() === brand.toLowerCase()) {
          products[idx].companyId = targetComp.id;
          products[idx].brand = targetComp.name;
        }
      });
      localStorage.setItem('ad_products', JSON.stringify(products));
      
      orderItems.forEach((item, idx) => {
        if (item.brand.toLowerCase() === brand.toLowerCase()) {
          orderItems[idx].brand = targetComp.name;
        }
      });
      localStorage.setItem('ad_order_items', JSON.stringify(orderItems));
      
      if (tempCompIdx !== -1) {
        companies.splice(tempCompIdx, 1);
        localStorage.setItem('ad_companies', JSON.stringify(companies));
      }
    }
    
    flags.unmappedBrands.splice(unmappedIdx, 1);
    if (flags.unmappedBrands.length > 0) {
      localStorage.setItem('ad_migration_flags', JSON.stringify(flags));
    } else {
      localStorage.removeItem('ad_migration_flags');
    }
    
    return { success: true };
  },

  getDealerPrice(_dealerId: string | undefined, variant: ProductVariant): number {
    return variant.price;
  },


  getDealerPricesForVariant(variantId: string): Record<string, number> {
    const dealerPrices = JSON.parse(localStorage.getItem('ad_dealer_prices') || '[]');
    const result: Record<string, number> = {};
    dealerPrices.forEach((dp: any) => {
      if (dp.variantId === variantId) {
        result[dp.dealerId] = dp.price;
      }
    });
    return result;
  },

  saveDealerPricesForVariant(variantId: string, prices: Record<string, number>) {
    let dealerPrices = JSON.parse(localStorage.getItem('ad_dealer_prices') || '[]');
    // Filter out existing prices for this variant
    dealerPrices = dealerPrices.filter((dp: any) => dp.variantId !== variantId);
    // Add new prices
    Object.entries(prices).forEach(([dealerId, price]) => {
      if (price > 0) {
        dealerPrices.push({ dealerId, variantId, price });
      }
    });
    localStorage.setItem('ad_dealer_prices', JSON.stringify(dealerPrices));
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
    return null; // Deny access
  },

  createDeliveryChallan(
    orderId: string, 
    transportDetails?: {
      transportThrough?: string;
      vehicleNumber?: string;
      driverName?: string;
      dispatchLocation?: string;
      deliveryLocation?: string;
    }, 
    charges?: { hamali?: number; bhada?: number; otherCharges?: number }
  ): DeliveryChallan | null {
    initLocalStorage();
    const orders: Order[] = JSON.parse(localStorage.getItem('ad_orders') || '[]');
    const items: OrderItem[] = JSON.parse(localStorage.getItem('ad_order_items') || '[]');
    const orderIdx = orders.findIndex(o => o.id === orderId);
    if (orderIdx === -1) return null;

    const order = orders[orderIdx];
    
    // Check if challan already exists
    const existing = this.getDeliveryChallanByOrderId(orderId);
    if (existing) return existing;

    const rawOrderItems = items.filter(item => item.orderId === order.id).map(item => {
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

    const totalConfirmed = rawOrderItems.reduce((sum, item) => sum + item.confirmed_quantity, 0);
    if (order.orderStatus === 'cancelled' || totalConfirmed === 0) {
      return null; // Safety block: cannot generate delivery challan for cancelled/empty confirmed quantity orders
    }

    order.items = rawOrderItems;

    // Filter to include only items with confirmed_quantity > 0
    const confirmedItemsSnapshot = rawOrderItems
      .filter(item => item.confirmed_quantity > 0)
      .map(item => ({
        ...item,
        quantity: item.confirmed_quantity // map quantity to confirmed_quantity for PDF/Print view rendering
      }));

    const challans = this.getDeliveryChallans();
    const nextNum = challans.length + 1;
    const challanNumber = 'DC-' + String(nextNum).padStart(5, '0');

    const businessSnapshot = this.getSettings();
    const dealerDetails = this.getDealerDetails(order.dealerId);
    const dealerSnapshot: UserProfile = dealerDetails || {
      id: order.dealerId,
      role: 'dealer',
      name: order.dealerName,
      shopName: order.shopName,
      mobile: '',
      email: '',
      address: '',
      gstNumber: '',
      createdAt: ''
    };

    const newChallan: DeliveryChallan = {
      id: `challan-${Date.now()}`,
      challanNumber,
      orderId: order.id,
      dealerId: order.dealerId,
      dispatchDate: new Date().toISOString(),
      businessSnapshot,
      dealerSnapshot,
      itemsSnapshot: confirmedItemsSnapshot,
      transportDetails: transportDetails || {},
      hamali: Number(charges?.hamali || 0),
      bhada: Number(charges?.bhada || 0),
      otherCharges: Number(charges?.otherCharges || 0),
      createdAt: new Date().toISOString()
    };

    challans.push(newChallan);
    localStorage.setItem('ad_delivery_challans', JSON.stringify(challans));

    // Update order status to dispatched
    this.updateOrderStatus(orderId, 'dispatched', order.paymentStatus);

    return newChallan;
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

