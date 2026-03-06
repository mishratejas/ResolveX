// // components/admin/ComplaintManager.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { 
//   Search, RefreshCw, AlertCircle, Clock, CheckCircle, 
//   User, MapPin, Building, MessageSquare, Eye, Calendar,
//   MoreVertical, ShieldAlert
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// const BASE_URL = import.meta.env.VITE_API_URL || "https://webster-2025.onrender.com";

// const ComplaintManager = () => {
//   const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'assigned', 'resolved'
//   const [complaints, setComplaints] = useState([]);
//   const [staffList, setStaffList] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("adminToken");
//       const headers = { Authorization: `Bearer ${token}` };

//       const [complaintsRes, staffRes] = await Promise.all([
//         axios.get(`${BASE_URL}/api/admin/issues`, { headers }),
//         axios.get(`${BASE_URL}/api/admin/staff`, { headers })
//       ]);

//       if (complaintsRes.data.success) {
//         setComplaints(complaintsRes.data.data || []);
//       }
//       if (staffRes.data.success) {
//         setStaffList(staffRes.data.data?.staff || staffRes.data.data || []);
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- ACTIONS ---
//   const handleAssignStaff = async (complaintId, staffId) => {
//     try {
//       const token = localStorage.getItem("adminToken");
//       // If staffId is empty, we are unassigning them
//       const payload = staffId ? { assignedTo: staffId, status: 'in-progress' } : { assignedTo: null, status: 'pending' };
      
//       await axios.put(`${BASE_URL}/api/admin/issues/${complaintId}`, payload, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       fetchData(); // Refresh to move it to the correct tab
//     } catch (error) {
//       alert("Failed to update assignment");
//     }
//   };

//   const handleMarkResolved = async (complaintId) => {
//     if (!window.confirm("Are you sure you want to manually mark this as resolved?")) return;
//     try {
//       const token = localStorage.getItem("adminToken");
//       await axios.put(`${BASE_URL}/api/admin/issues/${complaintId}`, { status: 'resolved' }, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       fetchData();
//     } catch (error) {
//       alert("Failed to mark as resolved");
//     }
//   };

//  // --- FILTERING ---
//   const filteredComplaints = complaints.filter(c => {
//     // 1. Tab Logic
//     const isResolved = c.status === 'resolved' || c.status === 'closed';
//     const isAssigned = c.assignedTo && !isResolved;
//     const isPending = !c.assignedTo && !isResolved;

//     if (activeTab === 'pending' && !isPending) return false;
//     if (activeTab === 'assigned' && !isAssigned) return false;
//     if (activeTab === 'resolved' && !isResolved) return false;

//     // 2. Search Logic (🚀 BULLETPROOFED)
//     if (searchTerm) {
//       const search = searchTerm.toLowerCase();
//       const deptName = typeof c.department === 'object' ? c.department?.name : c.department;
      
//       return (
//         (c.title || '').toLowerCase().includes(search) || 
//         (c.ticketId || '').toLowerCase().includes(search) ||
//         (c.user?.name || '').toLowerCase().includes(search) ||
//         (deptName || '').toLowerCase().includes(search)
//       );
//     }
//     return true;
//   });

//   const getDepartmentName = (dept) => typeof dept === 'object' ? dept?.name : (dept || 'General');

//   const formatDate = (dateString) => {
//     if (!dateString) return 'Unknown Date';
//     return new Date(dateString).toLocaleDateString('en-US', { 
//       month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
//     });
//   };

//   if (loading) {
//     return (
//       <div className="flex h-full items-center justify-center p-12">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full">
//       {/* Header */}
//       <div className="mb-6">
//         <div className="flex justify-between items-center mb-6">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Complaints Hub</h1>
//             <p className="text-gray-600">Route tickets, manage staff assignments, and track resolutions.</p>
//           </div>
//           <button onClick={fetchData} className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 bg-white">
//             <RefreshCw className="w-4 h-4" /> Refresh
//           </button>
//         </div>

//         {/* 3 TABS */}
//         <div className="flex bg-gray-200/50 p-1 rounded-xl w-fit mb-6">
//           <button 
//             onClick={() => setActiveTab('pending')}
//             className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
//           >
//             Pending (Unassigned)
//             <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">{complaints.filter(c => !c.assignedTo && c.status !== 'resolved' && c.status !== 'closed').length}</span>
//           </button>
//           <button 
//             onClick={() => setActiveTab('assigned')}
//             className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'assigned' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
//           >
//             Assigned (Active)
//             <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{complaints.filter(c => c.assignedTo && c.status !== 'resolved' && c.status !== 'closed').length}</span>
//           </button>
//           <button 
//             onClick={() => setActiveTab('resolved')}
//             className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'resolved' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
//           >
//             Resolved Log
//           </button>
//         </div>

//         {/* Search Bar */}
//         <div className="relative max-w-md">
//           <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//           <input 
//             type="text" 
//             placeholder={`Search ${activeTab} complaints...`} 
//             value={searchTerm} 
//             onChange={(e) => setSearchTerm(e.target.value)} 
//             className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
//           />
//         </div>
//       </div>

//       {/* Complaints List */}
//       <div className="space-y-4">
//         <AnimatePresence>
//           {filteredComplaints.length === 0 ? (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white rounded-2xl border border-gray-200">
//               <ShieldAlert className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//               <h3 className="text-lg font-bold text-gray-700">No {activeTab} complaints found</h3>
//               <p className="text-gray-500">You are all caught up in this section!</p>
//             </motion.div>
//           ) : (
//             filteredComplaints.map(complaint => {
//               const deptName = getDepartmentName(complaint.department);
//               // Filter staff so the dropdown only shows staff from THIS complaint's department
//               const eligibleStaff = staffList.filter(s => getDepartmentName(s.department) === deptName);

//               return (
//                 <motion.div 
//                   key={complaint._id || Math.random()}
//                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
//                   className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
//                 >
//                   <div className="flex flex-col lg:flex-row justify-between gap-6">
                    
//                     {/* Left: Complaint Info */}
//                     <div className="flex-1">
//                       <div className="flex items-center gap-3 mb-2">
//                         {/* 🚀 BUG FIX: Safely slice the ID only if it exists */}
//                         <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
//                           #{complaint.ticketId || (complaint._id ? complaint._id.toString().slice(-6).toUpperCase() : 'UNKNOWN')}
//                         </span>
//                         <h3 className="font-bold text-lg text-gray-900">{complaint.title || 'Untitled Issue'}</h3>
//                         {complaint.priority === 'high' && <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full animate-pulse">Urgent</span>}
//                       </div>
                      
//                       <p className="text-gray-600 text-sm mb-4 line-clamp-2">{complaint.description || 'No description provided.'}</p>
                      
//                       <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500">
//                         <span className="flex items-center gap-1"><User className="w-3.5 h-3.5"/> {complaint.user?.name || 'Citizen'}</span>
//                         <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5"/> {deptName || 'General'}</span>
//                         <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {formatDate(complaint.createdAt || new Date())}</span>
//                         {complaint.location?.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {complaint.location.address}</span>}
//                       </div>
//                     </div>

//                     {/* Right: Actions based on Tab */}
//                     <div className="flex flex-col items-end justify-center gap-3 min-w-[250px] border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                      
//                       {activeTab === 'pending' && (
//                         <>
//                           <div className="w-full">
//                             <label className="block text-xs font-bold text-gray-500 mb-1">Assign to Staff ({deptName}):</label>
//                             <select 
//                               onChange={(e) => handleAssignStaff(complaint._id, e.target.value)}
//                               className="w-full text-sm border-gray-300 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 focus:ring-orange-500 p-2"
//                               defaultValue=""
//                             >
//                               <option value="" disabled>Select Staff Member...</option>
//                               {eligibleStaff.map(staff => (
//                                 <option key={staff._id} value={staff._id}>{staff.name}</option>
//                               ))}
//                               {eligibleStaff.length === 0 && <option disabled>No staff in this department!</option>}
//                             </select>
//                           </div>
//                           <button onClick={() => handleMarkResolved(complaint._id)} className="w-full py-2 text-sm font-bold text-green-700 bg-green-50 rounded-lg hover:bg-green-100 border border-green-200 transition-colors">
//                             Close Automatically
//                           </button>
//                         </>
//                       )}

//                       {activeTab === 'assigned' && (
//                         <>
//                           <div className="w-full">
//                             <label className="block text-xs font-bold text-gray-500 mb-1">Currently Assigned To:</label>
//                             <select 
//                               value={complaint.assignedTo?._id || ''}
//                               onChange={(e) => handleAssignStaff(complaint._id, e.target.value)}
//                               className="w-full text-sm border-gray-300 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 focus:ring-blue-500 p-2 font-medium"
//                             >
//                               <option value="">-- Unassign Ticket --</option>
//                               {eligibleStaff.map(staff => (
//                                 <option key={staff._id} value={staff._id}>{staff.name}</option>
//                               ))}
//                             </select>
//                           </div>
//                           <button onClick={() => handleMarkResolved(complaint._id)} className="w-full py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
//                             <CheckCircle className="w-4 h-4" /> Mark Resolved
//                           </button>
//                         </>
//                       )}

//                       {activeTab === 'resolved' && (
//                         <div className="w-full text-right">
//                           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold mb-2">
//                             <CheckCircle className="w-3.5 h-3.5" /> Resolved
//                           </span>
//                           <p className="text-xs text-gray-500 mt-1">
//                             Resolved By: <span className="font-bold text-gray-700">{complaint.assignedTo?.name || 'Admin'}</span>
//                           </p>
//                           <p className="text-xs text-gray-400">
//                             On: {formatDate(complaint.updatedAt || complaint.createdAt)}
//                           </p>
//                         </div>
//                       )}

//                     </div>
//                   </div>
//                 </motion.div>
//               );
//             })
//           )}
//         </AnimatePresence>
//       </div>
//     </div>
//   );
// };

// export default ComplaintManager;


// components/admin/ComplaintManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, Eye, Search, RefreshCw, CheckCircle, 
  User, MapPin, Building, Calendar, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_URL = import.meta.env.VITE_API_URL || "https://webster-2025.onrender.com";

const ComplaintManager = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'assigned', 'resolved'
  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };

      const [complaintsRes, staffRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/admin/issues`, { headers }),
        axios.get(`${BASE_URL}/api/admin/staff`, { headers })
      ]);

      if (complaintsRes.data.success) {
        setComplaints(complaintsRes.data.data || []);
      }
      if (staffRes.data.success) {
        setStaffList(staffRes.data.data?.staff || staffRes.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleAssignStaff = async (complaintId, staffId) => {
    try {
      const token = localStorage.getItem("adminToken");
      // If staffId is empty, we are unassigning them
      const payload = staffId ? { assignedTo: staffId, status: 'in-progress' } : { assignedTo: null, status: 'pending' };
      
      await axios.put(`${BASE_URL}/api/admin/issues/${complaintId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchData(); // Refresh to move it to the correct tab
    } catch (error) {
      alert("Failed to update assignment");
    }
  };

  const handleMarkResolved = async (complaintId) => {
    if (!window.confirm("Are you sure you want to manually mark this as resolved?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(`${BASE_URL}/api/admin/issues/${complaintId}`, { status: 'resolved' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert("Failed to mark as resolved");
    }
  };

  const getDepartmentName = (dept) => typeof dept === 'object' ? dept?.name : (dept || 'General');

  // --- SMART FILTERING & COUNTS ---
  let pendingCount = 0;
  let assignedCount = 0;
  let resolvedCount = 0;

  const processedComplaints = complaints.map(c => {
    const isResolved = c.status === 'resolved' || c.status === 'closed';
    
    // 🚀 THE FIX: Deep Validation. Is this staff member still valid for this ticket?
    let hasValidAssignment = false;
    if (c.assignedTo) {
      const staffId = typeof c.assignedTo === 'object' ? c.assignedTo._id : c.assignedTo;
      const matchingStaff = staffList.find(s => s._id === staffId);
      
      if (matchingStaff) {
        const staffDept = getDepartmentName(matchingStaff.department);
        const compDept = getDepartmentName(c.department);
        // They are valid only if they exist AND their department matches the ticket's department
        if (staffDept === compDept) {
          hasValidAssignment = true;
        }
      }
    }

    const computedState = {
      ...c,
      isResolved,
      isAssigned: hasValidAssignment && !isResolved,
      isPending: !hasValidAssignment && !isResolved
    };

    // Tally up the accurate counts for the tab badges
    if (computedState.isResolved) resolvedCount++;
    else if (computedState.isAssigned) assignedCount++;
    else pendingCount++;

    return computedState;
  });

  const filteredComplaints = processedComplaints.filter(c => {
    // Tab Logic
    if (activeTab === 'pending' && !c.isPending) return false;
    if (activeTab === 'assigned' && !c.isAssigned) return false;
    if (activeTab === 'resolved' && !c.isResolved) return false;

    // Search Logic
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const deptName = getDepartmentName(c.department);
      return (
        (c.title || '').toLowerCase().includes(search) || 
        (c.ticketId || '').toLowerCase().includes(search) ||
        (c.user?.name || '').toLowerCase().includes(search) ||
        (deptName || '').toLowerCase().includes(search)
      );
    }
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Complaints Hub</h1>
            <p className="text-gray-600">Route tickets, manage staff assignments, and track resolutions.</p>
          </div>
          <button onClick={fetchData} className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 bg-white">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* 3 TABS */}
        <div className="flex bg-gray-200/50 p-1 rounded-xl w-fit mb-6">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pending (Unassigned)
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">{pendingCount}</span>
          </button>
          <button 
            onClick={() => setActiveTab('assigned')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'assigned' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Assigned (Active)
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{assignedCount}</span>
          </button>
          <button 
            onClick={() => setActiveTab('resolved')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'resolved' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Resolved Log
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab} complaints...`} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
          />
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredComplaints.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <ShieldAlert className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700">No {activeTab} complaints found</h3>
              <p className="text-gray-500">You are all caught up in this section!</p>
            </motion.div>
          ) : (
            filteredComplaints.map(complaint => {
              const deptName = getDepartmentName(complaint.department);
              // Filter staff so the dropdown only shows staff from THIS complaint's department
              const eligibleStaff = staffList.filter(s => getDepartmentName(s.department) === deptName);

              return (
                <motion.div 
                  key={complaint._id || Math.random()}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    
                    {/* Left: Complaint Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                          #{complaint.ticketId || (complaint._id ? complaint._id.toString().slice(-6).toUpperCase() : 'UNKNOWN')}
                        </span>
                        <h3 className="font-bold text-lg text-gray-900">{complaint.title || 'Untitled Issue'}</h3>
                        {complaint.priority === 'high' && <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full animate-pulse">Urgent</span>}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{complaint.description || 'No description provided.'}</p>
                      
                      <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5"/> {complaint.user?.name || 'Citizen'}</span>
                        <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5"/> {deptName || 'General'}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {formatDate(complaint.createdAt || new Date())}</span>
                        {complaint.location?.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {complaint.location.address}</span>}
                      </div>
                        {complaint.images && complaint.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50">
                          {complaint.images.map((img, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => setSelectedImage(img)}
                              className="relative group w-14 h-14 rounded-lg overflow-hidden border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-all"
                            >
                              <img 
                                src={img} 
                                alt={`Attachment ${idx + 1}`} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}    
                    </div>

                    {/* Right: Actions based on Tab */}
                    <div className="flex flex-col items-end justify-center gap-3 min-w-[250px] border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                      
                      {activeTab === 'pending' && (
                        <>
                          <div className="w-full">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Assign to Staff ({deptName}):</label>
                            <select 
                              onChange={(e) => handleAssignStaff(complaint._id, e.target.value)}
                              className="w-full text-sm border-gray-300 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 focus:ring-orange-500 p-2"
                              defaultValue=""
                            >
                              <option value="" disabled>Select Staff Member...</option>
                              {eligibleStaff.map(staff => (
                                <option key={staff._id} value={staff._id}>{staff.name}</option>
                              ))}
                              {eligibleStaff.length === 0 && <option disabled>No staff in this department!</option>}
                            </select>
                          </div>
                          <button onClick={() => handleMarkResolved(complaint._id)} className="w-full py-2 text-sm font-bold text-green-700 bg-green-50 rounded-lg hover:bg-green-100 border border-green-200 transition-colors">
                            Close Automatically
                          </button>
                        </>
                      )}

                      {activeTab === 'assigned' && (
                        <>
                          <div className="w-full">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Currently Assigned To:</label>
                            <select 
                              value={typeof complaint.assignedTo === 'object' ? complaint.assignedTo._id : complaint.assignedTo || ''}
                              onChange={(e) => handleAssignStaff(complaint._id, e.target.value)}
                              className="w-full text-sm border-gray-300 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 focus:ring-blue-500 p-2 font-medium"
                            >
                              <option value="">-- Unassign Ticket --</option>
                              {eligibleStaff.map(staff => (
                                <option key={staff._id} value={staff._id}>{staff.name}</option>
                              ))}
                            </select>
                          </div>
                          <button onClick={() => handleMarkResolved(complaint._id)} className="w-full py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                            <CheckCircle className="w-4 h-4" /> Mark Resolved
                          </button>
                        </>
                      )}

                      {activeTab === 'resolved' && (
                        <div className="w-full text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold mb-2">
                            <CheckCircle className="w-3.5 h-3.5" /> Resolved
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Resolved By: <span className="font-bold text-gray-700">
                              {typeof complaint.assignedTo === 'object' ? complaint.assignedTo?.name : 'Admin'}
                            </span>
                          </p>
                          <p className="text-xs text-gray-400">
                            On: {formatDate(complaint.updatedAt || complaint.createdAt)}
                          </p>
                        </div>
                      )}

                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    {/* 🚀 NEW: Full Screen Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedImage} 
              alt="Enlarged complaint attachment" 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
              onClick={(e) => e.stopPropagation()} // Clicking the image itself won't close it
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComplaintManager;