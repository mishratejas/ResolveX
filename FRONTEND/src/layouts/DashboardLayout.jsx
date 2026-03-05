// import React from 'react';
// import { NavLink } from 'react-router-dom';

// const DashboardLayout = ({ children, role, onLogout }) => {
//   const getSidebarItems = () => {
//     const commonItems = [
//       { icon: 'fa-home', label: 'Dashboard', href: `/${role}/dashboard` },
//       { icon: 'fa-chart-bar', label: 'Analytics', href: `/${role}/analytics` },
//       { icon: 'fa-cog', label: 'Settings', href: `/${role}/settings` },
//     ];

//     if (role === 'admin') {
//       return [
//         ...commonItems,
//         { icon: 'fa-users', label: 'Users', href: '/admin/users' },
//         { icon: 'fa-user-tie', label: 'Staff', href: '/admin/staff' },
//         { icon: 'fa-comments', label: 'Chat', href: '/admin/chat' },
//       ];
//     }

//     if (role === 'staff') {
//       return [
//         ...commonItems,
//         { icon: 'fa-tasks', label: 'Assigned Issues', href: '/staff/issues' },
//         { icon: 'fa-comments', label: 'Chat', href: '/staff/chat' },
//       ];
//     }

//     return [
//       ...commonItems,
//       { icon: 'fa-bullhorn', label: 'My Reports', href: '/user/reports' },
//       { icon: 'fa-star', label: 'Voted Issues', href: '/user/votes' },
//     ];
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex">
//       {/* Sidebar */}
//       <aside className="w-64 bg-white shadow-lg flex-shrink-0">
//         <div className="p-6 border-b">
//           <div className="flex items-center">
//             <div className="w-10 h-10 gradient-bg rounded-lg mr-3"></div>
//             <span className="text-xl font-bold text-gray-800">
//               Resolve<span className="logo-x">X</span>
//             </span>
//           </div>
//           <p className="text-sm text-gray-600 mt-2 capitalize">
//             {role} Dashboard
//           </p>
//         </div>

//         <nav className="p-4">
//           {getSidebarItems().map((item, index) => (
//             <NavLink
//               key={index}
//               to={item.href}
//               className={({ isActive }) =>
//                 `flex items-center px-4 py-3 rounded-lg mb-1 transition-colors ${
//                   isActive
//                     ? 'bg-blue-100 text-blue-600'
//                     : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
//                 }`
//               }
//             >
//               <i className={`fas ${item.icon} mr-3`}></i>
//               {item.label}
//             </NavLink>
//           ))}

//           <button
//             onClick={onLogout}
//             className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg mt-4 transition-colors"
//           >
//             <i className="fas fa-sign-out-alt mr-3"></i>
//             Logout
//           </button>
//         </nav>
//       </aside>

//       {/* Main Content */}
//       <main className="flex-1 overflow-y-auto">
//         <header className="bg-white shadow-sm p-4">
//           <div className="flex justify-between items-center">
//             <h1 className="text-2xl font-bold text-gray-800">
//               Welcome back, {role.charAt(0).toUpperCase() + role.slice(1)}
//             </h1>
//             <div className="flex items-center space-x-4">
//               <button className="text-gray-600 hover:text-blue-600">
//                 <i className="fas fa-bell text-xl"></i>
//               </button>
//               <div className="w-8 h-8 gradient-bg rounded-full"></div>
//             </div>
//           </div>
//         </header>

//         <div className="p-6">{children}</div>
//       </main>
//     </div>
//   );
// };

// export default DashboardLayout;

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

const DashboardLayout = ({ children, role, onLogout }) => {
  // 🚀 NEW: State to hold dynamic user details
  const [userInfo, setUserInfo] = useState({ name: '', avatar: 'U' });

  // 🚀 NEW: Fetch appropriate data based on role
  useEffect(() => {
    let storageKey = '';
    if (role === 'admin') storageKey = 'adminData';
    else if (role === 'staff') storageKey = 'staffData';
    else storageKey = 'user'; // default for normal users

    // Fallbacks just in case
    const dataStr = localStorage.getItem(storageKey) || localStorage.getItem(role);
    
    if (dataStr) {
      try {
        const parsed = JSON.parse(dataStr);
        setUserInfo({
          name: parsed.name || role,
          avatar: (parsed.name || role).charAt(0).toUpperCase()
        });
      } catch (e) {
        console.error("Error parsing user data for layout", e);
      }
    }
  }, [role]);

  const getSidebarItems = () => {
    const commonItems = [
      { icon: 'fa-home', label: 'Dashboard', href: `/${role}/dashboard` },
      { icon: 'fa-chart-bar', label: 'Analytics', href: `/${role}/analytics` },
      { icon: 'fa-cog', label: 'Settings', href: `/${role}/settings` },
    ];

    if (role === 'admin') {
      return [
        ...commonItems,
        { icon: 'fa-building', label: 'Departments', href: '/admin/departments' },
        { icon: 'fa-users', label: 'Users', href: '/admin/users' },
        { icon: 'fa-user-tie', label: 'Staff', href: '/admin/staff' },
        { icon: 'fa-comments', label: 'Chat', href: '/admin/chat' },
      ];
    }

    if (role === 'staff') {
      return [
        ...commonItems,
        { icon: 'fa-tasks', label: 'Assigned Issues', href: '/staff/issues' },
        { icon: 'fa-comments', label: 'Chat', href: '/staff/chat' },
      ];
    }

    return [
      ...commonItems,
      { icon: 'fa-bullhorn', label: 'My Reports', href: '/user/reports' },
      { icon: 'fa-star', label: 'Voted Issues', href: '/user/votes' },
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex-shrink-0">
        <div className="p-6 border-b">
          <div className="flex items-center">
            <div className="w-10 h-10 gradient-bg rounded-lg mr-3 flex items-center justify-center">
              <i className="fas fa-shield-alt text-white text-lg"></i>
            </div>
            <span className="text-xl font-bold text-gray-800">
              Resolve<span className="logo-x text-blue-600">X</span>
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2 capitalize font-medium">
            {role} Portal
          </p>
        </div>

        <nav className="p-4">
          {getSidebarItems().map((item, index) => (
            <NavLink
              key={index}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <i className={`fas ${item.icon} mr-3 w-5 text-center`}></i>
              {item.label}
            </NavLink>
          ))}

          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg mt-4 transition-colors font-medium border border-transparent hover:border-red-100"
          >
            <i className="fas fa-sign-out-alt mr-3 w-5 text-center"></i>
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* 🚀 UPDATED: Dynamic Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex-shrink-0 z-10">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              Welcome back, <span className="text-blue-600">{userInfo.name}</span>
            </h1>
            <div className="flex items-center space-x-5">
              <button className="text-gray-500 hover:text-blue-600 transition-colors relative">
                <i className="fas fa-bell text-xl"></i>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">{userInfo.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{role}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white ring-2 ring-gray-100">
                  {userInfo.avatar}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;