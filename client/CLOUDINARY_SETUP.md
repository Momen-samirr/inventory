# Cloudinary Image Setup

This project now supports Cloudinary for image hosting, with a fallback to local images.

## Current Setup (Local Images)

By default, the project uses local images from the `public/` folder:
- `/product1.png`, `/product2.png`, `/product3.png` - Product images
- `/logo.png` - Logo image
- `/profile.jpg` - Profile image

These images are already copied to the `public/` folder and will work immediately.

## Setting Up Cloudinary (Optional)

To use Cloudinary instead of local images:

1. **Sign up for Cloudinary** (free tier available):
   - Go to https://cloudinary.com
   - Create a free account
   - Get your Cloud Name from the dashboard

2. **Upload images to Cloudinary**:
   - Upload `product1.png`, `product2.png`, `product3.png` to a folder named `products/`
   - Upload `logo.png` to the root
   - Upload `profile.jpg` to the root

3. **Configure environment variable**:
   - Create a `.env.local` file in the `client/` directory
   - Add: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name`
   - Replace `your-cloud-name` with your actual Cloudinary cloud name

4. **Restart your development server**:
   ```bash
   npm run dev
   ```

## Image Utility Functions

All image URLs are managed through `/src/utils/images.ts`:
- `getProductImageUrl(productId, index?)` - Get product image URL
- `getLogoUrl()` - Get logo URL
- `getProfileImageUrl()` - Get profile image URL

The utility automatically switches between Cloudinary and local images based on the environment variable.

