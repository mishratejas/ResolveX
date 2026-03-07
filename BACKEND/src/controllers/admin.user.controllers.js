import mongoose from "mongoose"; // 🚀 Added for aggregation
import User from "../models/User.models.js";
import UserComplaint from "../models/UserComplaint.models.js";

// Get all users with stats (WORKSPACE LOCKED)
export const getAllUsers = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id;
        const { page = 1, limit = 20, search = '', status = '' } = req.query;
        
        // 🚀 THE FIX: Only fetch users that have joined THIS admin's workspace
        const query = { joinedWorkspaces: currentAdminId };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }
        
        const skip = (page - 1) * limit;
        
        const users = await User.find(query)
            .select('-password')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        
        const total = await User.countDocuments(query);
        
        // Get complaint stats for each user (Scoping to THIS workspace only)
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                // 🚀 THE FIX: Only count tickets this user submitted to THIS admin
                const userComplaints = await UserComplaint.find({ 
                    user: user._id, 
                    adminId: currentAdminId 
                });
                const resolvedComplaints = userComplaints.filter(c => c.status === 'resolved');
                
                return {
                    ...user.toObject(),
                    stats: {
                        totalComplaints: userComplaints.length,
                        resolvedComplaints: resolvedComplaints.length,
                        pendingComplaints: userComplaints.filter(c => c.status === 'pending').length,
                        inProgressComplaints: userComplaints.filter(c => c.status === 'in-progress').length,
                        resolutionRate: userComplaints.length > 0 
                            ? Math.round((resolvedComplaints.length / userComplaints.length) * 100) 
                            : 0
                    }
                };
            })
        );
        
        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: {
                users: usersWithStats,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
            }
        });
        
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Error fetching users' });
    }
};

// Get user statistics (WORKSPACE LOCKED)
export const getUserStats = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id;

        // 🚀 THE FIX: Lock all counts to this workspace
        const totalUsers = await User.countDocuments({ joinedWorkspaces: currentAdminId });
        const activeUsers = await User.countDocuments({ joinedWorkspaces: currentAdminId, isActive: true });
        const verifiedUsers = await User.countDocuments({ joinedWorkspaces: currentAdminId, isVerified: true });
        
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        
        const usersLast30Days = await User.countDocuments({ joinedWorkspaces: currentAdminId, createdAt: { $gte: last30Days } });
        const usersLast90Days = await User.countDocuments({ joinedWorkspaces: currentAdminId, createdAt: { $gte: last90Days } });
        
        // Complaint statistics by user (Only counting complaints in this workspace)
        const complaintStats = await UserComplaint.aggregate([
            { $match: { adminId: new mongoose.Types.ObjectId(currentAdminId) } }, // 🚀 THE FIX
            {
                $group: {
                    _id: '$user',
                    totalComplaints: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
                }
            },
            {
                $group: {
                    _id: null,
                    totalUsersWithComplaints: { $sum: 1 },
                    avgComplaintsPerUser: { $avg: '$totalComplaints' },
                    avgResolutionRate: {
                        $avg: {
                            $cond: [
                                { $gt: ['$totalComplaints', 0] },
                                { $multiply: [{ $divide: ['$resolved', '$totalComplaints'] }, 100] }, 0
                            ]
                        }
                    }
                }
            }
        ]);
        
        const stats = {
            total: totalUsers, active: activeUsers, verified: verifiedUsers,
            growth: { last30Days: usersLast30Days, last90Days: usersLast90Days },
            complaints: complaintStats[0] || { totalUsersWithComplaints: 0, avgComplaintsPerUser: 0, avgResolutionRate: 0 }
        };
        
        res.status(200).json({ success: true, message: 'User statistics retrieved successfully', data: stats });
        
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching user statistics' });
    }
};

// Get user details (WORKSPACE LOCKED)
export const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const currentAdminId = req.admin?._id || req.admin?.id;
        
        // 🚀 THE FIX: Ensure admin is only viewing users attached to their workspace
        const user = await User.findOne({ _id: id, joinedWorkspaces: currentAdminId }).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found or access denied' });
        }
        
        // 🚀 THE FIX: Get user's complaints ONLY for this admin's workspace
        const complaints = await UserComplaint.find({ user: id, adminId: currentAdminId })
            .populate('assignedTo', 'name email')
            .populate('department', 'name')
            .sort({ createdAt: -1 });
        
        const totalComplaints = complaints.length;
        const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
        
        const userDetails = {
            ...user.toObject(),
            complaints: complaints.slice(0, 10), 
            stats: {
                totalComplaints,
                resolvedComplaints,
                pendingComplaints: complaints.filter(c => c.status === 'pending').length,
                inProgressComplaints: complaints.filter(c => c.status === 'in-progress').length,
                resolutionRate: totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0,
                avgResponseTime: 24, 
                satisfactionScore: 85 
            }
        };
        
        res.status(200).json({ success: true, message: 'User details retrieved successfully', data: userDetails });
        
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ success: false, message: 'Error fetching user details' });
    }
};

// Update user (WORKSPACE LOCKED)
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentAdminId = req.admin?._id || req.admin?.id;
        const updates = req.body;
        
        // 🚀 THE FIX: Verify authorization
        const user = await User.findOne({ _id: id, joinedWorkspaces: currentAdminId });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found or access denied' });
        }
        
        Object.keys(updates).forEach(key => {
            if (key !== 'password' && key !== 'email' && key !== 'joinedWorkspaces') {
                user[key] = updates[key];
            }
        });
        
        await user.save();
        const updatedUser = await User.findById(id).select('-password');
        
        res.status(200).json({ success: true, message: 'User updated successfully', data: updatedUser });
        
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Error updating user' });
    }
};

// Delete user (WORKSPACE LOCKED)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentAdminId = req.admin?._id || req.admin?.id;
        
        // 🚀 THE FIX: Verify authorization
        const user = await User.findOne({ _id: id, joinedWorkspaces: currentAdminId });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found or access denied' });
        }
        
        // 🚀 THE FIX: Only check complaints in this admin's workspace
        const userComplaints = await UserComplaint.countDocuments({ user: id, adminId: currentAdminId });
        
        if (userComplaints > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete user with ${userComplaints} complaints in your workspace. Delete complaints first or anonymize them.`
            });
        }
        
        await User.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'User deleted successfully' });
        
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Error deleting user' });
    }
};

// Bulk operations (WORKSPACE LOCKED)
export const bulkUpdateUsers = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id;
        const { userIds, action, data } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'User IDs are required' });
        }
        
        let update = {};
        let message = '';
        
        switch (action) {
            case 'activate': update.isActive = true; message = 'Users activated successfully'; break;
            case 'deactivate': update.isActive = false; message = 'Users deactivated successfully'; break;
            case 'verify': update.isVerified = true; message = 'Users verified successfully'; break;
            case 'change_role':
                if (!data || !data.role) return res.status(400).json({ success: false, message: 'Role is required' });
                update.role = data.role; message = 'User roles updated successfully'; break;
            default: return res.status(400).json({ success: false, message: 'Invalid action' });
        }
        
        // 🚀 THE FIX: Apply bulk update ONLY to users who belong to this admin
        await User.updateMany(
            { _id: { $in: userIds }, joinedWorkspaces: currentAdminId }, 
            { $set: update }
        );
        
        res.status(200).json({ success: true, message });
        
    } catch (error) {
        console.error('Error in bulk update:', error);
        res.status(500).json({ success: false, message: 'Error performing bulk operation' });
    }
};