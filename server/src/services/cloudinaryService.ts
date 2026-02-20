import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = (): boolean => {
  const requiredVars = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);
  
  if (missingVars.length > 0) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        `Warning: Missing Cloudinary environment variables: ${missingVars.join(", ")}. Image uploads will fail.`
      );
    }
    return false;
  }
  
  // Check for placeholder values
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  
  if (cloudName.includes("your-") || apiKey.includes("your-") || apiSecret.includes("your-")) {
    if (process.env.NODE_ENV === "production") {
      console.warn("Warning: Cloudinary credentials appear to be placeholders. Image uploads will fail.");
    }
    return false;
  }
  
  return true;
};

// Validate on module load (non-blocking)
const cloudinaryConfigured = isCloudinaryConfigured();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (
  file: Express.Multer.File,
  folder: string = "products"
): Promise<string> => {
  if (!cloudinaryConfigured) {
    throw new Error(
      "Cloudinary is not properly configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables."
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto" },
          { format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Cloudinary upload returned no result"));
        }
      }
    );

    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract public_id from URL
    const urlParts = imageUrl.split("/");
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split(".")[0];
    const folder = urlParts[urlParts.length - 2];

    await cloudinary.uploader.destroy(`${folder}/${publicId}`);
  } catch (error) {
    console.error("Failed to delete image from Cloudinary:", error);
    // Don't throw - image deletion failure shouldn't break the operation
  }
};

