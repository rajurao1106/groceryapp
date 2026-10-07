import { count } from "drizzle-orm";
import { db, pool } from "./client.js";
import { products } from "./schema.js";

const seedProducts = [
  { name: "Alphonso Mango", brand: "Farm Fresh", category: "Fruits", packSize: "1 kg", sku: "FR-MNG-001", price: "249.00", mrp: "299.00", stock: 24, isPublished: true, image: "🥭", color: "mango" },
  { name: "Amul Taaza Milk", brand: "Amul", category: "Dairy", packSize: "500 ml", sku: "DA-MLK-014", price: "28.00", mrp: "30.00", stock: 4, isPublished: true, image: "🥛", color: "milk" },
  { name: "Whole Wheat Bread", brand: "Harvest Gold", category: "Bakery", packSize: "400 g", sku: "BK-BRD-008", price: "42.00", mrp: "48.00", stock: 7, isPublished: true, image: "🍞", color: "bread" },
  { name: "Organic Spinach", brand: "Green Basket", category: "Vegetables", packSize: "250 g", sku: "VG-SPN-021", price: "35.00", mrp: "40.00", stock: 0, isPublished: true, image: "🥬", color: "spinach" },
  { name: "India Gate Basmati Rice", brand: "India Gate", category: "Pantry", packSize: "1 kg", sku: "PT-RCE-005", price: "139.00", mrp: "165.00", stock: 36, isPublished: true, image: "🍚", color: "rice" },
  { name: "Farm Fresh Eggs", brand: "Happy Hens", category: "Dairy", packSize: "6 pcs", sku: "DA-EGG-009", price: "62.00", mrp: "68.00", stock: 18, isPublished: false, image: "🥚", color: "eggs" },
  { name: "Sweet Lime", brand: "Farm Fresh", category: "Fruits", packSize: "1 kg", sku: "FR-LIM-017", price: "79.00", mrp: "95.00", stock: 12, isPublished: true, image: "🍋", color: "lime" },
  { name: "Cucumber", brand: "Green Basket", category: "Vegetables", packSize: "500 g", sku: "VG-CUC-032", price: "24.00", mrp: "30.00", stock: 21, isPublished: true, image: "🥒", color: "cucumber" },
];

try {
  const [result] = await db.select({ value: count() }).from(products);
  const existingCount = result?.value ?? 0;
  if (existingCount === 0) {
    await db.insert(products).values(seedProducts);
    console.log(`Seeded ${seedProducts.length} catalog products.`);
  } else {
    console.log(`Seed skipped; the catalog already has ${existingCount} products.`);
  }
} finally {
  await pool.end();
}
