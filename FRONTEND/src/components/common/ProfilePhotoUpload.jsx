import React, { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

/**
 * Reusable avatar with a built-in upload control.
 * Uploads the picked image straight to Cloudinary via the existing
 * POST /api/upload endpoint, then hands the resulting secure_url back
 * to the caller via onUploaded — the caller is responsible for
 * persisting that URL (PUT to its own profile endpoint).
 */
const ProfilePhotoUpload = ({
  currentImage,
  name,
  token,
  onUploaded,
  size = "w-24 h-24",
  ringColor = "border-white/30",
  borderWidth = "border-4",
  fallbackBg = "bg-gradient-to-br from-white/20 to-white/10",
  textColor = "text-white",
  textSize = "text-3xl",
  buttonSize = "w-8 h-8",
  iconSize = "w-4 h-4",
}) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please choose a JPG, PNG, or WEBP image");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await axios.post(`${BASE_URL}/api/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedUrl = res.data?.urls?.[0];
      if (!res.data?.success || !uploadedUrl) {
        throw new Error(res.data?.message || "Upload failed");
      }

      await onUploaded?.(uploadedUrl);
      toast.success("Profile photo updated!");
    } catch (error) {
      console.error("Profile photo upload error:", error);
      toast.error(
        error.response?.data?.message || "Failed to upload photo. Please try again.",
      );
      setPreview(null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreviewUrl);
    }
  };

  const displayImage = preview || currentImage;

  return (
    <div className="relative inline-block shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {displayImage ? (
        <img
          src={displayImage}
          alt={name || "Profile"}
          className={`${size} rounded-full ${borderWidth} ${ringColor} object-cover`}
        />
      ) : (
        <div
          className={`${size} ${fallbackBg} rounded-full ${borderWidth} ${ringColor} flex items-center justify-center ${textColor} ${textSize} font-bold`}
        >
          {name?.charAt(0)?.toUpperCase() || "U"}
        </div>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={`absolute bottom-0 right-0 ${buttonSize} bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-100 hover:scale-110 transition-transform disabled:opacity-60 disabled:cursor-not-allowed`}
        title="Change profile photo"
      >
        {uploading ? (
          <Loader2 className={`${iconSize} text-gray-600 animate-spin`} />
        ) : (
          <Camera className={`${iconSize} text-gray-600`} />
        )}
      </button>
    </div>
  );
};

export default ProfilePhotoUpload;