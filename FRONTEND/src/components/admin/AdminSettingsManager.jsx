import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Building2, Mail, Phone, User, Save, KeyRound } from "lucide-react";
import ProfilePhotoUpload from "../common/ProfilePhotoUpload";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminSettingsManager = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", organizationName: "" });

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const data = res.data.data;
        setAdmin(data);
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          organizationName: data.organizationName || "",
        });
      }
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      // Fall back to whatever we already have cached locally
      const cached = localStorage.getItem("adminData") || localStorage.getItem("admin");
      if (cached) {
        const parsed = JSON.parse(cached);
        setAdmin(parsed);
        setForm({
          name: parsed.name || "",
          phone: parsed.phone || "",
          organizationName: parsed.organizationName || "",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const persistAdmin = (updated) => {
    setAdmin(updated);
    const stored = localStorage.getItem("adminData") || localStorage.getItem("admin");
    const merged = { ...(stored ? JSON.parse(stored) : {}), ...updated };
    localStorage.setItem("adminData", JSON.stringify(merged));
    localStorage.setItem("admin", JSON.stringify(merged));
  };

  const handlePhotoUploaded = async (imageUrl) => {
    try {
      const res = await axios.put(
        `${BASE_URL}/api/admin/profile`,
        { profileImage: imageUrl },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data.success) {
        persistAdmin(res.data.data);
      }
    } catch (error) {
      console.error("Error saving profile photo:", error);
      toast.error("Photo uploaded, but failed to save it to your profile.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(`${BASE_URL}/api/admin/profile`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        persistAdmin(res.data.data);
        toast.success("Profile updated!");
      }
    } catch (error) {
      console.error("Error updating admin profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <ProfilePhotoUpload
            currentImage={admin?.profileImage}
            name={admin?.name}
            token={token}
            onUploaded={handlePhotoUploaded}
            size="w-24 h-24"
            ringColor="border-white/30"
            fallbackBg="bg-gradient-to-br from-white/20 to-white/10"
          />
          <div>
            <h1 className="text-2xl font-bold mb-1">{admin?.name || "Administrator"}</h1>
            <div className="flex flex-wrap gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{admin?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{admin?.organizationName}</span>
              </div>
            </div>
            <p className="text-white/70 text-sm mt-2">
              Click the camera icon on your photo to upload a new one.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-orange-600" />
          Profile Information
        </h2>

        <form onSubmit={handleSave} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-sm transition-all"
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Organization Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.organizationName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, organizationName: e.target.value }))
                }
                className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-sm transition-all"
                placeholder="Your organization"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-sm transition-all"
                placeholder="10-digit phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Workspace Code
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={admin?.workspaceCode || ""}
                disabled
                className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 bg-gray-100 rounded-lg text-sm text-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:opacity-90 text-sm font-semibold flex items-center gap-2 disabled:opacity-60 shadow-md"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminSettingsManager;