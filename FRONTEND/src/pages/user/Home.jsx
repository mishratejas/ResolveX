import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home as HomeIcon,
  User,
  Bell,
  Settings,
  LogOut,
  AlertCircle,
  BarChart3,
  Award,
  Shield,
  PlusCircle,
  List,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";
import Dashboard from "../../components/user/Dashboard";
import AllComplaints from "../../components/user/AllComplaints";
import MyComplaints from "../../components/user/MyComplaints";
import RaiseComplaint from "../../components/user/RaiseComplaint";
import Reports from "../../components/user/Reports";
import Leaderboard from "../../components/user/Leaderboard";
import Profile from "../../components/user/Profile";

const Home = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <HomeIcon className="w-4 h-4" />,
      path: "/home",
    },
    {
      id: "complaints",
      label: "All Complaints",
      icon: <AlertCircle className="w-4 h-4" />,
      path: "/home/complaints",
    },
    {
      id: "my-complaints",
      label: "My Complaints",
      icon: <List className="w-4 h-4" />,
      path: "/home/my-complaints",
    },
    {
      id: "raise",
      label: "Raise Issue",
      icon: <PlusCircle className="w-4 h-4" />,
      path: "/home/raise-complaint",
    },
    {
      id: "reports",
      label: "Reports",
      icon: <BarChart3 className="w-4 h-4" />,
      path: "/home/reports",
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: <Award className="w-4 h-4" />,
      path: "/home/leaderboard",
    },
  ];

  // Load user from localStorage
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (err) {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    } else {
      window.location.href = "/login";
    }
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/users/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setCurrentUser(null);
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Community Portal
                </h1>
                <p className="text-sm text-gray-600">
                  Citizen Grievance Redressal System
                </p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
                    {currentUser?.name?.charAt(0) || "U"}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      {currentUser?.name || "User"}
                    </p>
                    <p className="text-sm text-gray-600">View Profile</p>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Routes>
          <Route
            path="dashboard"
            element={<Dashboard currentUser={currentUser} />}
          />
          <Route
            path="complaints"
            element={<AllComplaints currentUser={currentUser} />}
          />
          <Route path="complaints/:id" element={<ComplaintDetailPage />} />
          <Route
            path="my-complaints"
            element={<MyComplaints currentUser={currentUser} />}
          />
          <Route
            path="raise-complaint"
            element={<RaiseComplaint currentUser={currentUser} />}
          />
          <Route
            path="profile"
            element={<Profile currentUser={currentUser} />}
          />
          <Route
            path="reports"
            element={<Reports currentUser={currentUser} />}
          />
          <Route
            path="leaderboard"
            element={<Leaderboard currentUser={currentUser} />}
          />
        </Routes>
      </main>

      {/* Improved Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold">Community Portal</h2>
              </div>
              <p className="text-gray-300">
                Empowering citizens to report and resolve community issues
                efficiently.
              </p>
              <div className="flex items-center gap-4">
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                  <TrendingUp className="w-5 h-5" />
                </button>
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                  <UsersIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="/complaints"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    All Issues
                  </a>
                </li>
                <li>
                  <a
                    href="/raise-complaint"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Report Issue
                  </a>
                </li>
                <li>
                  <a
                    href="/my-complaints"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    My Reports
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/reports"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Reports & Analytics
                  </a>
                </li>
                <li>
                  <a
                    href="/leaderboard"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Leaderboard
                  </a>
                </li>
                <li>
                  <a
                    href="/faq"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="/guidelines"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Guidelines
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact & Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact & Support</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/contact"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a
                    href="/support"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Support Center
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700 my-8"></div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-400">
                © 2024 Community Portal. All rights reserved.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Version 2.1.0 • Made with ❤️ for better communities
              </p>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-gray-400">Follow us:</span>
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Twitter
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Facebook
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  LinkedIn
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
