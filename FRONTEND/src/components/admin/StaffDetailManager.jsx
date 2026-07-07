import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as adminService from '../../services/adminService';
import {
  ArrowLeft, Mail, Phone, Building, CheckCircle, Clock,
  AlertCircle, TrendingUp, Award, RefreshCw, User as UserIcon
} from 'lucide-react';

// FIX (OR-6): backs the "View Details" button in StaffManager.jsx, which was
// commented out because there was nowhere to navigate to. The backend
// endpoint (GET /api/admin/staff/:id) already existed and worked — it just
// had zero frontend callers.
const StaffDetailManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getStaffDetails(id);
      if (response.success) {
        setDetails(response.data);
      } else {
        setError(response.message || 'Failed to load staff details');
      }
    } catch (err) {
      console.error('Error fetching staff details:', err);
      setError(err.response?.data?.message || 'Failed to load staff details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading staff details...</p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Couldn't load staff details</h2>
          <p className="text-gray-500 mb-6">{error || 'Staff member not found'}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate('/admin/staff')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
              Back to Staff
            </button>
            <button onClick={fetchDetails} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { stats = {}, recentComplaints = [] } = details;

  const statCards = [
    { label: 'Assigned', value: stats.totalAssigned ?? 0, icon: TrendingUp, color: 'blue' },
    { label: 'Resolved', value: stats.resolved ?? 0, icon: CheckCircle, color: 'green' },
    { label: 'Pending', value: stats.pending ?? 0, icon: Clock, color: 'yellow' },
    { label: 'In Progress', value: stats.inProgress ?? 0, icon: AlertCircle, color: 'orange' },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    orange: 'bg-orange-50 text-orange-700',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/admin/staff')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Staff
      </button>

      {/* Profile header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {details.profileImage ? (
              <img src={details.profileImage} alt={details.name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{details.name}</h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${details.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {details.isActive ? 'Active' : 'Inactive'}
              </span>
              {details.staffId && (
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {details.staffId}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
              {details.email && (
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {details.email}</span>
              )}
              {details.phone && (
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {details.phone}</span>
              )}
              {details.department?.name && (
                <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> {details.department.name}</span>
              )}
            </div>
          </div>
          <div className="text-center bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-xl px-4 py-3">
            <Award className="w-5 h-5 mx-auto mb-1" />
            <p className="text-lg font-bold leading-none">{stats.performanceScore ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wide opacity-90">Score</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${colorClasses[color]}`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-6 text-sm">
        <div>
          <span className="text-gray-500">Resolution rate: </span>
          <span className="font-semibold text-gray-900">{stats.resolutionRate ?? 0}%</span>
        </div>
        <div>
          <span className="text-gray-500">Avg. resolution time: </span>
          <span className="font-semibold text-gray-900">{stats.avgResolutionTime ?? 0} days</span>
        </div>
      </div>

      {/* Recent complaints */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Assigned Complaints</h2>
        </div>
        {recentComplaints.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No complaints assigned yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentComplaints.map((complaint) => (
              <div key={complaint._id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{complaint.title}</p>
                  <p className="text-xs text-gray-500">
                    {complaint.user?.name || 'Anonymous'} &middot; {complaint.department?.name || 'General'}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                  complaint.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  complaint.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {complaint.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDetailManager;