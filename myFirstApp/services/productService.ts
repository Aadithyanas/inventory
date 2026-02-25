const BASE_URL = "https://inventory-jtvu.onrender.com/api/products"; // ⚠️ UPDATE YOUR IP HERE

// Types/Interfaces
export interface SeasonalTrend {
  summer: "High" | "Normal" | "Low";
  winter: "High" | "Normal" | "Low";
  rainy: "High" | "Normal" | "Low";
}

export interface Product {
  _id: string;
  name: string;
  quantity: number;
  category: string;
  price: number;
  imageUrl: string;
  seasonalTrend: SeasonalTrend;
  unit: string;
  confidenceScore?: number;
  lastUpdated?: string;
  reorderLevel?: number;
  supplier?: string;
  barcode?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryResponse {
  data: Product[];
}

export interface ProductResponse {
  success: boolean;
  message?: string;
  product?: Product;
  error?: string;
}

export interface LowStockResponse {
  success: boolean;
  count: number;
  products: Product[];
}

export interface BulkUpdateRequest {
  id: string;
  quantity: number;
}

export interface BulkUpdateResponse {
  success: boolean;
  message: string;
  products: Product[];
}

// Get all products
export const getInventory = async (): Promise<InventoryResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/all`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data: Product[] = await res.json();
    
    return { 
      data: Array.isArray(data) ? data : []
    };
  } catch (e) {
    console.error("Fetch Products Error:", e);
    return { data: [] };
  }
};

// Get single product by ID
export const getProductById = async (id: string): Promise<Product> => {
  try {
    const res = await fetch(`${BASE_URL}/${id}`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
  } catch (e) {
    console.error("Fetch Product Error:", e);
    throw e;
  }
};

// Add new product
export const addProduct = async (productData: Partial<Product>): Promise<ProductResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (!res.ok) {
      const error: ProductResponse = await res.json();
      throw new Error(error.error || "Failed to add product");
    }

    return await res.json();
  } catch (e) {
    console.error("Add Product Error:", e);
    throw e;
  }
};

// Update product
export const updateProduct = async (id: string, productData: Partial<Product>): Promise<ProductResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (e) {
    console.error("Update Product Error:", e);
    throw e;
  }
};

// Delete product
export const deleteProduct = async (id: string): Promise<ProductResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (e) {
    console.error("Delete Product Error:", e);
    throw e;
  }
};

// Sync inventory (AI detection)
export const syncInventory = async (name: string, count: number): Promise<ProductResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/sync-inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        detectedCount: count,
        season: "Summer",
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (e) {
    console.error("Sync Error:", e);
    throw e;
  }
};

// Get low stock products
export const getLowStockProducts = async (threshold: number = 5): Promise<LowStockResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/low-stock?threshold=${threshold}`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data: LowStockResponse = await res.json();
    return data;
  } catch (e) {
    console.error("Fetch Low Stock Error:", e);
    return { success: false, count: 0, products: [] };
  }
};

// Bulk update stock
export const bulkUpdateStock = async (updates: BulkUpdateRequest[]): Promise<BulkUpdateResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/bulk-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (e) {
    console.error("Bulk Update Error:", e);
    throw e;
  }
};