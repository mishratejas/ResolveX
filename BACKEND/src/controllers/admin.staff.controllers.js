import mongoose from "mongoose"; // 🚀 Added to support aggregation matching
import Staff from "../models/Staff.models.js";
import Department from "../models/Department.model.js";
import UserComplaint from "../models/UserComplaint.models.js";

// Get all staff with stats (WORKSPACE LOCKED)
export const getAllStaff = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id;
        const { page = 1, limit = 20, search = '', department = '', status = '' } = req.query;
        
        const query = { adminId: currentAdminId };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { staffId: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (department) {
            const dept = await Department.findOne({ name: department, adminId: currentAdminId });
            if (dept) query.department = dept._id;
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
        
        const staffWithStats = await Promise.all(
            staff.map(async (staffMember) => {
                const assignedComplaints = await UserComplaint.find({ 
                    assignedTo: staffMember._id,
                    adminId: currentAdminId 
                });
                const resolvedComplaints = assignedComplaints.filter(c => c.status === 'resolved');
                
                let resolutionRate = 0;
                if (assignedComplaints.length > 0) {
                    resolutionRate = Math.round((resolvedComplaints.length / assignedComplaints.length) * 100);
                }
                
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
                pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
            }
        });
        
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ success: false, message: 'Error fetching staff data' });
    }
};

// Get staff statistics (WORKSPACE LOCKED)
export const getStaffStats = async (req, res) => {
    try {
        const adminId = req.admin?._id || req.admin?.id;

        // 🚀 THE FIX: Pass adminId to all countDocuments
        const totalStaff = await Staff.countDocuments({ adminId });
        const activeStaff = await Staff.countDocuments({ adminId, isActive: true });
        const inactiveStaff = await Staff.countDocuments({ adminId, isActive: false });
        
        // Department distribution
        const departmentStats = await Staff.aggregate([
            { $match: { adminId: new mongoose.Types.ObjectId(adminId) } }, // 🚀 THE FIX
            {
                $lookup: {
                    from: 'departments',
                    localField: 'department',
                    foreignField: '_id',
                    as: 'dept'
                }
            },
            { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
            { $group: { _id: '$dept.name', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        // Performance distribution
        const performanceStats = await UserComplaint.aggregate([
            { $match: { adminId: new mongoose.Types.ObjectId(adminId), assignedTo: { $exists: true, $ne: null } } }, // 🚀 THE FIX
            {
                $group: {
                    _id: '$assignedTo',
                    total: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
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
                    highPerformers: { $sum: { $cond: [{ $gte: ['$resolutionRate', 80] }, 1, 0] } },
                    mediumPerformers: {
                        $sum: { $cond: [
                            { $and: [ { $lt: ['$resolutionRate', 80] }, { $gte: ['$resolutionRate', 50] } ]}, 1, 0
                        ]}
                    },
                    lowPerformers: { $sum: { $cond: [{ $lt: ['$resolutionRate', 50] }, 1, 0] } }
                }
            }
        ]);
        
        // 🚀 THE FIX: Only fetch departments for this admin
        const departments = await Department.find({ adminId }).select('name');
        
        const stats = {
            total: totalStaff, active: activeStaff, inactive: inactiveStaff,
            departments: departmentStats, departmentList: departments,
            performance: performanceStats[0] || { avgResolutionRate: 0, highPerformers: 0, mediumPerformers: 0, lowPerformers: 0 }
        };
        
        res.status(200).json({ success: true, message: 'Staff statistics retrieved successfully', data: stats });
        
    } catch (error) {
        console.error('Error fetching staff stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching staff statistics', error: error.message });
    }
};

// Get single staff member details (WORKSPACE LOCKED)
export const getStaffDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin?._id || req.admin?.id;
        
        // 🚀 THE FIX: Ensure the staff member belongs to this admin
        const staff = await Staff.findOne({ _id: id, adminId })
            .populate('department', 'name category')
            .select('-password');
        
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff member not found or access denied' });
        }
        
        // 🚀 THE FIX: Ensure complaints belong to this admin
        const complaints = await UserComplaint.find({ assignedTo: id, adminId })
            .populate('user', 'name email')
            .populate('department', 'name')
            .sort({ createdAt: -1 })
            .limit(20);
        
        const totalAssigned = complaints.length;
        const resolved = complaints.filter(c => c.status === 'resolved').length;
        const pending = complaints.filter(c => c.status === 'pending').length;
        const inProgress = complaints.filter(c => c.status === 'in-progress').length;
        
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
                totalAssigned, resolved, pending, inProgress,
                resolutionRate: totalAssigned > 0 ? Math.round((resolved / totalAssigned) * 100) : 0,
                avgResolutionTime,
                performanceScore: totalAssigned > 0 ? Math.round(((resolved / totalAssigned) * 70) + ((avgResolutionTime < 7 ? 30 : 15))) : 0
            }
        };
        
        res.status(200).json({ success: true, message: 'Staff details retrieved successfully', data: staffDetails });
        
    } catch (error) {
        console.error('Error fetching staff details:', error);
        res.status(500).json({ success: false, message: 'Error fetching staff details' });
    }
};

export const createStaff = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id || req.user?.id;
        const { name, email, password, phone, staffId, department, role = 'staff', isActive } = req.body;
        
        const existingStaff = await Staff.findOne({ $or: [{ email }, { staffId }] });
        
        if (existingStaff) {
            return res.status(400).json({ success: false, message: 'Staff member with this email or ID already exists' });
        }
        
        let departmentId = null;
        if (department) {
            // 🚀 THE FIX: Ensure the department belongs to this admin!
            const dept = await Department.findOne({ _id: department, adminId: currentAdminId });
            if (!dept) {
                return res.status(400).json({ success: false, message: 'Invalid department specified for your workspace' });
            }
            departmentId = dept._id;
        }
        
        const newStaff = new Staff({
            name, email, password, phone, staffId, department: departmentId, role,
            isActive: isActive !== undefined ? isActive : true,
            adminId: currentAdminId, 
            isApproved: true 
        });
        
        await newStaff.save();
        
        const populatedStaff = await Staff.findById(newStaff._id).populate('department', 'name category');
        res.status(201).json({ success: true, message: 'Staff member created and approved successfully', data: populatedStaff });
        
    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({ success: false, message: 'Error creating staff member' });
    }
};

export const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin?._id || req.admin?.id;
        const { name, email, phone, department, password, isActive } = req.body;

        // 🚀 THE FIX: Ensure admin owns this staff member
        const staffMember = await Staff.findOne({ _id: id, adminId });
        if (!staffMember) {
            return res.status(404).json({ success: false, message: 'Staff member not found or access denied' });
        }

        if (department && staffMember.department?.toString() !== department.toString()) {
            // 🚀 THE FIX: Ensure department belongs to admin
            const dept = await Department.findOne({ _id: department, adminId });
            if (!dept) {
                return res.status(400).json({ success: false, message: 'Invalid department specified' });
            }

            await UserComplaint.updateMany(
                { assignedTo: staffMember._id, adminId, status: { $in: ['pending', 'in-progress'] } },
                { $set: { assignedTo: null, status: 'pending' } }
            );
            staffMember.department = dept._id;
        }

        if (name) staffMember.name = name;
        if (email) staffMember.email = email;
        if (phone !== undefined) staffMember.phone = phone;
        if (isActive !== undefined) staffMember.isActive = isActive;
        
        if (password && password.trim() !== '') {
            staffMember.password = password; 
        }

        await staffMember.save();
        const updatedStaff = await Staff.findById(id).populate('department', 'name category');

        res.status(200).json({ success: true, message: 'Staff member updated successfully', data: updatedStaff });

    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({ success: false, message: 'Server error while updating staff member' });
    }
};

export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin?._id || req.admin?.id;
        
        // 🚀 THE FIX: Find by ID AND adminId
        const staff = await Staff.findOne({ _id: id, adminId });
        
        if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found or access denied' });
        
        const activeComplaints = await UserComplaint.countDocuments({ 
            assignedTo: id,
            adminId,
            status: { $in: ['pending', 'in-progress'] }
        });
        
        if (activeComplaints > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete: Staff member has ${activeComplaints} active complaint(s). Reassign them first.`
            });
        }
        
        await Staff.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Staff member deleted successfully' });
        
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ success: false, message: 'Error deleting staff member' });
    }
};

// Bulk operations (WORKSPACE LOCKED)
export const bulkActivateStaff = async (req, res) => {
    try {
        const { staffIds } = req.body;
        const adminId = req.admin?._id || req.admin?.id;
        
        await Staff.updateMany(
            { _id: { $in: staffIds }, adminId }, // 🚀 THE FIX
            { isActive: true }
        );
        res.status(200).json({ success: true, message: 'Staff members activated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error activating staff members' });
    }
};

export const bulkDeactivateStaff = async (req, res) => {
    try {
        const { staffIds } = req.body;
        const adminId = req.admin?._id || req.admin?.id;
        
        await Staff.updateMany(
            { _id: { $in: staffIds }, adminId }, // 🚀 THE FIX
            { isActive: false }
        );
        res.status(200).json({ success: true, message: 'Staff members deactivated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deactivating staff members' });
    }
};

// Get top performers (WORKSPACE LOCKED)
export const getTopPerformers = async (req, res) => {
    try {
        const adminId = req.admin?._id || req.admin?.id;

        const topPerformers = await UserComplaint.aggregate([
            { $match: { adminId: new mongoose.Types.ObjectId(adminId), assignedTo: { $exists: true, $ne: null } } }, // 🚀 THE FIX
            {
                $group: {
                    _id: '$assignedTo',
                    totalAssigned: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
                }
            },
            {
                $addFields: {
                    resolutionRate: {
                        $cond: [
                            { $gt: ['$totalAssigned', 0] },
                            { $multiply: [{ $divide: ['$resolved', '$totalAssigned'] }, 100] }, 0
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
        
        const performersWithDept = await Promise.all(
            topPerformers.map(async (performer) => {
                if (performer.department) {
                    const dept = await Department.findById(performer.department);
                    return { ...performer, department: dept ? dept.name : 'N/A' };
                }
                return performer;
            })
        );
        
        res.status(200).json({ success: true, message: 'Top performers retrieved successfully', data: performersWithDept });
        
    } catch (error) {
        console.error('Error fetching top performers:', error);
        res.status(500).json({ success: false, message: 'Error fetching top performers' });
    }
};