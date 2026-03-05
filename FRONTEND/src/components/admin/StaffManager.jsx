// // pages/admin/AdminStaffPage.jsx
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import * as adminService from '../../services/adminService';
// import {
//   Users, Search, Filter, RefreshCw, UserPlus, Edit, Trash2, Eye,
//   CheckCircle, Clock, AlertCircle, TrendingUp, MoreVertical, X,
//   Mail, Phone, Building, Award, Star, Target, Download,
//   ChevronDown, ChevronUp, MessageSquare, Shield, BarChart2, Check, UserMinus
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// const StaffManager = () => {
//   const navigate = useNavigate();
  
//   // Tab State
//   const [activeTab, setActiveTab] = useState('active'); 
//   const [pendingStaff, setPendingStaff] = useState([]);
  
//   const [staff, setStaff] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedFilters, setSelectedFilters] = useState({
//     department: 'all',
//     status: 'all'
//   });
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [selectedStaff, setSelectedStaff] = useState(null);
//   const [formData, setFormData] = useState({
//     name: '', email: '', phone: '', staffId: '', department: '', password: '', isActive: true
//   });
//   const [departments, setDepartments] = useState([]);
//   const [submitting, setSubmitting] = useState(false);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

//   useEffect(() => {
//     fetchAllData();
//   }, []);

//   const fetchAllData = async () => {
//     try {
//       setLoading(true);
//       await Promise.all([
//         fetchStaffData(),
//         fetchPendingStaff(), 
//         fetchStaffStats(),
//         fetchDepartments()
//       ]);
//     } catch (error) {
//       console.error('Error fetching data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchStaffData = async () => {
//     try {
//       const response = await adminService.getStaff();
//       if (response.success) setStaff(response.data.staff || []);
//     } catch (error) { console.error('Error fetching staff:', error); }
//   };

//   const fetchPendingStaff = async () => {
//     try {
//       const response = await adminService.getPendingStaff();
//       if (response.success) setPendingStaff(response.data || []);
//     } catch (error) { console.error('Error fetching pending staff:', error); }
//   };

//   const fetchStaffStats = async () => {
//     try {
//       const response = await adminService.getStaffStats();
//       if (response.success) setStats(response.data);
//     } catch (error) { console.error('Error fetching staff stats:', error); }
//   };

//   const fetchDepartments = async () => {
//     try {
//       const response = await adminService.getDepartments();
//       if (response.success) setDepartments(response.data || []);
//     } catch (error) { console.error('Error fetching departments:', error); }
//   };

//   const handleApprove = async (staffId) => {
//     try {
//       const response = await adminService.approveStaff(staffId);
//       if (response.success) {
//         alert('Staff member approved successfully!');
//         fetchAllData(); 
//       }
//     } catch (error) {
//       alert('Failed to approve staff member');
//     }
//   };

//   const handleReject = async (staffId) => {
//     if (!window.confirm("Are you sure you want to reject and delete this request?")) return;
//     try {
//       const response = await adminService.rejectStaff(staffId);
//       if (response.success) {
//         fetchAllData(); 
//       }
//     } catch (error) {
//       alert('Failed to reject staff member');
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
//   };

//   const handleAddStaff = async () => {
//     if (!formData.name || !formData.email || !formData.staffId || !formData.password) {
//       alert('Please fill all required fields');
//       return;
//     }
//     try {
//       setSubmitting(true);
//       const response = await adminService.createStaff(formData);
//       if (response.success) {
//         alert('Staff member added successfully!');
//         setShowAddModal(false); resetForm(); fetchAllData();
//       }
//     } catch (error) {
//       alert(error.response?.data?.message || 'Failed to add staff member');
//     } finally { setSubmitting(false); }
//   };

//   const handleUpdateStaff = async () => {
//     if (!selectedStaff) return;
//     try {
//       setSubmitting(true);
//       const response = await adminService.updateStaff(selectedStaff._id, formData);
//       if (response.success) {
//         alert('Staff member updated successfully!');
//         setShowEditModal(false); setSelectedStaff(null); resetForm(); fetchAllData();
//       }
//     } catch (error) {
//       alert(error.response?.data?.message || 'Failed to update staff member');
//     } finally { setSubmitting(false); }
//   };

//   const handleDeleteStaff = async (staffId) => {
//     try {
//       const response = await adminService.deleteStaff(staffId);
//       if (response.success) {
//         alert('Staff member deleted successfully!');
//         setShowDeleteConfirm(null); fetchAllData();
//       }
//     } catch (error) {
//       alert(error.response?.data?.message || 'Failed to delete staff member');
//     }
//   };

//   const handleToggleStatus = async (staffId, currentStatus) => {
//     try {
//       const action = currentStatus ? 'deactivate' : 'activate';
//       const response = action === 'activate' 
//         ? await adminService.bulkActivateStaff([staffId])
//         : await adminService.bulkDeactivateStaff([staffId]);
//       if (response.success) fetchStaffData();
//     } catch (error) { alert('Failed to update staff status'); }
//   };

//   const resetForm = () => {
//     setFormData({ name: '', email: '', phone: '', staffId: '', department: '', password: '', isActive: true });
//   };

//   const openEditModal = (staffMember) => {
//     setSelectedStaff(staffMember);
//     setFormData({
//       name: staffMember.name || '', email: staffMember.email || '', phone: staffMember.phone || '',
//       staffId: staffMember.staffId || '', department: staffMember.department?._id || staffMember.department || '',
//       isActive: staffMember.isActive !== undefined ? staffMember.isActive : true, password: ''
//     });
//     setShowEditModal(true);
//   };

//   const currentList = activeTab === 'active' ? staff : pendingStaff;
//   const filteredStaff = currentList.filter(staffMember => {
//     if (searchTerm) {
//       const searchLower = searchTerm.toLowerCase();
//       return (
//         staffMember.name?.toLowerCase().includes(searchLower) ||
//         staffMember.email?.toLowerCase().includes(searchLower) ||
//         staffMember.staffId?.toLowerCase().includes(searchLower) ||
//         staffMember.phone?.toLowerCase().includes(searchLower)
//       );
//     }
//     if (activeTab === 'active') { 
//         if (selectedFilters.department !== 'all') {
//         const deptName = staffMember.department?.name || staffMember.department;
//         if (deptName !== selectedFilters.department) return false;
//         }
//         if (selectedFilters.status !== 'all') {
//         const isActive = selectedFilters.status === 'active';
//         if (staffMember.isActive !== isActive) return false;
//         }
//     }
//     return true;
//   });

//   if (loading) {
//     return (
//       <div className="flex h-full items-center justify-center p-12">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading staff data...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full">
//       {/* Header */}
//       <div className="mb-6">
//         <div className="flex justify-between items-center mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
//             <p className="text-gray-600">Manage all staff members and their performance</p>
//           </div>
//           <div className="flex items-center gap-3">
//             <button onClick={fetchAllData} className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 bg-white">
//               <RefreshCw className="w-4 h-4" /> Refresh
//             </button>
//             <button onClick={() => { resetForm(); setShowAddModal(true); }} className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2">
//               <UserPlus className="w-4 h-4" /> Add Staff
//             </button>
//           </div>
//         </div>

//         {/* Tabs Toggle */}
//         <div className="flex bg-gray-200/50 p-1 rounded-xl w-fit mb-4">
//           <button 
//             onClick={() => setActiveTab('active')}
//             className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
//           >
//             Active Staff ({staff.length})
//           </button>
//           <button 
//             onClick={() => setActiveTab('pending')}
//             className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
//           >
//             Pending Requests
//             {pendingStaff.length > 0 && (
//               <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{pendingStaff.length}</span>
//             )}
//           </button>
//         </div>
//       </div>

//       {/* Stats - Only visible on Active Tab */}
//       {stats && activeTab === 'active' && (
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//           <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
//             <div className="flex items-center justify-between">
//               <div><p className="text-sm text-gray-500 mb-1">Total Staff</p><p className="text-3xl font-bold text-gray-900">{stats.total || 0}</p><p className="text-xs text-gray-500 mt-2">Across all departments</p></div>
//               <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Users className="w-6 h-6 text-blue-600" /></div>
//             </div>
//           </div>
//           <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
//             <div className="flex items-center justify-between">
//               <div><p className="text-sm text-gray-500 mb-1">Active</p><p className="text-3xl font-bold text-green-600">{stats.active || 0}</p><p className="text-xs text-gray-500 mt-2">{stats.inactive || 0} inactive</p></div>
//               <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div>
//             </div>
//           </div>
//           <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
//             <div className="flex items-center justify-between">
//               <div><p className="text-sm text-gray-500 mb-1">Avg Resolution</p><p className="text-3xl font-bold text-purple-600">{stats.performance?.avgResolutionRate?.toFixed(1) || 0}%</p><p className="text-xs text-gray-500 mt-2">Staff performance</p></div>
//               <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><Target className="w-6 h-6 text-purple-600" /></div>
//             </div>
//           </div>
//           <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
//             <div className="flex items-center justify-between">
//               <div><p className="text-sm text-gray-500 mb-1">Departments</p><p className="text-3xl font-bold text-orange-600">{stats.departments?.length || departments.length || 0}</p><p className="text-xs text-gray-500 mt-2">Staff distribution</p></div>
//               <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"><Building className="w-6 h-6 text-orange-600" /></div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Search and Filters */}
//       <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1">
//             <div className="relative">
//               <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input type="text" placeholder={`Search ${activeTab} staff by name, email, or ID...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
//             </div>
//           </div>
          
//           {activeTab === 'active' && (
//             <div className="flex items-center gap-3">
//               <select value={selectedFilters.department} onChange={(e) => setSelectedFilters(prev => ({ ...prev, department: e.target.value }))} className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
//                 <option value="all">All Departments</option>
//                 {departments.map(dept => (<option key={dept._id} value={dept.name}>{dept.name}</option>))}
//               </select>
//               <select value={selectedFilters.status} onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))} className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
//                 <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
//               </select>
//             </div>
//           )}
          
//           <button onClick={() => { setSearchTerm(''); setSelectedFilters({ department: 'all', status: 'all' }); }} className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
//             Clear
//           </button>
//         </div>
        
//         <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
//           <span>Showing {filteredStaff.length} of {currentList.length} staff members</span>
//           {activeTab === 'active' && (
//             <span className="flex items-center gap-1"><Award className="w-4 h-4 text-amber-500" /> Top performers marked</span>
//           )}
//         </div>
//       </div>

//       {/* Staff Table */}
//       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff Member</th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                
//                 {activeTab === 'active' ? (
//                   <>
//                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Performance</th>
//                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
//                   </>
//                 ) : (
//                   <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Requested On</th>
//                 )}
                
//                 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200 bg-white">
//               {filteredStaff.map((staffMember) => (
//                 <motion.tr key={staffMember._id} className="hover:bg-gray-50 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//                   <td className="px-6 py-4">
//                     <div className="flex items-center gap-3">
//                       <div className="relative">
//                         <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
//                           {staffMember.name?.charAt(0) || 'S'}
//                         </div>
//                         {staffMember.stats?.resolutionRate > 80 && activeTab === 'active' && (
//                           <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center"><Star className="w-2 h-2 text-white" /></div>
//                         )}
//                       </div>
//                       <div>
//                         <div className="flex items-center gap-2">
//                           <p className="font-semibold text-gray-900">{staffMember.name}</p>
//                           {staffMember.stats?.resolutionRate > 80 && activeTab === 'active' && (
//                             <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">Top Performer</span>
//                           )}
//                         </div>
//                         <p className="text-sm text-gray-500">{staffMember.staffId}</p>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="flex items-center gap-2">
//                       <Building className="w-4 h-4 text-gray-400" />
//                       <span className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium">
//                         {staffMember.department?.name || staffMember.department || 'N/A'}
//                       </span>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="space-y-1">
//                       <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span className="text-gray-600">{staffMember.email}</span></div>
//                       <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span className="text-gray-600">{staffMember.phone || 'N/A'}</span></div>
//                     </div>
//                   </td>

//                   {activeTab === 'active' ? (
//                     <>
//                       <td className="px-6 py-4">
//                         <div className="space-y-2">
//                           <div className="flex items-center gap-2">
//                             <div className="flex-1">
//                               <div className="flex justify-between mb-1">
//                                 <span className="text-xs text-gray-500">Resolution Rate</span>
//                                 <span className="text-xs font-bold text-emerald-600">{staffMember.stats?.resolutionRate || 0}%</span>
//                               </div>
//                               <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
//                                 <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: `${staffMember.stats?.resolutionRate || 0}%` }}></div>
//                               </div>
//                             </div>
//                           </div>
//                           <div className="flex items-center gap-3 text-xs">
//                             <span className="text-gray-500"><span className="font-medium text-gray-700">{staffMember.stats?.totalAssigned || 0}</span> assigned</span><span className="text-gray-300">|</span>
//                             <span className="text-green-600 font-medium">{staffMember.stats?.resolved || 0} resolved</span>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <span className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-1 ${staffMember.isActive ? 'text-green-700 bg-green-100 border border-green-200' : 'text-red-700 bg-red-100 border border-red-200'}`}>
//                           <span className={`w-1.5 h-1.5 rounded-full ${staffMember.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
//                           {staffMember.isActive ? 'Active' : 'Inactive'}
//                         </span>
//                       </td>
//                     </>
//                   ) : (
//                     <td className="px-6 py-4 text-sm text-gray-600">
//                       {new Date(staffMember.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
//                     </td>
//                   )}

//                   {/* Actions Column */}
//                   <td className="px-6 py-4">
//                     {activeTab === 'pending' ? (
//                       <div className="flex items-center gap-2">
//                         <button onClick={() => handleApprove(staffMember._id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
//                           <Check className="w-4 h-4" /> <span className="text-xs font-semibold">Approve</span>
//                         </button>
//                         <button onClick={() => handleReject(staffMember._id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
//                           <UserMinus className="w-4 h-4" /> <span className="text-xs font-semibold">Reject</span>
//                         </button>
//                       </div>
//                     ) : (
//                       <div className="flex items-center gap-2">
//                         <button onClick={() => navigate(`/admin/staff/${staffMember._id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details"><Eye className="w-4 h-4" /></button>
//                         <button onClick={() => openEditModal(staffMember)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
//                         <button onClick={() => handleToggleStatus(staffMember._id, staffMember.isActive)} className={`p-2 rounded-lg transition-colors ${staffMember.isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`} title={staffMember.isActive ? 'Deactivate' : 'Activate'}>
//                           {staffMember.isActive ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
//                         </button>
//                         <div className="relative">
//                           <button onClick={() => setShowDeleteConfirm(showDeleteConfirm === staffMember._id ? null : staffMember._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
//                           <AnimatePresence>
//                             {showDeleteConfirm === staffMember._id && (
//                               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 p-3">
//                                 <p className="text-sm text-gray-700 mb-3">Delete this staff member?</p>
//                                 <div className="flex gap-2">
//                                   <button onClick={() => handleDeleteStaff(staffMember._id)} className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">Delete</button>
//                                   <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200">Cancel</button>
//                                 </div>
//                               </motion.div>
//                             )}
//                           </AnimatePresence>
//                         </div>
//                       </div>
//                     )}
//                   </td>
//                 </motion.tr>
//               ))}
              
//               {filteredStaff.length === 0 && (
//                 <tr>
//                   <td colSpan="7" className="px-6 py-12 text-center">
//                     <div className="flex flex-col items-center">
//                       <Users className="w-12 h-12 text-gray-400 mb-4" />
//                       <p className="text-gray-600 font-medium mb-1">No {activeTab} staff members found</p>
//                       <p className="text-sm text-gray-500 mb-4">Try adjusting your search or filters</p>
//                       <button onClick={() => { setSearchTerm(''); setSelectedFilters({ department: 'all', status: 'all' }); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Clear Filters</button>
//                     </div>
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* --- MODALS (100% untouched) --- */}
//       <AnimatePresence>
//         {showAddModal && (
//           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//               <div className="p-6 border-b border-gray-200"><div className="flex items-center justify-between"><div><h3 className="text-xl font-bold text-gray-900">Add New Staff Member</h3><p className="text-sm text-gray-600 mt-1">Fill in the details to create a new staff account</p></div><button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button></div></div>
//               <div className="p-6">
//                 <div className="space-y-4">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div><label className="block text-sm font-medium text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter full name" /></div>
//                     <div><label className="block text-sm font-medium text-gray-700 mb-2">Staff ID <span className="text-red-500">*</span></label><input type="text" name="staffId" value={formData.staffId} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g., EMP001" /></div>
//                   </div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div><label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="staff@example.com" /></div>
//                     <div><label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="10-digit mobile number" /></div>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
//                     <select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
//                       <option value="">Select Department</option>
//                       {departments.map(dept => (<option key={dept._id} value={dept._id}>{dept.name}</option>))}
//                     </select>
//                   </div>
//                   <div><label className="block text-sm font-medium text-gray-700 mb-2">Password <span className="text-red-500">*</span></label><input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter password" /><p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p></div>
//                   <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200"><input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><label htmlFor="isActive" className="text-sm font-medium text-blue-700">Activate account immediately</label></div>
//                 </div>
//                 <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
//                   <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
//                   <button onClick={handleAddStaff} disabled={submitting} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
//                     {submitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Adding...</>) : ('Add Staff Member')}
//                   </button>
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {showEditModal && selectedStaff && (
//           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-2xl">
//               <div className="p-6 border-b border-gray-200"><div className="flex items-center justify-between"><div><h3 className="text-xl font-bold text-gray-900">Edit Staff Member</h3><p className="text-sm text-gray-600 mt-1">Update staff information</p></div><button onClick={() => { setShowEditModal(false); setSelectedStaff(null); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button></div></div>
//               <div className="p-6">
//                 <div className="space-y-4">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div><label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
//                     <div><label className="block text-sm font-medium text-gray-700 mb-2">Staff ID</label><input type="text" name="staffId" value={formData.staffId} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" disabled /></div>
//                   </div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div><label className="block text-sm font-medium text-gray-700 mb-2">Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
//                     <div><label className="block text-sm font-medium text-gray-700 mb-2">Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
//                     <select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
//                       <option value="">Select Department</option>
//                       {departments.map(dept => (<option key={dept._id} value={dept._id}>{dept.name}</option>))}
//                     </select>
//                   </div>
//                   <div><label className="block text-sm font-medium text-gray-700 mb-2">New Password <span className="text-gray-500 font-normal">(Leave blank to keep current)</span></label><input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter new password" /></div>
//                   <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg"><input type="checkbox" id="editIsActive" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-300 text-blue-600" /><label htmlFor="editIsActive" className="text-sm font-medium text-blue-700">Account Active</label></div>
//                 </div>
//                 <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
//                   <button onClick={() => { setShowEditModal(false); setSelectedStaff(null); resetForm(); }} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
//                   <button onClick={handleUpdateStaff} disabled={submitting} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2">
//                     {submitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Updating...</>) : ('Update Staff')}
//                   </button>
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default StaffManager;

// components/admin/StaffManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as adminService from '../../services/adminService';
import {
  Users, Search, Filter, RefreshCw, UserPlus, Edit, Trash2, Eye,
  CheckCircle, Clock, AlertCircle, Target, Building, Award, Star,
  X, Mail, Phone, Check, UserMinus, ShieldBan
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StaffManager = () => {
  const navigate = useNavigate();
  
  // 🚀 2-TAB STATE
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'pending'
  
  const [staff, setStaff] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({ department: 'all', status: 'all' });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', staffId: '', department: '', password: '', isActive: true
  });
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStaffData(),
        fetchPendingStaff(), 
        fetchStaffStats(),
        fetchDepartments()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffData = async () => {
    try {
      const response = await adminService.getStaff();
      if (response.success) {
        const allFetchedStaff = response.data.staff || response.data || [];
        
        // 🚀 THE FIX: Hide anyone who is unapproved from the main Active list.
        // (We use !== false so that if you have older staff members in your DB 
        // before we added this feature, they won't magically disappear!)
        const approvedStaffOnly = allFetchedStaff.filter(member => member.isApproved !== false);
        
        setStaff(approvedStaffOnly);
      }
    } catch (error) { 
      console.error('Error fetching staff:', error); 
    }
  };

  const fetchPendingStaff = async () => {
    try {
      const response = await adminService.getPendingStaff();
      if (response.success) setPendingStaff(response.data || []);
    } catch (error) { console.error('Error fetching pending staff:', error); }
  };

  const fetchStaffStats = async () => {
    try {
      const response = await adminService.getStaffStats();
      if (response.success) setStats(response.data);
    } catch (error) { console.error('Error fetching staff stats:', error); }
  };

  const fetchDepartments = async () => {
    try {
      const response = await adminService.getDepartments();
      if (response.success) setDepartments(response.data || []);
    } catch (error) { console.error('Error fetching departments:', error); }
  };

  const handleApprove = async (staffId) => {
    try {
      const response = await adminService.approveStaff(staffId);
      if (response.success) {
        fetchAllData(); 
      }
    } catch (error) {
      alert('Failed to approve staff member');
    }
  };

  const handleReject = async (staffId) => {
    if (!window.confirm("Are you sure you want to reject and delete this request?")) return;
    try {
      const response = await adminService.rejectStaff(staffId);
      if (response.success) {
        fetchAllData(); 
      }
    } catch (error) {
      alert('Failed to reject staff member');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // --- CRUD Functions ---
  const handleAddStaff = async () => {
    if (!formData.name || !formData.email || !formData.staffId || !formData.password) {
      alert('Please fill all required fields'); return;
    }
    try {
      setSubmitting(true);
      const response = await adminService.createStaff(formData);
      if (response.success) {
        setShowAddModal(false); resetForm(); fetchAllData();
      }
    } catch (error) { alert(error.response?.data?.message || 'Failed to add staff member'); } finally { setSubmitting(false); }
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;
    try {
      setSubmitting(true);
      const response = await adminService.updateStaff(selectedStaff._id, formData);
      if (response.success) {
        setShowEditModal(false); setSelectedStaff(null); resetForm(); fetchAllData();
      }
    } catch (error) { alert(error.response?.data?.message || 'Failed to update staff member'); } finally { setSubmitting(false); }
  };

  const handleDeleteStaff = async (staffId) => {
    try {
      const response = await adminService.deleteStaff(staffId);
      if (response.success) {
        setShowDeleteConfirm(null); fetchAllData();
      }
    } catch (error) { alert(error.response?.data?.message || 'Failed to delete staff member'); }
  };

  const handleToggleStatus = async (staffId, currentStatus) => {
    try {
      const action = currentStatus ? 'deactivate' : 'activate';
      const response = action === 'activate' ? await adminService.bulkActivateStaff([staffId]) : await adminService.bulkDeactivateStaff([staffId]);
      if (response.success) fetchStaffData();
    } catch (error) { alert('Failed to update staff status'); }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', staffId: '', department: '', password: '', isActive: true });
  };

  const openEditModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData({
      name: staffMember.name || '', email: staffMember.email || '', phone: staffMember.phone || '',
      staffId: staffMember.staffId || '', department: staffMember.department?._id || staffMember.department || '',
      isActive: staffMember.isActive !== undefined ? staffMember.isActive : true, password: ''
    });
    setShowEditModal(true);
  };

  // 🚀 FILTERING LOGIC
  const currentList = activeTab === 'active' ? staff : pendingStaff;
  
  const filteredStaff = currentList.filter(staffMember => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        staffMember.name?.toLowerCase().includes(searchLower) ||
        staffMember.email?.toLowerCase().includes(searchLower) ||
        staffMember.staffId?.toLowerCase().includes(searchLower)
      );
    }
    if (activeTab === 'active') { 
        if (selectedFilters.department !== 'all') {
          const deptName = staffMember.department?.name || staffMember.department;
          if (deptName !== selectedFilters.department) return false;
        }
        if (selectedFilters.status !== 'all') {
          const isActive = selectedFilters.status === 'active';
          if (staffMember.isActive !== isActive) return false;
        }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600">Manage all staff members and their performance</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchAllData} className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 bg-white">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 shadow-sm transition-all flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Add Staff
            </button>
          </div>
        </div>

        {/* 🚀 2 TABS TOGGLE */}
        <div className="flex bg-gray-200/50 p-1 rounded-xl w-fit mb-4">
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Active Staff ({staff.length})
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pending Requests
            {pendingStaff.length > 0 && (
              <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{pendingStaff.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Stats - Only visible on Active Tab */}
      {stats && activeTab === 'active' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500 mb-1">Total Staff</p><p className="text-3xl font-bold text-gray-900">{stats.total || 0}</p></div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Users className="w-6 h-6 text-blue-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500 mb-1">Active</p><p className="text-3xl font-bold text-green-600">{staff.filter(s => s.isActive).length}</p></div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500 mb-1">Avg Resolution</p><p className="text-3xl font-bold text-purple-600">{stats.performance?.avgResolutionRate?.toFixed(1) || 0}%</p></div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><Target className="w-6 h-6 text-purple-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500 mb-1">Departments</p><p className="text-3xl font-bold text-orange-600">{departments.length || 0}</p></div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"><Building className="w-6 h-6 text-orange-600" /></div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder={`Search ${activeTab} staff by name, email, or ID...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          
          {activeTab === 'active' && (
            <div className="flex items-center gap-3">
              <select value={selectedFilters.department} onChange={(e) => setSelectedFilters(prev => ({ ...prev, department: e.target.value }))} className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="all">All Departments</option>
                {departments.map(dept => (<option key={dept._id} value={dept.name}>{dept.name}</option>))}
              </select>
              <select value={selectedFilters.status} onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))} className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff Member</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact / Dept</th>
                
                {/* 🚀 Dynamic Table Headers */}
                {activeTab === 'active' ? (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Performance</th>
                ) : (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Requested On</th>
                )}
                
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredStaff.map((staffMember) => (
                <motion.tr key={staffMember._id} className="hover:bg-gray-50 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  
                  {/* Name & ID */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {staffMember.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{staffMember.name}</p>
                        <p className="text-sm text-gray-500">{staffMember.staffId}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact & Dept */}
                  <td className="px-6 py-4 space-y-1">
                    <div className="text-sm text-gray-600 flex items-center gap-1"><Mail className="w-3 h-3"/> {staffMember.email}</div>
                    <div className="text-xs font-bold text-gray-500 flex items-center gap-1"><Building className="w-3 h-3"/> {staffMember.department?.name || 'N/A'}</div>
                  </td>

                  {/* Performance OR Date */}
                  {activeTab === 'active' ? (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-600">{staffMember.stats?.resolutionRate || 0}%</span>
                      </div>
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: `${staffMember.stats?.resolutionRate || 0}%` }}></div>
                      </div>
                    </td>
                  ) : (
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(staffMember.createdAt).toLocaleDateString()}
                    </td>
                  )}

                  {/* 🚀 Dynamic Status Badge */}
                  <td className="px-6 py-4">
                    {activeTab === 'pending' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                        Pending Approval
                      </span>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${staffMember.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {staffMember.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4">
                    {activeTab === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleApprove(staffMember._id)} className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors" title="Approve"><Check className="w-4 h-4" /></button>
                        <button onClick={() => handleReject(staffMember._id)} className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors" title="Reject (Delete)"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/admin/staff/${staffMember._id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEditModal(staffMember)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleToggleStatus(staffMember._id, staffMember.isActive)} className={`p-2 rounded-lg transition-colors ${staffMember.isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`} title={staffMember.isActive ? 'Deactivate' : 'Activate'}>
                          {staffMember.isActive ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <div className="relative">
                          <button onClick={() => setShowDeleteConfirm(showDeleteConfirm === staffMember._id ? null : staffMember._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                          <AnimatePresence>
                            {showDeleteConfirm === staffMember._id && (
                              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 p-3">
                                <p className="text-sm text-gray-700 mb-3">Delete this staff member?</p>
                                <div className="flex gap-2">
                                  <button onClick={() => handleDeleteStaff(staffMember._id)} className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">Delete</button>
                                  <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200">Cancel</button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
              
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {activeTab === 'pending' ? <ShieldBan className="w-12 h-12 mx-auto mb-3 text-orange-300" /> : <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />}
                    <p className="font-medium text-gray-600">No {activeTab} staff members found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS (Kept exactly as you had them) */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200"><div className="flex items-center justify-between"><div><h3 className="text-xl font-bold text-gray-900">Add New Staff Member</h3></div><button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div></div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-2">Full Name *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-medium mb-2">Staff ID *</label><input type="text" name="staffId" value={formData.staffId} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-2">Email *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-medium mb-2">Phone Number</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Department</label>
                    <select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg">
                      <option value="">Select Department</option>
                      {departments.map(dept => (<option key={dept._id} value={dept._id}>{dept.name}</option>))}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium mb-2">Password *</label><input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" /></div>
                </div>
                <div className="flex gap-3 mt-6"><button onClick={() => setShowAddModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button><button onClick={handleAddStaff} className="flex-1 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-medium shadow-sm">Add Staff</button></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && selectedStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200"><div className="flex items-center justify-between"><div><h3 className="text-xl font-bold text-gray-900">Edit Staff Member</h3></div><button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div></div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-2">Full Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-medium mb-2">Staff ID</label><input type="text" name="staffId" value={formData.staffId} className="w-full px-4 py-2 border rounded-lg bg-gray-100" disabled /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-2">Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-medium mb-2">Phone</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Department</label>
                    <select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg">
                      <option value="">Select Department</option>
                      {departments.map(dept => (<option key={dept._id} value={dept._id}>{dept.name}</option>))}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium mb-2">New Password (Optional)</label><input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" /></div>
                  <div className="flex items-center gap-2"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} /> <label className="text-sm">Account Active</label></div>
                </div>
                <div className="flex gap-3 mt-6"><button onClick={() => setShowEditModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button><button onClick={handleUpdateStaff} className="flex-1 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-medium shadow-sm">Update Staff</button></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffManager;