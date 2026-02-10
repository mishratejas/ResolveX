import React from 'react';

const ComplaintCard = ({ complaint, onVote, onClick, currentUser }) => {
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-green-100 text-green-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-blue-100 text-blue-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleVoteClick = (e) => {
    e.stopPropagation();
    if (!currentUser) {
      alert('Please login to vote');
      return;
    }
    onVote(complaint._id);
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg p-4 flex gap-4 cursor-pointer hover:shadow-xl transition-shadow border-l-4 border-teal"
    >
      {/* Voting Section */}
      <div className="flex flex-col items-center space-y-1">
        <button 
          onClick={handleVoteClick}
          className="vote-btn hover:text-teal transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
          </svg>
        </button>
        <span className="font-bold text-gray-800">{complaint.voteCount || 0}</span>
        <span className="text-xs text-gray-500">Votes</span>
      </div>

      {/* Main Content */}
      <div className="grow min-w-0">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-800">{complaint.title}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
            {complaint.status}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3 wrap-break-word">{complaint.description}</p>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
          <span>
            <i className="fas fa-calendar mr-1"></i>
            {new Date(complaint.createdAt).toLocaleDateString()}
          </span>
          <span>
            <i className="fas fa-user mr-1"></i>
            {complaint.user?.name || 'Anonymous'}
          </span>
          <span>
            <i className="fas fa-map-marker-alt mr-1"></i>
            {complaint.location?.address || 'No location'}
          </span>
        </div>
      </div>

      {/* Image Preview */}
      <div className="w-24 h-24 bg-linear-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
        {complaint.images && complaint.images.length > 0 ? (
          <img 
            src={complaint.images[0]} 
            className="w-full h-full object-cover" 
            alt="Complaint" 
          />
        ) : (
          <i className="fas fa-camera text-gray-400 text-xl"></i>
        )}
      </div>
    </div>
  );
};

export default ComplaintCard;