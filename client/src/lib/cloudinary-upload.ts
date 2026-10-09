import { backendRequest } from "@/lib/backend-api";

type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
};

export type UploadedProductImage = {
  image: string;
  imagePublicId: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
};

export async function uploadProductImage(file: File): Promise<UploadedProductImage> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Product images must be 5 MB or smaller.");
  }

  const signature = await backendRequest<UploadSignature>("/products/images/signature", {
    method: "POST",
  });
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("folder", signature.folder);
  formData.append("allowed_formats", signature.allowedFormats);
  formData.append("signature", signature.signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
    { method: "POST", body: formData },
  );
  const result = (await response.json()) as CloudinaryUploadResponse;
  if (!response.ok || !result.secure_url || !result.public_id) {
    throw new Error(result.error?.message ?? "Cloudinary could not upload the product image.");
  }

  return { image: result.secure_url, imagePublicId: result.public_id };
}

export async function deleteProductImage(imagePublicId: string): Promise<void> {
  await backendRequest<void>("/products/images/delete", {
    method: "POST",
    body: JSON.stringify({ publicId: imagePublicId }),
  });
}
