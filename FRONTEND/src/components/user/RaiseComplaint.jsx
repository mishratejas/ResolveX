import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  MapPin,
  Camera,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  ThumbsUp,
  Map as MapIcon,
  Navigation,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import complaintService from "../../services/complaintService";
import departmentService from "../../services/departmentService";
import DuplicateWarningModal from "./DuplicateWarningModal";

const BASE_URL =
  import.meta.env.VITE_API_URL || "https://webster-2025.onrender.com";

const RaiseComplaint = ({ currentUser }) => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateComplaints, setDuplicateComplaints] = useState([]);

  // Department states
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  // Map states
  const [showMap, setShowMap] = useState(false);
  const [map, setMap] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    location: {
      address: "",
      latitude: null,
      longitude: null,
    },
    image: null,
  });
  const [locationLoading, setLocationLoading] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    if (showMap && !window.L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initializeMap;
      document.body.appendChild(script);
    } else if (showMap && window.L && !map) {
      initializeMap();
    }
  }, [showMap]);

  const initializeMap = () => {
    if (!window.L || !mapRef.current || map) return;

    // Default to a central location or user's last known location
    const defaultLat = formData.location.latitude || 28.6139;
    const defaultLng = formData.location.longitude || 77.209;

    const newMap = window.L.map(mapRef.current).setView(
      [defaultLat, defaultLng],
      13,
    );

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(newMap);

    // Add click handler - NOW USING THE CORRECT FUNCTION
    newMap.on("click", handleMapClick); // ← FIX: Now using the handleMapClick function

    // Add marker if location exists
    if (formData.location.latitude && formData.location.longitude) {
      const marker = window.L.marker([
        formData.location.latitude,
        formData.location.longitude,
      ]).addTo(newMap);
      markerRef.current = marker;
    }

    setMap(newMap);
  };

  const handleMapClick = useCallback(
    async (e) => {
      const { lat, lng } = e.latlng;

      // Update marker
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else if (window.L && map) {
        const marker = window.L.marker([lat, lng]).addTo(map);
        markerRef.current = marker;
      }

      // Reverse geocode
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        );

        if (response.ok) {
          const data = await response.json();
          const address = data.locality
            ? `${data.locality}, ${data.principalSubdivision}, ${data.countryName}`
            : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

          setFormData((prev) => ({
            ...prev,
            location: {
              address,
              latitude: lat,
              longitude: lng,
            },
          }));
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        setFormData((prev) => ({
          ...prev,
          location: {
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            latitude: lat,
            longitude: lng,
          },
        }));
      }
    },
    [map],
  );

  // Fetch departments on mount
  useEffect(() => {
    let isMounted = true;

    const fetchDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        setError("");

        // 🔥 FIX: Get workspace directly from localStorage each time
        // Don't rely on state or props that might be stale
        const workspaceStr = localStorage.getItem("currentWorkspace");
        console.log("📦 Raw workspace from localStorage:", workspaceStr);

        if (!workspaceStr) {
          if (isMounted) {
            setError("Please select a workspace first.");
            setDepartments([]);
          }
          return;
        }

        let currentWorkspace;
        try {
          currentWorkspace = JSON.parse(workspaceStr);
        } catch (e) {
          console.error("❌ Failed to parse workspace:", e);
          localStorage.removeItem("currentWorkspace"); // Clear corrupted data
          if (isMounted) {
            setError(
              "Invalid workspace data. Please select your workspace again.",
            );
            setDepartments([]);
          }
          return;
        }

        console.log("🔍 Parsed workspace:", currentWorkspace);

        // 🔥 FIX: Check for BOTH possible property names
        const workspaceCode =
          currentWorkspace.workspaceCode || currentWorkspace.code;

        if (!workspaceCode) {
          console.error("❌ No workspace code found in:", currentWorkspace);
          // Try to fix the workspace data if it has 'code' property
          if (currentWorkspace.code) {
            const fixedWorkspace = {
              ...currentWorkspace,
              workspaceCode: currentWorkspace.code,
            };
            localStorage.setItem(
              "currentWorkspace",
              JSON.stringify(fixedWorkspace),
            );
            console.log("✅ Fixed workspace data, retrying...");
            // Retry with fixed data
            setTimeout(() => {
              if (isMounted) {
                fetchDepartments();
              }
            }, 100);
            return;
          }

          if (isMounted) {
            setError(
              "Invalid workspace data. Please select your workspace again.",
            );
            setDepartments([]);
          }
          return;
        }

        console.log(
          "📡 Fetching departments for workspace code:",
          workspaceCode,
        );

        // 🔥 FIX: Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response =
          await departmentService.getDepartmentsByWorkspaceCode(workspaceCode);

        clearTimeout(timeoutId);

        console.log("✅ Departments API response:", response);

        if (isMounted) {
          if (response && response.success) {
            const departmentsData = response.data || [];
            console.log("📋 Departments received:", departmentsData);

            if (departmentsData.length > 0) {
              setDepartments(departmentsData);
              setFormData((prev) => ({
                ...prev,
                department: departmentsData[0]._id,
                category: departmentsData[0].name, // ← Make sure this is set
              }));
              setError("");
            } else {
              // No departments found - this is a valid state
              setDepartments([]);
              setError("No departments found in this workspace.");
            }
          } else {
            setError("Failed to load departments from server.");
            setDepartments([]);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching departments:", error);
        if (isMounted) {
          if (error.name === "AbortError") {
            setError("Request timeout. Please try again.");
          } else {
            setError("Error loading departments. Please try again.");
          }
          setDepartments([]);
        }
      } finally {
        if (isMounted) {
          setDepartmentsLoading(false);
        }
      }
    };

    fetchDepartments();

    return () => {
      isMounted = false;
    };
  }, []);

  const getCurrentLocation = () => {
    setLocationLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Update map if it exists
        if (map) {
          map.setView([latitude, longitude], 15);
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else if (window.L) {
            const marker = window.L.marker([latitude, longitude]).addTo(map);
            markerRef.current = marker;
          }
        }

        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          );

          if (response.ok) {
            const data = await response.json();
            const address = data.locality
              ? `${data.locality}, ${data.principalSubdivision}, ${data.countryName}`
              : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

            setFormData((prev) => ({
              ...prev,
              location: {
                address,
                latitude,
                longitude,
              },
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              location: {
                address: `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`,
                latitude,
                longitude,
              },
            }));
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          setFormData((prev) => ({
            ...prev,
            location: {
              address: `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`,
              latitude,
              longitude,
            },
          }));
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setError(
          "Could not get your location. Please use the map or enter address manually.",
        );
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If this is the department select, also update category with the department name
    if (name === "department") {
      // Find the selected department to get its name
      const selectedDept = departments.find((dept) => dept._id === value);
      setFormData((prev) => ({
        ...prev,
        department: value, // Store the department ID
        category: selectedDept ? selectedDept.name : value, // Store department name in category
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleLocationChange = (e) => {
    const address = e.target.value;
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        address: address,
      },
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setFormData((prev) => ({ ...prev, image: file }));
    }
  };

  // 🔧 IMPROVED: Better similarity detection
  const checkForDuplicates = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Please login to submit complaint");
        return false;
      }

      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        setError("User data not found. Please login again.");
        return false;
      }

      const currentWorkspace = JSON.parse(
        localStorage.getItem("currentWorkspace"),
      );
      if (!currentWorkspace) {
        setError("Please select a workspace before submitting a complaint");
        return false;
      }

      if (
        !formData.location.address ||
        formData.location.address.trim() === ""
      ) {
        setError("Please provide a location for the complaint");
        return false;
      }

      // Only check duplicates if we have coordinates
      if (formData.location.latitude && formData.location.longitude) {
        const checkData = {
          title: formData.title,
          category: formData.category,
          description: formData.description,
          location: {
            address: formData.location.address,
            latitude: formData.location.latitude,
            longitude: formData.location.longitude,
          },
          workspaceId: currentWorkspace.id,
        };

        console.log("🔍 Checking for duplicates with:", checkData);

        const response = await complaintService.checkDuplicate(checkData);

        if (response.success && response.hasDuplicates) {
          console.log("⚠️ Found similar complaints:", response.duplicates);
          setDuplicateComplaints(response.duplicates);
          setShowDuplicateModal(true);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return true; // Allow submission if duplicate check fails
    }
  };

  const handleUpvoteDuplicate = async (complaintId) => {
    try {
      await complaintService.upvoteComplaint(complaintId);
      setSuccess(true);
      setTimeout(() => {
        navigate("/home/my-complaints");
      }, 2000);
    } catch (error) {
      console.error("Error upvoting:", error);
      setError("Failed to upvote complaint. Please try again.");
    }
  };

  const handleProceedAnyway = () => {
    setShowDuplicateModal(false);
    submitComplaint(true);
  };

  const submitComplaint = async (skipDuplicateCheck = false) => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user?.id || user?._id;
      const currentWorkspace = JSON.parse(
        localStorage.getItem("currentWorkspace"),
      );

      if (!userId) {
        setError("User session invalid. Please login again.");
        setLoading(false);
        return;
      }

      if (!currentWorkspace) {
        setError("Please select a workspace before submitting a complaint");
        setLoading(false);
        return;
      }

      // 🔥 DEBUG: Log formData to see what's in it
      console.log("📋 Form Data before submission:", {
        title: formData.title,
        description: formData.description,
        department: formData.department,
        category: formData.category,
        location: formData.location,
      });

      const payload = {
        title: formData.title,
        category: formData.category, // This should be the department name
        description: formData.description,
        department: formData.department, // This should be the department ID
        location: {
          address: formData.location.address || "Location not specified",
          latitude: formData.location.latitude || null,
          longitude: formData.location.longitude || null,
        },
        userId: userId,
        adminId: currentWorkspace.id,
        images: [],
        skipDuplicateCheck,
      };

      console.log("📤 Submitting payload:", payload);

      const response = await axios.post(
        `${BASE_URL}/api/user_issues`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("✅ Response:", response.data);

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/home/my-complaints");
        }, 2000);
      } else {
        setError(response.data.message || "Failed to submit complaint");
      }
    } catch (error) {
      console.error("❌ Error submitting complaint:", error);

      if (error.response?.status === 409 && error.response.data.hasDuplicates) {
        setDuplicateComplaints(error.response.data.duplicates);
        setShowDuplicateModal(true);
      } else if (error.response?.status === 401) {
        setError("Session expired. Please login again.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setTimeout(() => navigate("/"), 2000);
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to submit complaint. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentWorkspace = localStorage.getItem("currentWorkspace");
    if (!currentWorkspace) {
      setError("Please select a workspace before submitting a complaint");
      return;
    }

    if (!formData.department) {
      // ← FIX: Check for department, not category
      setError("Please select a department");
      return;
    }

    const shouldProceed = await checkForDuplicates();
    if (shouldProceed) {
      submitComplaint();
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complaint Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for helping improve your community.
          </p>
          <button
            onClick={() => navigate("/home/my-complaints")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View My Complaints
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Report a Community Issue
        </h1>
        <p className="text-gray-600 mt-2">
          Help improve your community by reporting issues that need attention
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Submission Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      <DuplicateWarningModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        duplicates={duplicateComplaints}
        onUpvote={handleUpvoteDuplicate}
        onProceed={handleProceedAnyway}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              {/* Issue Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Pothole on Main Street, Street Light Not Working"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Be specific and descriptive
                </p>
              </div>

              {/* Department Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                {departmentsLoading ? (
                  <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">
                      Loading departments...
                    </span>
                  </div>
                ) : departments.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-yellow-800 font-medium">
                          No Departments Available
                        </p>
                        <p className="text-yellow-600 text-sm mt-1">
                          No departments found. Please contact your
                          administrator.
                        </p>
                        <button
                          onClick={() => window.location.reload()}
                          className="mt-3 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <select
                      name="department"
                      value={formData.department || ""}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors bg-white"
                    >
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      Select the department that should handle this complaint
                    </p>
                  </>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Please provide detailed information about the issue..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
                />
              </div>

              {/* Priority Info */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      🤖 AI-Powered Priority
                    </h4>
                    <p className="text-sm text-gray-700">
                      Our AI will automatically assign priority based on urgency
                      and impact.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Section with Map */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.location.address}
                      onChange={handleLocationChange}
                      required
                      placeholder="e.g., Main Street near City Park, Sector 15"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                  >
                    {locationLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Getting...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        Use My Location
                      </>
                    )}
                  </button>
                </div>
                {formData.location.latitude && formData.location.longitude && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ GPS coordinates: {formData.location.latitude.toFixed(6)},{" "}
                    {formData.location.longitude.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Map Toggle */}
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MapIcon className="w-4 h-4" />
                {showMap ? "Hide Map" : "Show Map - Select Location Visually"}
              </button>

              {/* Map Container */}
              {showMap && (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div ref={mapRef} className="w-full h-96" />
                  <div className="p-3 bg-gray-50 text-sm text-gray-600">
                    <p>
                      Click on the map to set the exact location of the issue
                    </p>
                  </div>
                </div>
              )}

              {/* Duplicate Detection Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ThumbsUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      🔍 Duplicate Detection
                    </h4>
                    <p className="text-sm text-gray-700">
                      We'll check if similar complaints exist nearby (~150
                      meters). You can upvote existing complaints instead.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Image & Submit */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Add Photo (Optional)
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {formData.image ? (
                    <div className="space-y-3">
                      <div className="w-20 h-20 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(formData.image)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        {formData.image.name}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, image: null }))
                        }
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-2">
                        Click to upload a photo
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG up to 5MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Ready to Submit
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>AI will analyze and prioritize</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Duplicate detection active</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Workspace authorities notified</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  loading || departmentsLoading || departments.length === 0
                }
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Submit Complaint
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RaiseComplaint;
