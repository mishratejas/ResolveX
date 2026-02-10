// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const BASE_URL = import.meta.env.VITE_API_URL || "https://webster-2025.onrender.com";

// const ReportModal = ({ onClose, onSuccess, currentUser }) => {
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     category: '',
//     location: '',
//     latitude: '',
//     longitude: '',
//     image: null
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const categories = [
//     { value: 'infrastructure', label: 'Infrastructure' },
//     { value: 'safety', label: 'Public Safety' },
//     { value: 'environment', label: 'Environment' },
//     { value: 'other', label: 'Other' }
//   ];

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           setFormData(prev => ({
//             ...prev,
//             latitude: position.coords.latitude.toString(),
//             longitude: position.coords.longitude.toString()
//           }));
//         },
//         () => {
//           console.log('Geolocation permission denied');
//         }
//       );
//     }
//   }, []);

//   const handleChange = (e) => {
//     const { name, value, files } = e.target;
//     if (name === 'image') {
//       setFormData(prev => ({ ...prev, image: files[0] }));
//     } else {
//       setFormData(prev => ({ ...prev, [name]: value }));
//     }
//     setError('');
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!currentUser) {
//       setError('Please login to submit a complaint');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       // Step 1: Upload image if present
//       let imageUrls = [];
//       if (formData.image) {
//         const uploadForm = new FormData();
//         uploadForm.append('image', formData.image);

//         const uploadRes = await axios.post(`${BASE_URL}/api/upload`, uploadForm, {
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
//           }
//         });

//         if (uploadRes.data.success) {
//           imageUrls = uploadRes.data.urls;
//         }
//       }

//       // Step 2: Submit complaint
//       const complaintData = {
//         title: formData.title,
//         description: formData.description,
//         category: formData.category,
//         location: formData.location,
//         latitude: formData.latitude ? parseFloat(formData.latitude) : null,
//         longitude: formData.longitude ? parseFloat(formData.longitude) : null,
//         images: imageUrls
//       };

//       const response = await axios.post(`${BASE_URL}/api/user_issues`, complaintData, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.data.success) {
//         alert('Complaint submitted successfully!');
//         onSuccess();
//       } else {
//         setError(response.data.message);
//       }
//     } catch (error) {
//       console.error('Error submitting complaint:', error);
//       setError(error.response?.data?.message || 'Failed to submit complaint');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//         <div className="p-8">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-2xl font-bold text-gray-800">Report New Issue</h2>
//             <button
//               onClick={onClose}
//               className="text-gray-500 hover:text-gray-700"
//             >
//               <i className="fas fa-times text-xl"></i>
//             </button>
//           </div>

//           {error && (
//             <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <label className="block text-gray-700 font-medium mb-2">Issue Title</label>
//               <input
//                 type="text"
//                 name="title"
//                 value={formData.title}
//                 onChange={handleChange}
//                 placeholder="Brief description of the issue"
//                 className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-gray-700 font-medium mb-2">Description</label>
//               <textarea
//                 name="description"
//                 value={formData.description}
//                 onChange={handleChange}
//                 placeholder="Detailed description of the issue..."
//                 className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors h-32"
//                 required
//               />
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-gray-700 font-medium mb-2">Upload Image</label>
//                 <input
//                   type="file"
//                   name="image"
//                   onChange={handleChange}
//                   accept="image/*"
//                   className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
//                 />
//               </div>
//               <div>
//                 <label className="block text-gray-700 font-medium mb-2">Category</label>
//                 <select
//                   name="category"
//                   value={formData.category}
//                   onChange={handleChange}
//                   className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
//                   required
//                 >
//                   <option value="">Select Category</option>
//                   {categories.map((cat) => (
//                     <option key={cat.value} value={cat.value}>
//                       {cat.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             <div>
//               <label className="block text-gray-700 font-medium mb-2">Location</label>
//               <input
//                 type="text"
//                 name="location"
//                 value={formData.location}
//                 onChange={handleChange}
//                 placeholder="Street, Area"
//                 className="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
//                 required
//               />
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full btn-gradient disabled:opacity-50"
//             >
//               {loading ? 'Submitting...' : 'Submit Issue'}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ReportModal;

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