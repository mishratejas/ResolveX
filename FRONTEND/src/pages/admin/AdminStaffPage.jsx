import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as adminService from '../../services/adminService';
import {
  Users, Search, Filter, RefreshCw, UserPlus, Edit, Trash2, Eye,
  CheckCircle, Clock, AlertCircle, TrendingUp, MoreVertical
} from 'lucide-react';

const AdminStaffPage = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    department: 'all',
    status: 'all'
  });

  useEffect(() => {
    fetchStaffData();
    fetchStaffStats();
  }, []);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getStaff();
      if (response.success) {
        setStaff(response.data.staff || []);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffStats = async () => {
    try {
      const response = await adminService.getStaffStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching staff stats:', error);
    }
  };

  const filteredStaff = staff.filter(staffMember => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        staffMember.name?.toLowerCase().includes(searchLower) ||
        staffMember.email?.toLowerCase().includes(searchLower) ||
        staffMember.staffId?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600">Manage all staff members and their performance</p>
          </div>
          <button
            onClick={() => navigate('/admin/staff/add')}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inactive}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg. Resolution</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.performance?.avgResolutionRate?.toFixed(1) || 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedFilters.department}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, department: e.target.value }))}
              className="px-4 py-3 border border-gray-300 rounded-xl"
            >
              <option value="all">All Departments</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Electricity">Electricity</option>
              <option value="Road Maintenance">Road Maintenance</option>
              <option value="Sanitation">Sanitation</option>
            </select>
            <button
              onClick={fetchStaffData}
              className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">Staff Member</th>
                <th className="px-6 py-4 text-left">Department</th>
                <th className="px-6 py-4 text-left">Contact</th>
                <th className="px-6 py-4 text-left">Assigned</th>
                <th className="px-6 py-4 text-left">Resolved</th>
                <th className="px-6 py-4 text-left">Rate</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStaff.map((staffMember) => (
                <tr key={staffMember._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {staffMember.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staffMember.name}</p>
                        <p className="text-sm text-gray-500">{staffMember.staffId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg text-sm">
                      {staffMember.department?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{staffMember.email}</p>
                    <p className="text-sm text-gray-500">{staffMember.phone || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{staffMember.stats?.totalAssigned || 0}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-green-600 font-medium">{staffMember.stats?.resolved || 0}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500"
                          style={{ width: `${staffMember.stats?.resolutionRate || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {staffMember.stats?.resolutionRate || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      staffMember.isActive 
                        ? 'text-green-600 bg-green-100' 
                        : 'text-red-600 bg-red-100'
                    }`}>
                      {staffMember.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/staff/${staffMember._id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/staff/${staffMember._id}/edit`)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this staff member?')) {
                            // Handle delete
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStaffPage;