import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ThumbsUp, X, MapPin, Clock, ArrowRight } from 'lucide-react';
import { formatDistance, formatRelativeTime } from '../../utils/formatUtils';

const DuplicateWarningModal = ({ isOpen, onClose, duplicates, onUpvote, onProceed }) => {
  if (!isOpen) return null;

  const handleUpvote = (complaintId) => {
    onUpvote(complaintId);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-auto overflow-hidden"
          >
            {/* Header */}
            <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Similar Complaints Found Nearby
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    We found {duplicates.length} similar complaint{duplicates.length > 1 ? 's' : ''} in your area. 
                    Instead of creating a new one, you can upvote an existing complaint to increase its priority.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Duplicate List */}
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {duplicates.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-yellow-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{complaint.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        complaint.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        complaint.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        complaint.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {complaint.priority}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {complaint.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {formatDistance(complaint.distance)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(complaint.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {complaint.voteCount} upvote{complaint.voteCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {complaint.hasUserVoted ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <ThumbsUp className="w-4 h-4" />
                        <span>You've already upvoted this complaint</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpvote(complaint._id)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Upvote This Complaint
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={onProceed}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                Proceed Anyway
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default DuplicateWarningModal;