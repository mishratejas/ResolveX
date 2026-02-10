import React from 'react';
import { NavLink } from 'react-router-dom';

const DashboardLayout = ({ children, role, onLogout }) => {
  const getSidebarItems = () => {
    const commonItems = [
      { icon: 'fa-home', label: 'Dashboard', href: `/${role}/dashboard` },
      { icon: 'fa-chart-bar', label: 'Analytics', href: `/${role}/analytics` },
      { icon: 'fa-cog', label: 'Settings', href: `/${role}/settings` },
    ];

    if (role === 'admin') {
      return [
        ...commonItems,
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
            <div className="w-10 h-10 gradient-bg rounded-lg mr-3"></div>
            <span className="text-xl font-bold text-gray-800">
              Resolve<span className="logo-x">X</span>
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2 capitalize">
            {role} Dashboard
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
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`
              }
            >
              <i className={`fas ${item.icon} mr-3`}></i>
              {item.label}
            </NavLink>
          ))}

          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg mt-4 transition-colors"
          >
            <i className="fas fa-sign-out-alt mr-3"></i>
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome back, {role.charAt(0).toUpperCase() + role.slice(1)}
            </h1>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-blue-600">
                <i className="fas fa-bell text-xl"></i>
              </button>
              <div className="w-8 h-8 gradient-bg rounded-full"></div>
            </div>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
