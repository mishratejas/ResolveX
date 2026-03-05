// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { 
//   Building, Plus, Search, Trash2, Edit, AlertCircle, 
//   CheckCircle, X, Loader2 
// } from 'lucide-react';

// const DepartmentManager = () => {
//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
  
//   // Modal State
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [newDept, setNewDept] = useState({ name: '', description: '' });

//   // Fetch Departments
//   const fetchDepartments = async () => {
//     try {
//       setLoading(true);
//       const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
//       const code = adminData.workspaceCode;
      
//       // Replace localhost:3000 with your actual backend URL if different
//       const response = await fetch(`http://localhost:3000/api/admin/departments/workspace/${code}`);
//       const result = await response.json();
      
//       if (response.ok && result.success) {
//         setDepartments(result.data);
//       } else {
//         throw new Error(result.message || 'Failed to fetch departments');
//       }
//     } catch (err) {
//       console.error(err);
//       setError('Could not load departments. Please check your connection.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDepartments();
//   }, []);

//   // Handle Add Department
//   const handleAddDepartment = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setError('');
    
//     try {
//       const token = localStorage.getItem('adminToken') || localStorage.getItem('adminAccessToken');
//       const response = await fetch('http://localhost:3000/api/admin/departments', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify(newDept)
//       });
      
//       const result = await response.json();
      
//       if (response.ok && result.success) {
//         setSuccess('Department added successfully!');
//         setNewDept({ name: '', category: '', description: '' });
//         setIsAddModalOpen(false);
//         fetchDepartments(); // Refresh the table
        
//         setTimeout(() => setSuccess(''), 3000);
//       } else {
//         throw new Error(result.message || 'Failed to add department');
//       }
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Placeholder for Delete/Reassign logic (we will build this next!)
//   const handleDeleteClick = (deptId, deptName) => {
//     alert(`Delete clicked for ${deptName}. We will add the Re-assign Staff/Tickets logic here next!`);
//   };

//   return (
//     <div className="w-full">
//       {/* Header Area */}
//       <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
//             <Building className="w-6 h-6 text-orange-500" />
//             Department Management
//           </h2>
//           <p className="text-gray-600 text-sm mt-1">Create and manage operational departments for your organization.</p>
//         </div>
//         <button 
//           onClick={() => setIsAddModalOpen(true)}
//           className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all hover:scale-105 font-medium"
//         >
//           <Plus className="w-4 h-4" /> Add Department
//         </button>
//       </div>

//       {/* Success/Error Alerts */}
//       <AnimatePresence>
//         {success && (
//           <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-2 text-sm font-medium">
//             <CheckCircle className="w-4 h-4" /> {success}
//           </motion.div>
//         )}
//         {error && (
//           <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-sm font-medium">
//             <AlertCircle className="w-4 h-4" /> {error}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Departments Table */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//         {loading ? (
//           <div className="p-8 text-center text-gray-500 flex flex-col items-center">
//             <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
//             Loading departments...
//           </div>
//         ) : departments.length === 0 ? (
//           <div className="p-12 text-center text-gray-500">
//             <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
//             <p className="text-lg font-medium text-gray-700">No departments found</p>
//             <p className="text-sm mt-1 mb-4">You haven't added any departments to your workspace yet.</p>
//             <button onClick={() => setIsAddModalOpen(true)} className="text-orange-600 font-medium hover:underline">
//               Create your first department
//             </button>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-left border-collapse">
//               <thead>
//                 <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
//                   <th className="p-4 font-semibold">Department Name</th>
//                   <th className="p-4 font-semibold text-center">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-100">
//                 {departments.map((dept) => (
//                   <tr key={dept._id} className="hover:bg-orange-50/30 transition-colors">
//                     <td className="p-4">
//                       <div className="font-bold text-gray-900">
//                         {dept.name}
//                         {/* Add a little badge if it's the permanent 'Other' department */}
//                         {dept.name.toLowerCase() === 'other' && (
//                            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] uppercase rounded font-bold">Default</span>
//                         )}
//                       </div>
//                       <div className="text-xs text-gray-500 truncate max-w-xs">{dept.description}</div>
//                     </td>
//                     {/* ❌ DELETED the Category <td> entirely! */}
//                     <td className="p-4 flex items-center justify-center gap-2">
//                       <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
//                         <Edit className="w-4 h-4" />
//                       </button>
                      
//                       {/* 🚀 ONLY show Delete button if the department is NOT 'Other' */}
//                       {dept.name.toLowerCase() !== 'other' && (
//                         <button 
//                           onClick={() => handleDeleteClick(dept._id, dept.name)}
//                           className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
//                           title="Delete"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* ADD DEPARTMENT MODAL */}
//       <AnimatePresence>
//         {isAddModalOpen && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
//             <motion.div 
//               initial={{ scale: 0.95, opacity: 0 }} 
//               animate={{ scale: 1, opacity: 1 }} 
//               exit={{ scale: 0.95, opacity: 0 }}
//               className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
//             >
//               <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-white">
//                 <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
//                   <Plus className="w-5 h-5 text-orange-600" />
//                   Add New Department
//                 </h3>
//                 <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>

//               <form onSubmit={handleAddDepartment} className="p-5 space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
//                   <input 
//                     type="text" 
//                     required 
//                     value={newDept.name}
//                     onChange={(e) => setNewDept({...newDept, name: e.target.value})}
//                     placeholder="e.g., Water Supply, IT Support"
//                     className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
//                   <textarea 
//                     value={newDept.description}
//                     onChange={(e) => setNewDept({...newDept, description: e.target.value})}
//                     placeholder="Briefly describe what this department handles..."
//                     rows="3"
//                     className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
//                   ></textarea>
//                 </div>

//                 <div className="pt-2 flex gap-3">
//                   <button 
//                     type="button" 
//                     onClick={() => setIsAddModalOpen(false)}
//                     className="flex-1 py-2 text-sm border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                   <button 
//                     type="submit" 
//                     disabled={isSubmitting}
//                     className="flex-1 py-2 text-sm bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium rounded-lg hover:shadow-lg transition-all hover:scale-[1.02] disabled:opacity-70 flex justify-center items-center gap-2"
//                   >
//                     {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Department'}
//                   </button>
//                 </div>
//               </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default DepartmentManager;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, Plus, Search, Trash2, Edit, AlertCircle, 
  CheckCircle, X, Loader2, AlertTriangle 
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const DepartmentManager = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', description: '' }); // No category!

  // 🚀 NEW: Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState({ id: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('adminAccessToken');
      
      const response = await fetch(`${BASE_URL}/api/admin/departments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      
      if (response.ok && result.success) {
        setDepartments(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch departments');
      }
    } catch (err) {
      console.error(err);
      setError('Could not load departments. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Handle Add Department
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('adminAccessToken');
      const response = await fetch(`${BASE_URL}/api/admin/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newDept)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSuccess('Department added successfully!');
        setNewDept({ name: '', description: '' });
        setIsAddModalOpen(false);
        fetchDepartments();
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(result.message || 'Failed to add department');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🚀 NEW: Open Delete Modal
  const handleDeleteClick = (deptId, deptName) => {
    setDeptToDelete({ id: deptId, name: deptName });
    setIsDeleteModalOpen(true);
  };

  // 🚀 NEW: Execute Delete
  const confirmDelete = async () => {
    setIsDeleting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('adminAccessToken');
      const response = await fetch(`${BASE_URL}/api/admin/departments/${deptToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Show the detailed success message containing reassign counts!
        setSuccess(result.message); 
        setIsDeleteModalOpen(false);
        fetchDepartments();
        
        setTimeout(() => setSuccess(''), 5000);
      } else {
        throw new Error(result.message || 'Failed to delete department');
      }
    } catch (err) {
      setError(err.message);
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header Area */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Building className="w-6 h-6 text-orange-500" />
            Department Management
          </h2>
          <p className="text-gray-600 text-sm mt-1">Create and manage operational departments for your organization.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all hover:scale-105 font-medium"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {/* Success/Error Alerts */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-2 text-sm font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" /> {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Departments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
            Loading departments...
          </div>
        ) : departments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-700">No departments found</p>
            <p className="text-sm mt-1 mb-4">You haven't added any departments to your workspace yet.</p>
            <button onClick={() => setIsAddModalOpen(true)} className="text-orange-600 font-medium hover:underline">
              Create your first department
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="p-4 font-semibold">Department Name</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {departments.map((dept) => (
                  <tr key={dept._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 flex items-center">
                        {dept.name}
                        {dept.name.toLowerCase() === 'other' && (
                           <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] uppercase rounded font-bold border border-gray-200">
                             Default Bucket
                           </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-xl mt-1">
                        {dept.description || 'No description provided.'}
                      </div>
                    </td>
                    <td className="p-4 flex items-center justify-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {/* Hide delete button for the default 'Other' department */}
                      {dept.name.toLowerCase() !== 'other' ? (
                        <button 
                          onClick={() => handleDeleteClick(dept._id, dept.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="w-8 h-8"></div> /* Empty spacer to keep alignment */
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD DEPARTMENT MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-white">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-orange-600" />
                  Add New Department
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDepartment} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={newDept.name}
                    onChange={(e) => setNewDept({...newDept, name: e.target.value})}
                    placeholder="e.g., Water Supply, IT Support"
                    className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea 
                    value={newDept.description}
                    onChange={(e) => setNewDept({...newDept, description: e.target.value})}
                    placeholder="Briefly describe what this department handles..."
                    rows="3"
                    className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                  ></textarea>
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2 text-sm border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 py-2 text-sm bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium rounded-lg hover:shadow-lg transition-all hover:scale-[1.02] disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Department'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 NEW: DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Department?</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Are you sure you want to delete <span className="font-bold text-gray-900">"{deptToDelete.name}"</span>? 
                  <br /><br />
                  Any staff members or tickets currently assigned to this department will be automatically moved to the <span className="font-bold">"Other"</span> bucket to prevent data loss.
                </p>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete It'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DepartmentManager;