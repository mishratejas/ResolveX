import React from 'react';

const DetailModal = ({ complaint, onClose }) => {
  if (!complaint) return null;

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
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Issue Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-8 space-y-4 overflow-y-auto">
          {/* Image */}
          {complaint.images && complaint.images.length > 0 && (
            <img 
              src={complaint.images[0]} 
              className="w-full h-64 object-contain rounded-lg mb-4 shadow-md" 
              alt="Complaint" 
            />
          )}

          {/* Status, Posted by, Date, Votes */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
              {complaint.status}
            </span>
            <span>
              <i className="fas fa-user mr-2"></i>
              <strong>Posted by:</strong> {complaint.user?.name || 'Anonymous'}
            </span>
            <span>
              <i className="fas fa-calendar mr-2"></i>
              <strong>On:</strong> {new Date(complaint.createdAt).toLocaleDateString()}
            </span>
            <span>
              <i className="fas fa-thumbs-up mr-2"></i>
              <strong>Votes:</strong> {complaint.voteCount || 0}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-3xl font-bold text-gray-900 mb-3">{complaint.title}</h3>

          {/* Description */}
          <p className="text-gray-700 text-base mb-6 whitespace-pre-wrap break-words">
            {complaint.description}
          </p>

          {/* Location */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-lg mb-2 text-gray-800">Location</h4>
            <p className="text-gray-600">
              <i className="fas fa-map-marker-alt mr-2 text-red-500"></i>
              {complaint.location?.address || 'No location provided'}
            </p>
            {complaint.location?.latitude && complaint.location?.longitude && (
              <div className="mt-2">
                <a 
                  href={`https://maps.google.com/?q=${complaint.location.latitude},${complaint.location.longitude}`}
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fas fa-external-link-alt mr-2"></i>
                  View on Google Maps
                </a>
              </div>
            )}
          </div>

          {/* Category */}
          {complaint.category && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-lg mb-2 text-gray-800">Category</h4>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm capitalize">
                {complaint.category}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailModal;