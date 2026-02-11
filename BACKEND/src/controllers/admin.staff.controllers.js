import Staff from "../models/Staff.models.js";
import Department from "../models/Department.model.js";
import UserComplaint from "../models/UserComplaint.models.js";

// Get all staff with stats
export const getAllStaff = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', department = '', status = '' } = req.query;
        
        const query = {};
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { staffId: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (department) {
            const dept = await Department.findOne({ name: department });
            if (dept) {
                query.department = dept._id;
            }
        }
        
        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }
        
        const skip = (page - 1) * limit;
        
        const staff = await Staff.find(query)
            .populate('department', 'name category')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        
        const total = await Staff.countDocuments(query);
        
        // Get performance stats for each staff
        const staffWithStats = await Promise.all(
            staff.map(async (staffMember) => {
                const assignedComplaints = await UserComplaint.find({ assignedTo: staffMember._id });
                const resolvedComplaints = assignedComplaints.filter(c => c.status === 'resolved');
                
                let resolutionRate = 0;
                if (assignedComplaints.length > 0) {
                    resolutionRate = Math.round((resolvedComplaints.length / assignedComplaints.length) * 100);
                }
                
                // Calculate average resolution time
                let avgResolutionTime = 0;
                if (resolvedComplaints.length > 0) {
                    const totalTime = resolvedComplaints.reduce((sum, complaint) => {
                        const created = new Date(complaint.createdAt);
                        const resolved = new Date(complaint.updatedAt);
                        return sum + (resolved - created);
                    }, 0);
                    avgResolutionTime = Math.round((totalTime / resolvedComplaints.length) / (1000 * 60 * 60 * 24) * 10) / 10;
                }
                
                return {
                    ...staffMember.toObject(),
                    stats: {
                        totalAssigned: assignedComplaints.length,
                        resolved: resolvedComplaints.length,
                        pending: assignedComplaints.filter(c => c.status === 'pending').length,
                        inProgress: assignedComplaints.filter(c => c.status === 'in-progress').length,
                        resolutionRate,
                        avgResolutionTime
                    }
                };
            })
        );
        
        res.status(200).json({
            success: true,
            message: 'Staff list retrieved successfully',
            data: {
                staff: staffWithStats,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching staff data'
        });
    }
};

// Get staff statistics
// ✅ ADD THIS FUNCTION - It was missing but referenced in routes
export const getStaffStats = async (req, res) => {
    try {
        const totalStaff = await Staff.countDocuments();
        const activeStaff = await Staff.countDocuments({ isActive: true });
        const inactiveStaff = await Staff.countDocuments({ isActive: false });
        
        // Department distribution
        const departmentStats = await Staff.aggregate([
            {
                $lookup: {
                    from: 'departments',
                    localField: 'department',
                    foreignField: '_id',
                    as: 'dept'
                }
            },
            { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$dept.name',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Performance distribution
        const performanceStats = await UserComplaint.aggregate([
            { $match: { assignedTo: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$assignedTo',
                    total: { $sum: 1 },
                    resolved: {
                        $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
                    }
                }
            },
            {
                $addFields: {
                    resolutionRate: {
                        $cond: [
                            { $gt: ['$total', 0] },
                            { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] },
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgResolutionRate: { $avg: '$resolutionRate' },
                    highPerformers: {
                        $sum: { $cond: [{ $gte: ['$resolutionRate', 80] }, 1, 0] }
                    },
                    mediumPerformers: {
                        $sum: { $cond: [
                            { $and: [
                                { $lt: ['$resolutionRate', 80] },
                                { $gte: ['$resolutionRate', 50] }
                            ]},
                            1,
                            0
                        ]}
                    },
                    lowPerformers: {
                        $sum: { $cond: [{ $lt: ['$resolutionRate', 50] }, 1, 0] }
                    }
                }
            }
        ]);
        
        // Get department names list
        const departments = await Department.find().select('name');
        
        const stats = {
            total: totalStaff,
            active: activeStaff,
            inactive: inactiveStaff,
            departments: departmentStats,
            departmentList: departments,
            performance: performanceStats[0] || {
                avgResolutionRate: 0,
                highPerformers: 0,
                mediumPerformers: 0,
                lowPerformers: 0
            }
        };
        
        res.status(200).json({
            success: true,
            message: 'Staff statistics retrieved successfully',
            data: stats
        });
        
    } catch (error) {
        console.error('Error fetching staff stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching staff statistics',
            error: error.message
        });
    }
};

// ✅ NEW: Get single staff member details
export const getStaffDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const staff = await Staff.findById(id)
            .populate('department', 'name category')
            .select('-password');
        
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }
        
        // Get staff's complaint history
        const complaints = await UserComplaint.find({ assignedTo: id })
            .populate('user', 'name email')
            .populate('department', 'name')
            .sort({ createdAt: -1 })
            .limit(20);
        
        // Calculate detailed stats
        const totalAssigned = complaints.length;
        const resolved = complaints.filter(c => c.status === 'resolved').length;
        const pending = complaints.filter(c => c.status === 'pending').length;
        const inProgress = complaints.filter(c => c.status === 'in-progress').length;
        
        // Calculate average resolution time
        const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
        let avgResolutionTime = 0;
        if (resolvedComplaints.length > 0) {
            const totalTime = resolvedComplaints.reduce((sum, complaint) => {
                const created = new Date(complaint.createdAt);
                const resolved = new Date(complaint.updatedAt);
                return sum + (resolved - created);
            }, 0);
            avgResolutionTime = Math.round((totalTime / resolvedComplaints.length) / (1000 * 60 * 60 * 24) * 10) / 10;
        }
        
        const staffDetails = {
            ...staff.toObject(),
            recentComplaints: complaints.slice(0, 10),
            stats: {
                totalAssigned,
                resolved,
                pending,
                inProgress,
                resolutionRate: totalAssigned > 0 ? Math.round((resolved / totalAssigned) * 100) : 0,
                avgResolutionTime,
                performanceScore: totalAssigned > 0 ? Math.round(((resolved / totalAssigned) * 70) + ((avgResolutionTime < 7 ? 30 : 15))) : 0
            }
        };
        
        res.status(200).json({
            success: true,
            message: 'Staff details retrieved successfully',
            data: staffDetails
        });
        
    } catch (error) {
        console.error('Error fetching staff details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching staff details'
        });
    }
};

// Create new staff (admin only)
export const createStaff = async (req, res) => {
    try {
        const { name, email, password, phone, staffId, department, role = 'staff' } = req.body;
        
        // Check if staff already exists
        const existingStaff = await Staff.findOne({
            $or: [{ email }, { staffId }]
        });
        
        if (existingStaff) {
            return res.status(400).json({
                success: false,
                message: 'Staff member with this email or ID already exists'
            });
        }
        
        // Validate department
        let departmentId = null;
        if (department) {
            const dept = await Department.findOne({ name: department });
            if (!dept) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid department specified'
                });
            }
            departmentId = dept._id;
        }
        
        const newStaff = new Staff({
            name,
            email,
            password, // Note: Password should be hashed in the model's pre-save hook
            phone,
            staffId,
            department: departmentId,
            role,
            isActive: true
        });
        
        await newStaff.save();
        
        const populatedStaff = await Staff.findById(newStaff._id)
            .populate('department', 'name category');
        
        res.status(201).json({
            success: true,
            message: 'Staff member created successfully',
            data: populatedStaff
        });
        
    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating staff member'
        });
    }
};

// Update staff
export const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const staff = await Staff.findById(id);
        
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }
        
        // Handle department update
        if (updates.department) {
            const dept = await Department.findOne({ name: updates.department });
            if (dept) {
                updates.department = dept._id;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid department specified'
                });
            }
        }
        
        // Update staff
        Object.keys(updates).forEach(key => {
            if (key !== 'password') {
                staff[key] = updates[key];
            }
        });
        
        // Handle password update separately
        if (updates.password) {
            staff.password = updates.password;
        }
        
        await staff.save();
        
        const updatedStaff = await Staff.findById(id)
            .populate('department', 'name category')
            .select('-password');
        
        res.status(200).json({
            success: true,
            message: 'Staff member updated successfully',
            data: updatedStaff
        });
        
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating staff member'
        });
    }
};

// Delete staff
export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        
        const staff = await Staff.findById(id);
        
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }
        
        // Check if staff has assigned complaints
        const assignedComplaints = await UserComplaint.countDocuments({ assignedTo: id });
        
        if (assignedComplaints > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete staff member with ${assignedComplaints} assigned complaints. Reassign complaints first.`
            });
        }
        
        await Staff.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: 'Staff member deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting staff member'
        });
    }
};

// Bulk operations
export const bulkActivateStaff = async (req, res) => {
    try {
        const { staffIds } = req.body;
        
        await Staff.updateMany(
            { _id: { $in: staffIds } },
            { isActive: true }
        );
        
        res.status(200).json({
            success: true,
            message: 'Staff members activated successfully'
        });
        
    } catch (error) {
        console.error('Error activating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error activating staff members'
        });
    }
};

export const bulkDeactivateStaff = async (req, res) => {
    try {
        const { staffIds } = req.body;
        
        await Staff.updateMany(
            { _id: { $in: staffIds } },
            { isActive: false }
        );
        
        res.status(200).json({
            success: true,
            message: 'Staff members deactivated successfully'
        });
        
    } catch (error) {
        console.error('Error deactivating staff:', error);
        res.status(500).json({
            success: false,
            message: 'Error deactivating staff members'
        });
    }
};

// Get top performers
export const getTopPerformers = async (req, res) => {
    try {
        const topPerformers = await UserComplaint.aggregate([
            { $match: { assignedTo: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$assignedTo',
                    totalAssigned: { $sum: 1 },
                    resolved: {
                        $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
                    }
                }
            },
            {
                $addFields: {
                    resolutionRate: {
                        $cond: [
                            { $gt: ['$totalAssigned', 0] },
                            { $multiply: [{ $divide: ['$resolved', '$totalAssigned'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { resolutionRate: -1, totalAssigned: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'staff',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'staffInfo'
                }
            },
            { $unwind: '$staffInfo' },
            {
                $project: {
                    _id: '$staffInfo._id',
                    name: '$staffInfo.name',
                    email: '$staffInfo.email',
                    staffId: '$staffInfo.staffId',
                    department: '$staffInfo.department',
                    totalAssigned: 1,
                    resolved: 1,
                    resolutionRate: { $round: ['$resolutionRate', 1] }
                }
            }
        ]);
        
        // Populate department names
        const performersWithDept = await Promise.all(
            topPerformers.map(async (performer) => {
                if (performer.department) {
                    const dept = await Department.findById(performer.department);
                    return {
                        ...performer,
                        department: dept ? dept.name : 'N/A'
                    };
                }
                return performer;
            })
        );
        
        res.status(200).json({
            success: true,
            message: 'Top performers retrieved successfully',
            data: performersWithDept
        });
        
    } catch (error) {
        console.error('Error fetching top performers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching top performers'
        });
    }
};
