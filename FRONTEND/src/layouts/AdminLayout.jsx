import React, { useState, useEffect } from 'react';
import { Shield, Bell, ChevronDown } from 'lucide-react';
import Sidebar from '../components/admin/Sidebar';

const AdminLayout = ({ children, activePage, onLogout }) => {
  const [adminInfo, setAdminInfo] = useState({
    organizationName: 'ResolveX Admin',
    name: 'Administrator',
    email: ''
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const storedData = localStorage.getItem('adminData') || localStorage.getItem('admin');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setAdminInfo({
          organizationName: parsedData.organizationName || 'ResolveX Admin',
          name: parsedData.name || 'Administrator',
          email: parsedData.email || ''
        });
      } catch (e) {
        console.error('Error parsing admin data:', e);
      }
    }
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-b from-orange-50 to-white overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>

      {/* 🚀 Your Custom Orange Sidebar */}
      <div className="z-20 shadow-xl lg:shadow-none h-full">
        <Sidebar activePage={activePage} onLogout={onLogout} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* 🚀 Glassmorphism Top Navbar */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-orange-100 shadow-sm px-6 py-3 shrink-0">
          <div className="flex items-center justify-between">
            {/* Mobile spacing for menu button */}
            <div className="md:hidden w-10"></div>
            
            {/* Desktop Left Branding */}
            <div className="hidden md:flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center shadow-md border border-orange-500/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent uppercase tracking-wide">
                  {adminInfo.organizationName}
                </h1>
              </div>
            </div>

            {/* Right Side User Profile */}
            <div className="flex items-center gap-4 ml-auto">
              <button className="p-2 hover:bg-orange-50 rounded-lg transition-all duration-200 relative border border-orange-200 bg-white">
                <Bell className="w-5 h-5 text-orange-600" />
              </button>

              <div className="relative group">
                <button className="flex items-center gap-3 p-2 hover:bg-orange-50 rounded-lg transition-all duration-200 border border-orange-200 bg-white">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-bold text-gray-900">{adminInfo.name}</p>
                    <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      {isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  <div className="relative">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md uppercase border border-orange-500/30">
                      {adminInfo.name.charAt(0)}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;