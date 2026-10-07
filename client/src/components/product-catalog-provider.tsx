"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { backendRequest } from "@/lib/backend-api";

export type ProductStatus = "Active" | "Draft" | "Out of stock";

export type Product = {
  id: number;
  name: string;
  brand: string;
  category: string;
  packSize: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  status: ProductStatus;
  image: string;
  color: string;
};

export type ProductInput = Omit<Product, "id">;

type ProductCatalogContextValue = {
  products: Product[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  saveProduct: (product: ProductInput, id?: number) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  adjustStock: (id: number, stock: number) => Promise<void>;
};

const ProductCatalogContext = createContext<ProductCatalogContextValue | null>(null);

export function ProductCatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(
    () => backendRequest<{ products: Product[] }>("/products"),
    [],
  );

  const reload = useCallback(async () => {
    try {
      const result = await fetchProducts();
      setProducts(result.products);
      setError("");
    } catch (cause) {
      setProducts([]);
      setError(cause instanceof Error ? cause.message : "Unable to load products from the backend.");
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]);

  useEffect(() => {
    let mounted = true;
    void fetchProducts()
      .then((result) => {
        if (mounted) {
          setProducts(result.products);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (mounted) {
          setError(cause instanceof Error ? cause.message : "Unable to load products from the backend.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [fetchProducts]);

  const saveProduct = useCallback(async (product: ProductInput, id?: number) => {
    const result = await backendRequest<{ product: Product }>(
      id === undefined ? "/products" : `/products/${id}`,
      { method: id === undefined ? "POST" : "PUT", body: JSON.stringify(product) },
    );
    setProducts((current) => id === undefined
      ? [result.product, ...current]
      : current.map((item) => item.id === id ? result.product : item));
    setError("");
  }, []);

  const deleteProduct = useCallback(async (id: number) => {
    await backendRequest<void>(`/products/${id}`, { method: "DELETE" });
    setProducts((current) => current.filter((product) => product.id !== id));
    setError("");
  }, []);

  const adjustStock = useCallback(async (id: number, stock: number) => {
    const product = products.find((item) => item.id === id);
    if (!product) throw new Error("Product no longer exists in the shared catalog.");
    const input: ProductInput = {
      name: product.name,
      brand: product.brand,
      category: product.category,
      packSize: product.packSize,
      sku: product.sku,
      price: product.price,
      mrp: product.mrp,
      stock,
      status: product.status === "Draft" ? "Draft" : stock === 0 ? "Out of stock" : "Active",
      image: product.image,
      color: product.color,
    };
    await saveProduct(input, id);
  }, [products, saveProduct]);

  return (
    <ProductCatalogContext.Provider value={{ products, loading, error, reload, saveProduct, deleteProduct, adjustStock }}>
      {children}
    </ProductCatalogContext.Provider>
  );
}

export function useProductCatalog() {
  const context = useContext(ProductCatalogContext);
  if (!context) throw new Error("useProductCatalog must be used inside ProductCatalogProvider");
  return context;
}
