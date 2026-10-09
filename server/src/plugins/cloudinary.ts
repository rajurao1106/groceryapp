import { v2 as cloudinary } from "cloudinary";

export const PRODUCT_IMAGE_FOLDER = "grocery/products";

export type ProductImageUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
};

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return { cloudName, apiKey, apiSecret };
}

export function createProductImageUploadSignature(): ProductImageUploadSignature {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = PRODUCT_IMAGE_FOLDER;
  const allowedFormats = "jpg,jpeg,png,webp";
  const signature = cloudinary.utils.api_sign_request(
    { allowed_formats: allowedFormats, folder, timestamp },
    apiSecret,
  );

  return { cloudName, apiKey, timestamp, folder, allowedFormats, signature };
}

export async function deleteProductImage(publicId: string): Promise<void> {
  getCloudinaryConfig();
  if (!publicId.startsWith(`${PRODUCT_IMAGE_FOLDER}/`)) {
    throw new Error("Refusing to delete an image outside the product image folder.");
  }

  const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary did not delete product image "${publicId}".`);
  }
}
