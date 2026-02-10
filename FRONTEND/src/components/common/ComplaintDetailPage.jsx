import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  ThumbsUp,
  MessageCircle,
  ExternalLink,
  Image as ImageIcon,
  Share2,
  Flag
} from 'lucide-react';
import axios from 'axios';

const ComplaintDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    loadComplaintDetails();
  }, [id]);

  const loadComplaintDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/user_issues/${id}`);
      
      if (response.data.success) {
        setComplaint(response.data.data);
      }
    } catch (error) {
      console.error('Error loading complaint:', error);
      alert('Failed to load complaint details');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    try {
      setVoting(true);
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!token || !user) {
        alert('Please login to vote');
        return;
      }
      
      // Check if already voted
      if (complaint?.voters?.includes(user._id)) {
        alert('You have already voted for this issue!');
        return;
      }
      
      const response = await axios.put(
        `${BASE_URL}/api/user_issues/${id}/vote`,
        { userId: user._id },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setComplaint(response.data.data);
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert(error.response?.data?.message || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Not Found</h2>
          <button
            onClick={() => navigate('/home')}
            className="text-blue-600 hover:text-blue-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                  {complaint.status?.toUpperCase()}
                </span>
                <h1 className="text-3xl font-bold mt-4 mb-2">{complaint.title}</h1>
                <div className="flex items-center gap-4 text-sm opacity-90">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {complaint.user?.name || 'Anonymous'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
            </div>

            {/* Location */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-gray-700">{complaint.location}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(complaint.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-1"
                  >
                    View on Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Images */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {complaint.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Complaint ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <a
                        href={image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <ImageIcon className="w-8 h-8 text-white" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category & Priority */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Category</h3>
                <p className="text-gray-900">{complaint.category}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Priority</h3>
                <p className="text-gray-900 capitalize">{complaint.priority || 'Medium'}</p>
              </div>
            </div>

            {/* Engagement Stats */}
            <div className="flex items-center gap-6 py-4 border-t border-b border-gray-200">
              <button
                onClick={handleVote}
                disabled={voting}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                <ThumbsUp className="w-5 h-5" />
                <span className="font-semibold">{complaint.voteCount || 0}</span>
                <span className="text-sm">Votes</span>
              </button>
              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">{complaint.comments?.length || 0}</span>
                <span className="text-sm">Comments</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-red-600">
                <Flag className="w-4 h-4" />
                Report Issue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailPage;