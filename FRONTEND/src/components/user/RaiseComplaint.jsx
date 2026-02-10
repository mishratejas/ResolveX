import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  MapPin,
  Camera,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || "https://webster-2025.onrender.com";

const RaiseComplaint = ({ currentUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'road',
    description: '',
    location: '',
    priority: 'medium',
    image: null
  });

  const categories = [
    { id: 'road', label: 'Road & Infrastructure' },
    { id: 'sanitation', label: 'Sanitation & Waste' },
    { id: 'water', label: 'Water Supply' },
    { id: 'electricity', label: 'Electricity' },
    { id: 'security', label: 'Security' },
    { id: 'transport', label: 'Transport' },
    { id: 'other', label: 'Other' }
  ];

  const priorities = [
    { id: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { id: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
  ];
  const [locationLoading, setLocationLoading] = useState(false);

const getCurrentLocation = () => {
  setLocationLoading(true);
  
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    setLocationLoading(false);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      
      try {
        // Reverse geocode to get address
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        
        setFormData(prev => ({
          ...prev,
          location: data.display_name || `${latitude}, ${longitude}`
        }));
      } catch (error) {
        console.error('Error getting address:', error);
        setFormData(prev => ({
          ...prev,
          location: `${latitude}, ${longitude}`
        }));
      } finally {
        setLocationLoading(false);
      }
    },
    (error) => {
      console.error('Error getting location:', error);
      alert('Could not get your location. Please enter manually.');
      setLocationLoading(false);
    }
  );
};
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Please login to submit complaint');
      return;
    }
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setError('User data not found. Please login again.');
      return;
    }
    
    // Create JSON payload instead of FormData
    const payload = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      location: formData.location,
      priority: formData.priority,
      userId: user._id
    };
    
    const response = await axios.post(`${BASE_URL}/api/user_issues`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/home/my-complaints');
      }, 2000);
    } else {
      setError(response.data.message || 'Failed to submit complaint');
    }
  } catch (error) {
    console.error('Error submitting complaint:', error);
    if (error.response?.status === 401) {
      setError('Session expired. Please login again.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } else {
      setError(error.response?.data?.message || 'Failed to submit complaint. Please try again.');
    }
  } finally {
    setLoading(false);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Submitted Successfully!</h2>
          <p className="text-gray-600 mb-6">Your issue has been registered and will be reviewed soon.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/home/my-complaints')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View My Complaints
            </button>
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Report a Community Issue</h1>
        <p className="text-gray-600 mt-2">Help improve your community by reporting issues that need attention</p>
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

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
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
                <p className="text-sm text-gray-500 mt-1">Be specific and descriptive</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                      className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                        formData.category === category.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
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
                  placeholder="Please provide detailed information about the issue, including when you noticed it and any specific concerns..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">Provide as much detail as possible</p>
              </div>

              {/* Location */}
              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Location *
  </label>
  <div className="flex gap-2">
    <div className="relative flex-1">
      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        name="location"
        value={formData.location}
        onChange={handleChange}
        required
        placeholder="e.g., Main Street near City Park, Sector 15"
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
      />
    </div>
    <button
      type="button"
      onClick={getCurrentLocation}
      disabled={locationLoading}
      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {locationLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Getting...
        </>
      ) : (
        <>
          <MapPin className="w-4 h-4" />
          Use My Location
        </>
      )}
    </button>
  </div>
</div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <div className="flex gap-3">
                  {priorities.map(priority => (
                    <button
                      key={priority.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, priority: priority.id }))}
                      className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        formData.priority === priority.id
                          ? `${priority.color} border-transparent`
                          : 'border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Image Upload & Preview */}
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
                      <p className="text-sm text-gray-600">{formData.image.name}</p>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-2">Click to upload a photo</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </label>
              </div>
              
              <div className="mt-4 flex items-start gap-2 text-sm text-gray-500">
                <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p>Adding a photo helps authorities understand the issue better and speeds up resolution.</p>
              </div>
            </div>

            {/* Preview & Submit */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Ready to Submit</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Your report will be visible to community members</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Local authorities will be notified</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>You can track the resolution status</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-blue-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Submit Complaint
                    </>
                  )}
                </button>
                
                <p className="text-xs text-gray-500 mt-3 text-center">
                  By submitting, you agree to our terms and confirm the accuracy of information provided.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RaiseComplaint;