"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageSelect: (file: File | null) => void;
  label?: string;
}

export default function ImageUpload({
  currentImageUrl,
  onImageSelect,
  label = "Product Image",
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      onImageSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <Image
              src={preview}
              alt="Preview"
              width={150}
              height={150}
              className="rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No image selected</p>
          </div>
        )}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            {preview ? "Change Image" : "Upload Image"}
          </label>
        </div>
      </div>
      <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</p>
    </div>
  );
}

