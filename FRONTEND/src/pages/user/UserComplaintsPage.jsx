import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || "https://webster-2025.onrender.com";

const UserComplaintsPage = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserComplaints();
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const fetchUserComplaints = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BASE_URL}/api/user_issues/my-issues`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setComplaints(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/home')}
            className="text-navy hover:text-teal mb-4"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-800">My Complaints</h1>
          <p className="text-gray-600">Track all your reported issues here</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal"></div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Complaints Yet</h3>
            <p className="text-gray-500 mb-6">You haven't reported any issues yet.</p>
            <button
              onClick={() => navigate('/home')}
              className="btn-gradient"
            >
              Report First Issue
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.map((complaint) => (
              <div key={complaint._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-gray-800 truncate">{complaint.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{complaint.description}</p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <i className="fas fa-map-marker-alt mr-2 text-teal"></i>
                    <span>{complaint.location?.address || 'No location'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <i className="fas fa-calendar mr-2 text-teal"></i>
                    <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <i className="fas fa-thumbs-up mr-2 text-teal"></i>
                    <span>{complaint.voteCount || 0} votes</span>
                  </div>
                </div>

                {complaint.images && complaint.images.length > 0 && (
                  <div className="mb-4">
                    <img 
                      src={complaint.images[0]} 
                      alt="Complaint" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                {complaint.assignedTo && (
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <i className="fas fa-user-tie mr-2 text-teal"></i>
                    <span>Assigned to: {complaint.assignedTo.name}</span>
                  </div>
                )}

                {complaint.comments && complaint.comments.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600">
                      <i className="fas fa-comment mr-2"></i>
                      Latest update: {complaint.comments[complaint.comments.length - 1].message}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserComplaintsPage;