import Admin from "../models/Admin.models.js";
import UserComplaint from "../models/UserComplaint.models.js";
import Staff from "../models/Staff.models.js";
import User from "../models/User.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ==================== AUTHENTICATION ====================
export const adminLogin = async (req, res) => {
    try {
        const { adminId, email: emailField, password } = req.body;
        const email = adminId || emailField;

        console.log("🔐 Admin login attempt:", { email });

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Email and password are required" 
            });
        }

        const admin = await Admin.findOne({ email });
        
        if (!admin) {
            console.log("❌ Admin not found:", email);
            return res.status(401).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

        if (!admin.password) {
            console.log("❌ Admin password not set:", email);
            return res.status(401).json({ 
                success: false, 
                message: "Admin account not properly configured" 
            });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        
        if (!isMatch) {
            console.log("❌ Password mismatch for admin:", email);
            return res.status(401).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

        const payload = { 
            id: admin._id, 
            email: admin.email,
            name: admin.name,
            role: admin.role,
            department: admin.department
        };

        const accessToken = jwt.sign(
            payload, 
            process.env.ACCESS_TOKEN_SECRET, 
            { expiresIn: "15m" }
        );
        
        const refreshToken = jwt.sign(
            payload, 
            process.env.REFRESH_TOKEN_SECRET, 
            { expiresIn: "7d" }
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        console.log("✅ Admin login successful:", admin.email);

        res.status(200).json({
            success: true,
            message: "Admin login successful",
            accessToken,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                department: admin.department,
                permissions: admin.permissions
            }
        });

    } catch (err) {
        console.error("❌ Admin Login Error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Server error during admin login" 
        });
    }
};

// ==================== DASHBOARD ====================
export const getDashboardData = async (req, res) => {
    try {
        console.log("📊 Fetching dashboard data...");
        console.log("✅ Dashboard stats:", {
    totalComplaints,
    pendingComplaints,
    inProgressComplaints,
    resolvedComplaints,
    totalUsers,
    totalStaff
});

console.log("✅ Recent complaints count:", recentComplaints.length);
console.log("✅ Top staff count:", topStaff.length);
console.log("✅ Trend data count:", trendData.length);
        // Calculate date ranges
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Get all time statistics
        const [
            totalComplaints,
            pendingComplaints,
            inProgressComplaints,
            resolvedComplaints,
            totalUsers,
            totalStaff,
            todayComplaints,
            lastWeekComplaints,
            lastMonthComplaints
        ] = await Promise.all([
            UserComplaint.countDocuments(),
            UserComplaint.countDocuments({ status: 'pending' }),
            UserComplaint.countDocuments({ status: 'in-progress' }),
            UserComplaint.countDocuments({ status: 'resolved' }),
            User.countDocuments(),
            Staff.countDocuments({ isActive: true }),
            UserComplaint.countDocuments({
                createdAt: { 
                    $gte: new Date(today.setHours(0, 0, 0, 0)) 
                }
            }),
            UserComplaint.countDocuments({
                createdAt: { $gte: lastWeek }
            }),
            UserComplaint.countDocuments({
                createdAt: { $gte: lastMonth }
            })
        ]);

        // Calculate resolution rate
        const resolutionRate = totalComplaints > 0 
            ? Math.round((resolvedComplaints / totalComplaints) * 100) 
            : 0;

        // Calculate growth rates
        const weeklyGrowth = lastWeekComplaints > 0 
            ? Math.round(((todayComplaints - lastWeekComplaints) / lastWeekComplaints) * 100) 
            : 100;
        
        const monthlyGrowth = lastMonthComplaints > 0 
            ? Math.round(((todayComplaints - lastMonthComplaints) / lastMonthComplaints) * 100) 
            : 100;

        // Get recent complaints
        const recentComplaints = await UserComplaint.find()
            .populate('user', 'name email')
            .populate('assignedTo', 'name')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Get top performing staff
        const topStaff = await Staff.aggregate([
            {
                $lookup: {
                    from: 'usercomplaints',
                    localField: '_id',
                    foreignField: 'assignedTo',
                    as: 'assignedComplaints'
                }
            },
            {
                $addFields: {
                    resolvedCount: {
                        $size: {
                            $filter: {
                                input: '$assignedComplaints',
                                as: 'complaint',
                                cond: { $eq: ['$$complaint.status', 'resolved'] }
                            }
                        }
                    },
                    totalAssigned: { $size: '$assignedComplaints' }
                }
            },
            {
                $addFields: {
                    resolutionRate: {
                        $cond: [
                            { $gt: ['$totalAssigned', 0] },
                            { $multiply: [{ $divide: ['$resolvedCount', '$totalAssigned'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { resolutionRate: -1 } },
            { $limit: 5 },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    department: 1,
                    resolvedCount: 1,
                    totalAssigned: 1,
                    resolutionRate: { $round: ['$resolutionRate', 2] }
                }
            }
        ]);

        // Get complaint trends for last 7 days
        const trendData = await UserComplaint.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 },
                    resolved: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "resolved"] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { "_id": 1 } },
            {
                $project: {
                    date: "$_id",
                    complaints: "$count",
                    resolved: "$resolved",
                    _id: 0
                }
            }
        ]);

        // Fill in missing days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
            return date.toISOString().split('T')[0];
        });

        const filledTrendData = last7Days.map(date => {
            const existing = trendData.find(item => item.date === date);
            return existing || { 
                date, 
                complaints: 0, 
                resolved: 0 
            };
        });

        // Generate notifications
        const notifications = [
            {
                id: 1,
                type: 'warning',
                message: `${pendingComplaints} complaints pending assignment`,
                time: 'Just now',
                priority: 'high'
            },
            {
                id: 2,
                type: 'info',
                message: `System update scheduled for tonight at 2:00 AM`,
                time: '2 hours ago',
                priority: 'medium'
            },
            {
                id: 3,
                type: 'success',
                message: `New staff member "John Doe" has joined the team`,
                time: '1 day ago',
                priority: 'low'
            }
        ];

        // Prepare response
        const dashboardData = {
            stats: {
                totalComplaints,
                pending: pendingComplaints,
                inProgress: inProgressComplaints,
                resolved: resolvedComplaints,
                users: totalUsers,
                staff: totalStaff,
                today: todayComplaints,
                satisfaction: resolutionRate,
                weeklyGrowth,
                monthlyGrowth
            },
            trends: {
                daily: filledTrendData
            },
            performance: {
                resolutionRate,
                avgResolutionTime: 3.2,
                topPerformers: topStaff
            },
            recentActivity: recentComplaints.map(complaint => ({
                id: complaint._id,
                action: `Complaint "${complaint.title?.substring(0, 30)}..." ${complaint.status === 'resolved' ? 'resolved' : 'updated'}`,
                user: complaint.user?.name || 'Anonymous',
                time: formatTimeAgo(complaint.createdAt),
                type: complaint.status === 'resolved' ? 'resolved' : 'complaint'
            })),
            notifications
        };

        res.status(200).json({
            success: true,
            message: "Dashboard data fetched successfully",
            data: dashboardData
        });

    } catch (error) {
        console.error("❌ Dashboard Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching dashboard data"
        });
    }
};

// Get Real-time Stats
export const getRealTimeStats = async (req, res) => {
    try {
        const systemMetrics = {
            onlineUsers: Math.floor(Math.random() * 100) + 50,
            activeSessions: Math.floor(Math.random() * 50) + 10,
            systemLoad: Math.floor(Math.random() * 60) + 10,
            responseTime: (Math.random() * 5 + 1).toFixed(1),
            memoryUsage: Math.floor(Math.random() * 50) + 30
        };

        res.status(200).json({
            success: true,
            message: "Real-time stats fetched successfully",
            data: systemMetrics
        });

    } catch (error) {
        console.error("❌ Real-time Stats Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching real-time stats"
        });
    }
};

// Get Notifications
export const getNotifications = async (req, res) => {
    try {
        const notifications = [
            {
                id: 1,
                type: 'complaint',
                title: 'New Complaint Submitted',
                message: 'A new complaint about road maintenance has been submitted',
                time: '2 minutes ago',
                read: false
            },
            {
                id: 2,
                type: 'system',
                title: 'System Update',
                message: 'Scheduled maintenance tonight at 2:00 AM',
                time: '1 hour ago',
                read: true
            }
        ];

        res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: notifications
        });

    } catch (error) {
        console.error("❌ Notifications Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching notifications"
        });
    }
};

// Mark Notification as Read
export const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`📬 Marking notification ${id} as read`);
        
        res.status(200).json({
            success: true,
            message: "Notification marked as read successfully",
            data: {
                notificationId: id,
                read: true,
                readAt: new Date()
            }
        });

    } catch (error) {
        console.error("❌ Mark Notification Read Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while marking notification as read"
        });
    }
};

// Get Chart Data
export const getChartData = async (req, res) => {
    try {
        const { range = '7d' } = req.query;
        
        let days;
        switch (range) {
            case '1d': days = 1; break;
            case '7d': days = 7; break;
            case '30d': days = 30; break;
            case '90d': days = 90; break;
            default: days = 7;
        }

        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

        // Get complaints by day
        const complaintsByDay = await UserComplaint.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 },
                    resolved: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "resolved"] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { "_id": 1 } },
            {
                $project: {
                    day: "$_id",
                    complaints: "$count",
                    resolved: "$resolved",
                    _id: 0
                }
            }
        ]);

        // Fill missing days
        const dateRange = [];
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            dateRange.push(date.toISOString().split('T')[0]);
        }

        const filledData = dateRange.map(date => {
            const existing = complaintsByDay.find(item => item.day === date);
            return {
                day: formatDateForChart(date, days),
                complaints: existing?.count || 0,
                resolved: existing?.resolved || 0
            };
        });

        // Get department distribution
        const departmentData = await UserComplaint.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $project: {
                    name: "$_id",
                    value: "$count",
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            success: true,
            message: "Chart data fetched successfully",
            data: {
                dailyComplaints: filledData,
                departments: departmentData,
                period: range
            }
        });

    } catch (error) {
        console.error("❌ Chart Data Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching chart data"
        });
    }
};

// Admin Logout
export const adminLogout = async (req, res) => {
    try {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        res.status(200).json({
            success: true,
            message: "Admin logged out successfully"
        });

    } catch (error) {
        console.error("❌ Logout Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during logout"
        });
    }
};

// ==================== USER MANAGEMENT ====================

// Get All Users with Pagination and Filters
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Build query
        let query = {};
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status !== 'all') {
            query.isActive = status === 'active';
        }
        
        // Get users with pagination
        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            User.countDocuments(query)
        ]);
        
        // Get complaint counts for each user
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const complaintCount = await UserComplaint.countDocuments({ user: user._id });
                const resolvedCount = await UserComplaint.countDocuments({ 
                    user: user._id, 
                    status: 'resolved' 
                });
                
                return {
                    ...user,
                    stats: {
                        totalComplaints: complaintCount,
                        resolvedComplaints: resolvedCount,
                        pendingComplaints: complaintCount - resolvedCount
                    }
                };
            })
        );
        
        res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: {
                users: usersWithStats,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error("❌ Get All Users Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching users"
        });
    }
};

// Get User Details by ID
export const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get user
        const user = await User.findById(id).select('-password').lean();
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        // Get user's complaints
        const complaints = await UserComplaint.find({ user: id })
            .populate('assignedTo', 'name staffId')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
        
        // Get statistics
        const stats = {
            totalComplaints: complaints.length,
            resolved: complaints.filter(c => c.status === 'resolved').length,
            pending: complaints.filter(c => c.status === 'pending').length,
            inProgress: complaints.filter(c => c.status === 'in-progress').length,
            rejected: complaints.filter(c => c.status === 'rejected').length
        };
        
        res.status(200).json({
            success: true,
            message: "User details fetched successfully",
            data: {
                user,
                complaints,
                stats
            }
        });

    } catch (error) {
        console.error("❌ Get User Details Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching user details"
        });
    }
};

// ==================== STAFF MANAGEMENT ====================

// Get All Staff with Pagination and Filters
export const getAllStaff = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', department = 'all', status = 'all' } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Build query
        let query = {};
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { staffId: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (department !== 'all') {
            query.department = department;
        }
        
        if (status !== 'all') {
            query.isActive = status === 'active';
        }
        
        // Get staff with pagination
        const [staffMembers, total] = await Promise.all([
            Staff.find(query)
                .select('-password')
                .populate('department', 'name')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            Staff.countDocuments(query)
        ]);
        
        // Get performance stats for each staff member
        const staffWithStats = await Promise.all(
            staffMembers.map(async (staff) => {
                const assignedCount = await UserComplaint.countDocuments({ assignedTo: staff._id });
                const resolvedCount = await UserComplaint.countDocuments({ 
                    assignedTo: staff._id, 
                    status: 'resolved' 
                });
                const pendingCount = await UserComplaint.countDocuments({ 
                    assignedTo: staff._id, 
                    status: 'pending' 
                });
                const inProgressCount = await UserComplaint.countDocuments({ 
                    assignedTo: staff._id, 
                    status: 'in-progress' 
                });
                
                return {
                    ...staff,
                    stats: {
                        totalAssigned: assignedCount,
                        resolved: resolvedCount,
                        pending: pendingCount,
                        inProgress: inProgressCount,
                        resolutionRate: assignedCount > 0 ? 
                            ((resolvedCount / assignedCount) * 100).toFixed(1) : '0.0'
                    }
                };
            })
        );
        
        res.status(200).json({
            success: true,
            message: "Staff members fetched successfully",
            data: {
                staff: staffWithStats,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error("❌ Get All Staff Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching staff"
        });
    }
};

// Get Staff Details by ID
export const getStaffDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get staff member
        const staff = await Staff.findById(id)
            .select('-password')
            .populate('department', 'name')
            .lean();
        
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found"
            });
        }
        
        // Get assigned complaints
        const complaints = await UserComplaint.find({ assignedTo: id })
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
        
        // Calculate performance metrics
        const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
        
        let avgResolutionTime = 0;
        if (resolvedComplaints.length > 0) {
            const totalTime = resolvedComplaints.reduce((sum, complaint) => {
                const created = new Date(complaint.createdAt);
                const resolved = new Date(complaint.updatedAt);
                return sum + (resolved - created);
            }, 0);
            avgResolutionTime = (totalTime / resolvedComplaints.length) / (1000 * 60 * 60 * 24); // in days
        }
        
        const stats = {
            totalAssigned: complaints.length,
            resolved: resolvedComplaints.length,
            pending: complaints.filter(c => c.status === 'pending').length,
            inProgress: complaints.filter(c => c.status === 'in-progress').length,
            rejected: complaints.filter(c => c.status === 'rejected').length,
            resolutionRate: complaints.length > 0 ? 
                ((resolvedComplaints.length / complaints.length) * 100).toFixed(1) : '0.0',
            avgResolutionTime: avgResolutionTime.toFixed(1)
        };
        
        res.status(200).json({
            success: true,
            message: "Staff details fetched successfully",
            data: {
                staff,
                complaints,
                stats
            }
        });

    } catch (error) {
        console.error("❌ Get Staff Details Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching staff details"
        });
    }
};

// ==================== HELPER FUNCTIONS ====================

const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    
    return new Date(date).toLocaleDateString();
};

const formatDateForChart = (dateString, days) => {
    const date = new Date(dateString);
    if (days <= 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (days <= 30) {
        return date.getDate().toString();
    } else {
        return date.toLocaleDateString('en-US', { month: 'short' });
    }
};