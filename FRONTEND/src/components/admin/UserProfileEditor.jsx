// components/admin/UserProfileEditor.jsx
import React, { useState, useEffect } from 'react';
import { Save, X, Mail, Phone, User, Shield, Lock, Eye, EyeOff, Download } from 'lucide-react';

const UserProfileEditor = ({ userId, onSave, onCancel }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activityLog, setActivityLog] = useState([]);
    const [stats, setStats] = useState({
        totalComplaints: 0,
        resolved: 0,
        pending: 0,
        satisfaction: 0
    });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        isActive: true,
        isVerified: false,
        role: 'user',
        permissions: [],
        notes: ''
    });

    useEffect(() => {
        fetchUserDetails();
    }, [userId]);

    const fetchUserDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const data = await response.json();
            if (data.success) {
                setUser(data.data.user);
                setFormData({
                    name: data.data.user.name || '',
                    email: data.data.user.email || '',
                    phone: data.data.user.phone || '',
                    isActive: data.data.user.isActive ?? true,
                    isVerified: data.data.user.isVerified ?? false,
                    role: data.data.user.role || 'user',
                    permissions: data.data.user.permissions || [],
                    notes: data.data.user.adminNotes || ''
                });
                setStats(data.data.stats || {});
                setActivityLog(data.data.activityLog || []);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePermissionToggle = (permission) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission]
        }));
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            if (data.success) {
                setUser(data.data);
                setEditing(false);
                onSave?.(data.data);
                alert('User updated successfully!');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user');
        }
    };

    const handleResetPassword = async () => {
        if (!window.confirm('Reset password for this user?')) return;
        
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_URL}/api/admin/users/${userId}/reset-password`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const data = await response.json();
            if (data.success) {
                alert(`Password reset. New password: ${data.data.tempPassword}`);
            }
        } catch (error) {
            console.error('Error resetting password:', error);
        }
    };

    const handleExportData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_URL}/api/admin/users/${userId}/export`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `user-${userId}-data.csv`;
            a.click();
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading user data...</div>;
    if (!user) return <div className="p-8 text-center">User not found</div>;

    const availablePermissions = [
        'can_create_complaints',
        'can_comment',
        'can_vote',
        'can_report',
        'can_edit_profile',
        'can_delete_own_complaints'
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                        <p className="text-gray-600 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {user.email}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportData}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export Data
                    </button>
                    <button
                        onClick={() => editing ? handleSave() : setEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {editing ? 'Save Changes' : 'Edit Profile'}
                    </button>
                    {editing && (
                        <button
                            onClick={() => setEditing(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{stats.totalComplaints || 0}</div>
                    <div className="text-sm text-blue-600">Total Complaints</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{stats.resolved || 0}</div>
                    <div className="text-sm text-green-600">Resolved</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700">{stats.pending || 0}</div>
                    <div className="text-sm text-yellow-600">Pending</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">{stats.satisfaction || 0}%</div>
                    <div className="text-sm text-purple-600">Satisfaction</div>
                </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Basic Information
                    </h3>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    disabled={!editing}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="isActive" className="text-sm">Active Account</label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isVerified"
                                    name="isVerified"
                                    checked={formData.isVerified}
                                    onChange={handleInputChange}
                                    disabled={!editing}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="isVerified" className="text-sm">Verified</label>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                disabled={!editing}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="user">User</option>
                                <option value="moderator">Moderator</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Right Column - Permissions & Notes */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Permissions
                    </h3>
                    
                    <div className="space-y-2">
                        {availablePermissions.map(permission => (
                            <div key={permission} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id={permission}
                                    checked={formData.permissions.includes(permission)}
                                    onChange={() => handlePermissionToggle(permission)}
                                    disabled={!editing}
                                    className="w-4 h-4"
                                />
                                <label htmlFor={permission} className="text-sm">
                                    {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </label>
                            </div>
                        ))}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            disabled={!editing}
                            rows="4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                            placeholder="Add internal notes about this user..."
                        />
                    </div>
                    
                    {!editing && (
                        <button
                            onClick={handleResetPassword}
                            className="w-full py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
                        >
                            <Lock className="w-4 h-4" />
                            Reset User Password
                        </button>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div>
                <h3 className="font-semibold text-gray-900 mb-3">Recent Activity</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activityLog.map((activity, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm">{activity.action}</p>
                                <p className="text-xs text-gray-500">{activity.timestamp}</p>
                            </div>
                            {activity.ip && (
                                <span className="text-xs text-gray-500">{activity.ip}</span>
                            )}
                        </div>
                    ))}
                    {activityLog.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No recent activity</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfileEditor;