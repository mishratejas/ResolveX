import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, Home, UserCircle, ChevronDown, Globe, Bell } from 'lucide-react';

const Navbar = ({ 
  isScrolled, 
  openAuthModal, 
  scrollToSection,
  isMobileMenuOpen,
  setIsMobileMenuOpen 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const adminToken = localStorage.getItem('adminToken');
      const staffToken = localStorage.getItem('staffToken');
      const userToken = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      
      if (adminToken || staffToken || userToken) {
        setIsAuthenticated(true);
        
        if (adminToken) {
          setUserRole('admin');
          const adminData = localStorage.getItem('admin');
          if (adminData) {
            try {
              setCurrentUser(JSON.parse(adminData));
            } catch (e) {
              console.error('Error parsing admin data:', e);
            }
          }
        } else if (staffToken) {
          setUserRole('staff');
          const staffData = localStorage.getItem('staff');
          if (staffData) {
            try {
              setCurrentUser(JSON.parse(staffData));
            } catch (e) {
              console.error('Error parsing staff data:', e);
            }
          }
        } else if (userToken && userData) {
          setUserRole('user');
          try {
            setCurrentUser(JSON.parse(userData));
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserRole('');
      }
    };
    
    checkAuth();
    
    // Listen for login events
    const handleUserLogin = () => {
      console.log('Navbar - Received userLogin event');
      checkAuth();
    };
    
    window.addEventListener('userLogin', handleUserLogin);
    
    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'adminToken' || e.key === 'staffToken' || e.key === 'accessToken') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('userLogin', handleUserLogin);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('staffToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    localStorage.removeItem('staff');
    
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserRole('');
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
    
    window.dispatchEvent(new Event('userLogout'));
    window.location.href = '/';
  };

  const getDashboardPath = () => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'staff') return '/staff/dashboard';
    return '/home';
  };

  const getProfilePath = () => {
    if (userRole === 'admin') return '/admin/profile';
    if (userRole === 'staff') return '/staff/profile';
    return '/profile';
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'testimonials', label: 'Testimonials' }
  ];

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100' 
        : 'bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400'
    }`}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isScrolled ? 'bg-gradient-to-br from-blue-600 to-cyan-500 shadow' : 'bg-white/20 backdrop-blur-sm'
          }`}>
            <span className={`text-lg font-bold ${isScrolled ? 'text-white' : 'text-white'}`}>
              R
            </span>
          </div>
          <span className={`text-xl font-bold ${isScrolled ? 'text-gray-800' : 'text-white'}`}>
            Resolve<span className={`${isScrolled ? 'text-blue-600' : 'text-cyan-200'}`}>X</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className={`font-medium transition-colors ${
                isScrolled 
                  ? 'text-gray-700 hover:text-blue-600' 
                  : 'text-white hover:text-cyan-200'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isScrolled 
                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' 
                    : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="font-medium">
                  {currentUser?.name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-medium text-gray-900">{currentUser?.name}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                    <div className="inline-flex items-center gap-1 mt-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
                      <Globe className="w-3 h-3" />
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </div>
                  </div>
                  
                  <a
                    href={getDashboardPath()}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </a>
                  
                  <a
                    href={getProfilePath()}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserCircle className="w-4 h-4" />
                    Profile
                  </a>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border-t border-gray-100 mt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => openAuthModal('user', 'signin')}
                className={`font-medium transition-colors ${
                  isScrolled 
                    ? 'text-gray-700 hover:text-blue-600' 
                    : 'text-white hover:text-cyan-200'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => openAuthModal('user', 'signup')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isScrolled 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 shadow-md' 
                    : 'bg-white text-blue-700 hover:bg-gray-100 shadow-md'
                }`}
              >
                Register
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className={`w-6 h-6 ${isScrolled ? 'text-gray-700' : 'text-white'}`} />
          ) : (
            <Menu className={`w-6 h-6 ${isScrolled ? 'text-gray-700' : 'text-white'}`} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden ${isScrolled ? 'bg-white' : 'bg-gradient-to-br from-blue-600 to-sky-500'} shadow-lg ${
        isMobileMenuOpen ? 'block' : 'hidden'
      }`}>
        <div className="px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                scrollToSection(link.id);
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-left py-2 font-medium transition-colors ${
                isScrolled 
                  ? 'text-gray-700 hover:text-blue-600' 
                  : 'text-white hover:text-cyan-200'
              }`}
            >
              {link.label}
            </button>
          ))}
          
          <div className="pt-2 border-t border-gray-200">
            {isAuthenticated ? (
              <>
                <div className="px-2 py-3 mb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
                      {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className={`font-medium ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
                        {currentUser?.name}
                      </p>
                      <p className={`text-sm ${isScrolled ? 'text-gray-500' : 'text-white/80'}`}>
                        {currentUser?.email}
                      </p>
                    </div>
                  </div>
                </div>
                
                <a
                  href={getDashboardPath()}
                  className={`flex items-center gap-2 py-3 px-2 ${
                    isScrolled 
                      ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                      : 'text-white hover:text-cyan-200 hover:bg-white/10'
                  } rounded-lg transition-colors`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="w-5 h-5" />
                  Dashboard
                </a>
                
                <a
                  href={getProfilePath()}
                  className={`flex items-center gap-2 py-3 px-2 ${
                    isScrolled 
                      ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                      : 'text-white hover:text-cyan-200 hover:bg-white/10'
                  } rounded-lg transition-colors`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserCircle className="w-5 h-5" />
                  Profile
                </a>
                
                <button
                  onClick={handleLogout}
                  className={`flex items-center gap-2 w-full py-3 px-2 mt-2 rounded-lg transition-colors ${
                    isScrolled 
                      ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    openAuthModal('user', 'signin');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left py-3 px-2 font-medium transition-colors ${
                    isScrolled 
                      ? 'text-gray-700 hover:text-blue-600' 
                      : 'text-white hover:text-cyan-200'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    openAuthModal('user', 'signup');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-center py-3 px-2 mt-2 font-medium rounded-lg transition-all ${
                    isScrolled 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90' 
                      : 'bg-white text-blue-700 hover:bg-gray-100'
                  }`}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;