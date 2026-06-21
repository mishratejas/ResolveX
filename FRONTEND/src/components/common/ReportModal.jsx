import React from 'react';
import { X } from 'lucide-react';

const ReportModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl w-full max-w-md shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Quick Report</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Please sign in or register to report community issues and track their resolution.
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Sign In to Report
            </button>
            <button 
              onClick={onClose}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;