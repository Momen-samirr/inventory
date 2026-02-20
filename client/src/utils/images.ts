/**
 * Image utility functions for Cloudinary and local images
 * 
 * To use Cloudinary:
 * 1. Sign up at https://cloudinary.com (free tier available)
 * 2. Upload your images to Cloudinary
 * 3. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your .env.local file
 * 4. Update image paths below to match your Cloudinary folder structure
 * 
 * For now, this uses local images from the public folder as fallback
 */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const USE_CLOUDINARY = !!CLOUDINARY_CLOUD_NAME;

/**
 * Get product image URL (product1.png, product2.png, or product3.png)
 * Uses a hash of the productId to consistently assign images
 */
export const getProductImageUrl = (productId: string, index?: number): string => {
  let imageIndex: number;
  
  if (index !== undefined) {
    imageIndex = index;
  } else {
    // Create a simple hash from productId for consistent image assignment
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
      hash = ((hash << 5) - hash) + productId.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    imageIndex = (Math.abs(hash) % 3) + 1;
  }
  
  if (USE_CLOUDINARY) {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/products/product${imageIndex}.png`;
  }
  
  // Fallback to local images
  return `/product${imageIndex}.png`;
};

/**
 * Get logo image URL
 */
export const getLogoUrl = (): string => {
  if (USE_CLOUDINARY) {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/logo.png`;
  }
  
  return '/logo.png';
};

/**
 * Get profile image URL
 */
export const getProfileImageUrl = (): string => {
  if (USE_CLOUDINARY) {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/profile.jpg`;
  }
  
  return '/profile.jpg';
};

