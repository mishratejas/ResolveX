import User from "../models/User.models.js";
import UserComplaint from "../models/UserComplaint.models.js";

// Get all users with stats
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', status = '' } = req.query;
        
        const query = {};
        
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
        
        // Get complaint stats for each user
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const userComplaints = await UserComplaint.find({ user: user._id });
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
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
};

// Get user statistics
export const getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const verifiedUsers = await User.countDocuments({ isVerified: true });
        
        // User growth over time
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        
        const usersLast30Days = await User.countDocuments({ createdAt: { $gte: last30Days } });
        const usersLast90Days = await User.countDocuments({ createdAt: { $gte: last90Days } });
        
        // Complaint statistics by user
        const complaintStats = await UserComplaint.aggregate([
            {
                $group: {
                    _id: '$user',
                    totalComplaints: { $sum: 1 },
                    resolved: {
                        $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
                    }
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
                                { $multiply: [{ $divide: ['$resolved', '$totalComplaints'] }, 100] },
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        
        const stats = {
            total: totalUsers,
            active: activeUsers,
            verified: verifiedUsers,
            growth: {
                last30Days: usersLast30Days,
                last90Days: usersLast90Days
            },
            complaints: complaintStats[0] || {
                totalUsersWithComplaints: 0,
                avgComplaintsPerUser: 0,
                avgResolutionRate: 0
            }
        };
        
        res.status(200).json({
            success: true,
            message: 'User statistics retrieved successfully',
            data: stats
        });
        
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics'
        });
    }
};

// Get user details
export const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get user's complaints
        const complaints = await UserComplaint.find({ user: id })
            .populate('assignedTo', 'name email')
            .populate('department', 'name')
            .sort({ createdAt: -1 });
        
        // Calculate user stats
        const totalComplaints = complaints.length;
        const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
        
        const userDetails = {
            ...user.toObject(),
            complaints: complaints.slice(0, 10), // Last 10 complaints
            stats: {
                totalComplaints,
                resolvedComplaints,
                pendingComplaints: complaints.filter(c => c.status === 'pending').length,
                inProgressComplaints: complaints.filter(c => c.status === 'in-progress').length,
                resolutionRate: totalComplaints > 0 
                    ? Math.round((resolvedComplaints / totalComplaints) * 100) 
                    : 0,
                avgResponseTime: 24, // In hours (example)
                satisfactionScore: 85 // Example score
            }
        };
        
        res.status(200).json({
            success: true,
            message: 'User details retrieved successfully',
            data: userDetails
        });
        
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user details'
        });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Update user
        Object.keys(updates).forEach(key => {
            if (key !== 'password' && key !== 'email') {
                user[key] = updates[key];
            }
        });
        
        await user.save();
        
        const updatedUser = await User.findById(id).select('-password');
        
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
        
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user'
        });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check if user has complaints
        const userComplaints = await UserComplaint.countDocuments({ user: id });
        
        if (userComplaints > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete user with ${userComplaints} complaints. Delete complaints first or anonymize them.`
            });
        }
        
        await User.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
};

// Bulk operations
export const bulkUpdateUsers = async (req, res) => {
    try {
        const { userIds, action, data } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs are required'
            });
        }
        
        let update = {};
        let message = '';
        
        switch (action) {
            case 'activate':
                update.isActive = true;
                message = 'Users activated successfully';
                break;
            case 'deactivate':
                update.isActive = false;
                message = 'Users deactivated successfully';
                break;
            case 'verify':
                update.isVerified = true;
                message = 'Users verified successfully';
                break;
            case 'change_role':
                if (!data || !data.role) {
                    return res.status(400).json({
                        success: false,
                        message: 'Role is required'
                    });
                }
                update.role = data.role;
                message = 'User roles updated successfully';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action'
                });
        }
        
        await User.updateMany(
            { _id: { $in: userIds } },
            { $set: update }
        );
        
        res.status(200).json({
            success: true,
            message
        });
        
    } catch (error) {
        console.error('Error in bulk update:', error);
        res.status(500).json({
            success: false,
            message: 'Error performing bulk operation'
        });
    }
};