"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/app/(components)/Header";
import { useGetMeQuery, useUpdateUserMutation, useUploadUserImageMutation, api } from "@/state/api";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";
import Image from "next/image";
import { getProfileImageUrl } from "@/utils/images";
import ImageUpload from "@/components/ImageUpload";
import { useAppDispatch } from "@/app/redux";
import { updateUser } from "@/state/authSlice";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  newPassword: z.string().min(6, "New password must be at least 6 characters").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const Settings = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { data: userData, isLoading, refetch } = useGetMeQuery();
  const [updateUserMutation, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [uploadUserImage, { isLoading: isUploadingImage }] = useUploadUserImageMutation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    // Check dark mode from localStorage or system preference
    const darkMode = localStorage.getItem("darkMode") === "true" || 
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDarkMode(darkMode);
  }, []);

  useEffect(() => {
    if (userData) {
      reset({
        name: userData.name,
        email: userData.email,
        password: "",
        newPassword: "",
      });
    }
  }, [userData, reset]);

  const handleProfileUpdate = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      const updateData: any = {
        name: data.name,
        email: data.email,
      };

      // Only update password if new password is provided
      if (data.newPassword && data.newPassword.trim() !== "") {
        // In a real app, you'd verify the current password first
        // For now, we'll just update to the new password
        updateData.password = data.newPassword;
      }

      const updatedUser = await updateUserMutation({ id: user.userId, data: updateData }).unwrap();
      
      // Update Redux auth state with updated user data
      if (updatedUser.data) {
        dispatch(updateUser({
          name: updatedUser.data.name,
          email: updatedUser.data.email,
        }));
      }
      toast.success("Profile updated successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.error?.message || "Failed to update profile");
    }
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    
    // Update document class
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    
    toast.success(`Dark mode ${newDarkMode ? "enabled" : "disabled"}`);
  };

  const handleImageUpload = async () => {
    if (!user || !selectedImageFile) return;

    try {
      const result = await uploadUserImage({ id: user.userId, file: selectedImageFile }).unwrap();
      toast.success("Profile image updated successfully");
      setSelectedImageFile(null);
      
      // Update Redux auth state with new imageUrl immediately
      if (result.data?.imageUrl) {
        dispatch(updateUser({ imageUrl: result.data.imageUrl }));
      }
      
      // Invalidate and refetch getMe query to update all components
      dispatch(api.util.invalidateTags([{ type: "Users" }]));
      await refetch();
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage = error?.data?.error?.message || error?.data?.message || error?.message || "Failed to upload image";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="py-4 flex justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  const currentUser = userData || user;

  return (
    <div className="w-full">
      <Header name="Settings" />
      
      <div className="mt-5 space-y-6">
        {/* Profile Settings */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
          
          {/* Profile Image Upload */}
          <div className="mb-6 pb-6 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Image
                  src={currentUser?.imageUrl || getProfileImageUrl()}
                  alt="Profile"
                  width={100}
                  height={100}
                  className="rounded-full w-24 h-24 object-cover border-2 border-gray-200"
                />
              </div>
              <div className="flex-1">
                <ImageUpload
                  currentImageUrl={currentUser?.imageUrl || undefined}
                  onImageSelect={setSelectedImageFile}
                  label="Profile Image"
                />
                {selectedImageFile && (
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={isUploadingImage}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingImage ? "Uploading..." : "Upload Image"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(handleProfileUpdate)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                {...register("name")}
                type="text"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                {...register("email")}
                type="email"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password (leave blank to keep current)
              </label>
              <input
                {...register("newPassword")}
                type="password"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new password"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </form>
        </div>

        {/* Preferences */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dark Mode
                </label>
                <p className="text-sm text-gray-500">Toggle dark mode theme</p>
              </div>
              <label className="inline-flex relative items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isDarkMode}
                  onChange={handleDarkModeToggle}
                />
                <div
                  className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-blue-400 peer-focus:ring-4 
                  transition peer-checked:after:translate-x-full peer-checked:after:border-white 
                  after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                  after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all
                  peer-checked:bg-blue-600"
                ></div>
              </label>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Role:</span>
              <span className="text-sm text-gray-900">{currentUser?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className={`text-sm ${currentUser?.isActive ? "text-green-600" : "text-red-600"}`}>
                {currentUser?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {(currentUser as any)?.createdAt && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Member since:</span>
                <span className="text-sm text-gray-900">
                  {new Date((currentUser as any).createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
