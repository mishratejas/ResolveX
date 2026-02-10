import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || "https://webster-2025.onrender.com";

const MyReportsModal = ({ onClose, currentUser }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchMyReports();
    }
  }, [currentUser]);

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/user_issues/my-issues`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.data.success) {
        setReports(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to fetch your reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-green-100 text-green-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-blue-100 text-blue-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">My Reported Issues</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <i className="fas fa-exclamation-circle text-4xl mb-4"></i>
              <p>{error}</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-file-alt text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-600">No Reports Found</h3>
              <p className="text-gray-500">You haven't reported any issues yet.</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="bg-white rounded-xl shadow-md p-4 flex gap-4 border">
                <div className="flex flex-col items-center space-y-1 pt-2 flex-shrink-0">
                  <span className="font-bold text-lg text-gray-800">{report.voteCount || 0}</span>
                  <span className="text-xs text-gray-500">Votes</span>
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{report.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 break-words">{report.description}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
                    <span>
                      <i className="fas fa-calendar mr-1"></i>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      {report.location?.address || 'No location'}
                    </span>
                  </div>
                </div>
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {report.images && report.images.length > 0 ? (
                    <img 
                      src={report.images[0]} 
                      className="w-full h-full object-cover" 
                      alt="Report" 
                    />
                  ) : (
                    <i className="fas fa-camera text-gray-400 text-xl"></i>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReportsModal;