// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Home, FileText, Users, UserCog, BarChart3, 
//   MessageSquare, Shield, Settings, Menu, LogOut,
//   ChevronRight, RefreshCw, AlertCircle
// } from 'lucide-react';

// const Sidebar = ({ activePage, onLogout }) => {
//   const navigate = useNavigate();
//   const [collapsed, setCollapsed] = useState(false);

//   // Map activePage prop to path for highlighting
//   // activePage values: 'dashboard', 'issues', 'users', 'staff', 'analytics', 'chat', 'audit', 'settings'
  
//   const menuItems = [
//     { icon: Home, label: 'Dashboard', id: 'dashboard', path: '/admin/dashboard' },
//     { icon: FileText, label: 'Complaints', id: 'issues', path: '/admin/issues' },
//     { icon: Users, label: 'Users', id: 'users', path: '/admin/users' },
//     { icon: UserCog, label: 'Staff', id: 'staff', path: '/admin/staff' },
//     { icon: BarChart3, label: 'Analytics', id: 'analytics', path: '/admin/analytics' },
//     { icon: MessageSquare, label: 'Chat', id: 'chat', path: '/admin/chat' },
//     { icon: Shield, label: 'Audit Logs', id: 'audit', path: '/admin/audit' },
//     { icon: Settings, label: 'Settings', id: 'settings', path: '/admin/settings' },
//   ];

//   return (
//     <>
//       {/* Mobile Toggle - explicit positioning might be needed depending on parent layout */}
//       <div className="fixed top-4 left-4 z-50 md:hidden">
//         <button
//           onClick={() => setCollapsed(!collapsed)}
//           className="p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-600"
//         >
//           <Menu className="w-5 h-5" />
//         </button>
//       </div>

//       <div 
//         className={`bg-white/95 backdrop-blur-xl border-r border-orange-100 transition-all duration-300 z-40 flex flex-col h-full ${
//           collapsed ? 'w-20' : 'w-64'
//         }`}
//       >
//         <div className="p-4 flex items-center justify-between border-b border-orange-50 mb-2">
//           {!collapsed && (
//             <h1 className="font-bold text-xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
//               RESOLVEX
//             </h1>
//           )}
//           <button
//             onClick={() => setCollapsed(!collapsed)}
//             className="p-1.5 hover:bg-orange-50 rounded-lg text-gray-500 transition-colors mx-auto"
//           >
//             <Menu className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
//           <nav className="space-y-2">
//             {menuItems.map((item) => {
//               const isActive = activePage === item.id;
              
//               return (
//                 <button
//                   key={item.id}
//                   onClick={() => navigate(item.path)}
//                   className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group ${
//                     isActive
//                       ? 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 text-orange-700 shadow-sm'
//                       : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/50 border border-transparent hover:border-orange-200'
//                   }`}
//                   title={collapsed ? item.label : ''}
//                 >
//                   <div className={`p-2 rounded-lg shrink-0 ${
//                     isActive
//                       ? 'bg-gradient-to-br from-orange-600 to-red-600 text-white shadow-md'
//                       : 'bg-orange-50 group-hover:bg-gradient-to-br group-hover:from-orange-100 group-hover:to-red-100 text-orange-600'
//                   }`}>
//                     <item.icon className="w-5 h-5" />
//                   </div>
                  
//                   {!collapsed && (
//                     <span className="flex-1 text-left font-medium whitespace-nowrap">
//                       {item.label}
//                     </span>
//                   )}
                  
//                   {isActive && !collapsed && (
//                     <ChevronRight className="w-4 h-4 text-orange-400" />
//                   )}
//                 </button>
//               );
//             })}
//           </nav>
//         </div>
        
//         <div className="p-4 border-t border-orange-100">
//           <button
//             onClick={onLogout}
//             className={`w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 ${
//               collapsed ? 'justify-center' : ''
//             }`}
//             title="Logout"
//           >
//             <LogOut className="w-5 h-5" />
//             {!collapsed && <span className="font-medium">Logout</span>}
//           </button>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;

// ##################################################################################################

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Home, FileText, Users, UserCog, BarChart3, 
//   MessageSquare, Shield, Settings, Menu, LogOut,
//   ChevronRight, RefreshCw, AlertCircle, Building
// } from 'lucide-react';

// const Sidebar = ({ activePage, onLogout }) => {
//   const navigate = useNavigate();
//   const [collapsed, setCollapsed] = useState(false);
  
//   // 🚀 NEW: State to hold Organization Name
//   const [orgName, setOrgName] = useState('RESOLVEX');

//   // 🚀 NEW: Fetch Admin Data on Mount
//   useEffect(() => {
//     const adminData = localStorage.getItem('adminData') || localStorage.getItem('admin');
//     if (adminData) {
//       try {
//         const parsed = JSON.parse(adminData);
//         if (parsed.organizationName) setOrgName(parsed.organizationName);
//       } catch (e) {
//         console.error("Error parsing admin data for sidebar", e);
//       }
//     }
//   }, []);

//   const menuItems = [
//     { icon: Home, label: 'Dashboard', id: 'dashboard', path: '/admin/dashboard' },
//     { icon: Building, label: 'Departments', id: 'departments', path: '/admin/departments' },
//     { icon: FileText, label: 'Complaints', id: 'issues', path: '/admin/issues' },
//     { icon: Users, label: 'Users', id: 'users', path: '/admin/users' },
//     { icon: UserCog, label: 'Staff', id: 'staff', path: '/admin/staff' },
//     { icon: BarChart3, label: 'Analytics', id: 'analytics', path: '/admin/analytics' },
//     { icon: MessageSquare, label: 'Chat', id: 'chat', path: '/admin/chat' },
//     { icon: Shield, label: 'Audit Logs', id: 'audit', path: '/admin/audit' },
//   ];

//   return (
//     <>
//       <div className="fixed top-4 left-4 z-50 md:hidden">
//         <button
//           onClick={() => setCollapsed(!collapsed)}
//           className="p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-600"
//         >
//           <Menu className="w-5 h-5" />
//         </button>
//       </div>

//       <div 
//         className={`bg-white/95 backdrop-blur-xl border-r border-orange-100 transition-all duration-300 z-40 flex flex-col h-full ${
//           collapsed ? 'w-20' : 'w-64'
//         }`}
//       >
//         <div className="p-4 flex items-center justify-between border-b border-orange-50 mb-2">
//           {!collapsed && (
//             // 🚀 UPDATED: Dynamically display the Organization Name
//             <h1 className="font-bold text-xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent uppercase truncate pr-2" title={orgName}>
//               {orgName}
//             </h1>
//           )}
//           <button
//             onClick={() => setCollapsed(!collapsed)}
//             className="p-1.5 hover:bg-orange-50 rounded-lg text-gray-500 transition-colors mx-auto shrink-0"
//           >
//             <Menu className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
//           <nav className="space-y-2">
//             {menuItems.map((item) => {
//               const isActive = activePage === item.id;
              
//               return (
//                 <button
//                   key={item.id}
//                   onClick={() => navigate(item.path)}
//                   className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group ${
//                     isActive
//                       ? 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 text-orange-700 shadow-sm'
//                       : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/50 border border-transparent hover:border-orange-200'
//                   }`}
//                   title={collapsed ? item.label : ''}
//                 >
//                   <div className={`p-2 rounded-lg shrink-0 ${
//                     isActive
//                       ? 'bg-gradient-to-br from-orange-600 to-red-600 text-white shadow-md'
//                       : 'bg-orange-50 group-hover:bg-gradient-to-br group-hover:from-orange-100 group-hover:to-red-100 text-orange-600'
//                   }`}>
//                     <item.icon className="w-5 h-5" />
//                   </div>
                  
//                   {!collapsed && (
//                     <span className="flex-1 text-left font-medium whitespace-nowrap">
//                       {item.label}
//                     </span>
//                   )}
                  
//                   {isActive && !collapsed && (
//                     <ChevronRight className="w-4 h-4 text-orange-400" />
//                   )}
//                 </button>
//               );
//             })}
//           </nav>
//         </div>
        
//         <div className="p-4 border-t border-orange-100">
//           <button
//             onClick={onLogout}
//             className={`w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 ${
//               collapsed ? 'justify-center' : ''
//             }`}
//             title="Logout"
//           >
//             <LogOut className="w-5 h-5 shrink-0" />
//             {!collapsed && <span className="font-medium">Logout</span>}
//           </button>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Sidebar;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Home, FileText, Users, UserCog, BarChart3, 
  MessageSquare, Shield, Menu, LogOut,
  ChevronRight, Building
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Sidebar = ({ activePage, onLogout }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [orgName, setOrgName] = useState('RESOLVEX');
  
  // 🚀 NEW: State to hold sidebar badge counts
  const [badges, setBadges] = useState({
    issues: 0,
    users: 0,
    staff: 0,
    chat: 0
  });

  useEffect(() => {
    const adminData = localStorage.getItem('adminData') || localStorage.getItem('admin');
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData);
        if (parsed.organizationName) setOrgName(parsed.organizationName);
      } catch (e) {
        console.error("Error parsing admin data for sidebar", e);
      }
    }
    
    // 🚀 NEW: Fetch badge counts on load
    fetchSidebarStats();
    
    // Auto-refresh badges every 30 seconds
    const interval = setInterval(fetchSidebarStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSidebarStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      // We can grab high-level stats from your dashboard endpoint to populate badges
      const res = await axios.get(`${API_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const stats = res.data.data.stats;
        
        // You can customize which stats map to which badges here!
        setBadges(prev => ({
          ...prev,
          issues: stats.pending || 0,
          users: stats.users || 0,
          staff: stats.staff || 0
        }));
      }

      // Also grab unread chat counts
      const chatRes = await axios.get(`${API_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (chatRes.data.success) {
        setBadges(prev => ({
          ...prev,
          chat: chatRes.data.data.totalUnread || 0
        }));
      }
    } catch (err) {
      console.error("Failed to fetch sidebar stats", err);
    }
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', id: 'dashboard', path: '/admin/dashboard', badge: null },
    { icon: Building, label: 'Departments', id: 'departments', path: '/admin/departments', badge: null },
    { icon: FileText, label: 'Complaints', id: 'issues', path: '/admin/issues', badge: badges.issues },
    { icon: Users, label: 'Users', id: 'users', path: '/admin/users', badge: badges.users },
    { icon: UserCog, label: 'Staff', id: 'staff', path: '/admin/staff', badge: badges.staff },
    { icon: BarChart3, label: 'Analytics', id: 'analytics', path: '/admin/analytics', badge: null },
    { icon: MessageSquare, label: 'Chat', id: 'chat', path: '/admin/chat', badge: badges.chat },
    { icon: Shield, label: 'Audit Logs', id: 'audit', path: '/admin/audit', badge: null },
  ];

  return (
    <>
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-600"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div 
        className={`bg-white/95 backdrop-blur-xl border-r border-orange-100 transition-all duration-300 z-40 flex flex-col h-full ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-orange-50 mb-2">
          {!collapsed && (
            <h1 className="font-bold text-xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent uppercase truncate pr-2" title={orgName}>
              {orgName}
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-orange-50 rounded-lg text-gray-500 transition-colors mx-auto shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = activePage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 text-orange-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/50 border border-transparent hover:border-orange-200'
                  }`}
                  title={collapsed ? item.label : ''}
                >
                  <div className={`p-2 rounded-lg shrink-0 relative ${
                    isActive
                      ? 'bg-gradient-to-br from-orange-600 to-red-600 text-white shadow-md'
                      : 'bg-orange-50 group-hover:bg-gradient-to-br group-hover:from-orange-100 group-hover:to-red-100 text-orange-600'
                  }`}>
                    <item.icon className="w-5 h-5" />
                    
                    {/* 🚀 Collapsed Badge Dot */}
                    {collapsed && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  
                  {!collapsed && (
                    <span className="flex-1 text-left font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                  
                  {/* 🚀 Expanded Number Badge */}
                  {!collapsed && item.badge > 0 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full border border-rose-200">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  
                  {isActive && !collapsed && item.badge == null && (
                    <ChevronRight className="w-4 h-4 text-orange-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-orange-100">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Logout"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;