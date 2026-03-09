import UserComplaint from "../models/UserComplaint.models.js";
import Staff from "../models/Staff.models.js"; 
import { logAudit, trackChanges } from "../middleware/auditLogger.js";
import NotificationService from "../services/notification.service.js";
import Department from "../models/Department.model.js";

// --- 1. Fetch ALL Complaints for Admin Dashboard (WORKSPACE LOCKED) ---
export const handleFetchAllUserIssues = async (req, res) => {
    try {
        const adminId = req.admin?._id || req.admin?.id;
        
        // 🚀 THE FIX: Instantly lock the filter to ONLY this admin's workspace
        let filter = { adminId: adminId };

        let { status, priority, category, assignedTo } = req.query;

        // Map frontend tabs to backend model status values
        if (status && status !== 'all') {
            let dbStatus = '';
            switch (status) {
                case 'New (Triage)': dbStatus = 'pending'; break;
                case 'Assigned': 
                case 'In-Progress': dbStatus = 'in-progress'; break;
                case 'On Hold': dbStatus = 'in-progress'; break; 
                case 'Resolved (Audit)': dbStatus = 'resolved'; break;
                case 'Rejected': dbStatus = 'rejected'; break;
                default: dbStatus = status.toLowerCase();
            }
            filter.status = dbStatus;
        }

        if (priority && priority !== 'all') filter.priority = priority;
        if (category && category !== 'all') filter.category = category;
        if (assignedTo && assignedTo !== 'all') {
            if (assignedTo === 'unassigned') {
                filter.assignedTo = { $exists: false };
            } else {
                filter.assignedTo = assignedTo;
            }
        }

        const issues = await UserComplaint.find(filter)
            .populate('user', 'name email') 
            .populate('assignedTo', 'name staffId') 
            .populate('department', 'name') 
            .populate('comments.staff', 'name staffId')
            .sort({ priority: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'All user complaints fetched successfully.',
            data: issues 
        });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching complaints.'
        });
    }
};

// --- 2. Fetch Staff List for Assignment Dropdowns (WORKSPACE LOCKED) ---
export const handleFetchStaffList = async (req, res) => {
    try {
        const adminId = req.admin?._id || req.admin?.id;
        const { departmentId } = req.query;
        
        // 🚀 THE FIX: Only fetch staff that belong to this Admin
        let query = { adminId: adminId };
        
        if (departmentId) {
            query.department = departmentId;
        }

        const staff = await Staff.find(query)
            .select('name email department role status avatar')
            .populate('department', 'name');
        
        res.status(200).json({
            success: true,
            count: staff.length,
            staff
        });
    } catch (error) {
        console.error('Error fetching staff list:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching staff list.'
        });
    }
};

// --- 3. Update/Alter Issue (WORKSPACE LOCKED) ---
export const handleUpdateIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, assignedTo, comments, department, category, title, description, rejectionReason } = req.body; 
        
        const adminId = req.admin?._id;

        // 🚀 THE FIX: Ensure the complaint they are trying to update actually belongs to them
        const complaint = await UserComplaint.findOne({ _id: id, adminId: adminId });
        
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found or you do not have permission to edit it.'
            });
        }
        
        const oldData = complaint.toObject();
        const updates = {};
        const activityLog = [];
        const oldStatus = complaint.status;
        const oldPriority = complaint.priority;

        if (status && complaint.status !== status) {
            updates.status = status;
            complaint.status = status;
            activityLog.push(`Status changed to ${status}`);

            // 🔔 Notify user about status change
            try {
                await NotificationService.notifyComplaintStatusChange(
                    complaint,
                    oldStatus,
                    status
                );
            } catch (notifError) {
                console.error('Failed to send status change notification:', notifError);
            }
        }

        if (priority && complaint.priority !== priority) {
            updates.priority = priority;
            complaint.priority = priority;
            activityLog.push(`Priority set to ${priority}`);

            // 🔔 Notify user about priority change
            try {
                await NotificationService.notifyPriorityChange(
                    complaint,
                    oldPriority,
                    priority,
                    complaint.user,
                    'User'
                );

                // Also notify assigned staff if exists
                if (complaint.assignedTo) {
                    await NotificationService.notifyPriorityChange(
                        complaint,
                        oldPriority,
                        priority,
                        complaint.assignedTo,
                        'Staff'
                    );
                }
            } catch (notifError) {
                console.error('Failed to send priority change notification:', notifError);
            }
        }

        if (assignedTo !== undefined) {
            const previousAssignment = complaint.assignedTo;
            complaint.assignedTo = assignedTo || null;
            updates.assignedTo = assignedTo;
            if (assignedTo) {
                activityLog.push(`Assigned to staff member`);
                if (complaint.status === 'pending') {
                    complaint.status = 'in-progress';
                    updates.status = 'in-progress';
                    activityLog.push('Auto-changed status to in-progress');
                }

                // 🔔 Notify staff about assignment
                try {
                    const staff = await Staff.findById(assignedTo);
                    if (staff) {
                        await NotificationService.notifyStaffAssignment(complaint, staff);
                    }
                } catch (notifError) {
                    console.error('Failed to send assignment notification:', notifError);
                }

                // 🔔 Notify user about assignment if it's a new assignment
                if (!previousAssignment) {
                    try {
                        const staff = await Staff.findById(assignedTo);
                        if (staff) {
                            await NotificationService.createNotification({
                                userId: complaint.user,
                                recipientType: 'User',
                                type: 'info',
                                title: 'Staff Assigned to Your Complaint',
                                message: `A staff member (${staff.name}) has been assigned to work on your complaint "${complaint.title}".`,
                                complaintId: complaint._id,
                                actionType: 'complaint_assigned',
                                metadata: {
                                    assignedToName: staff.name,
                                    complaintTitle: complaint.title
                                },
                                actionUrl: `/complaints/${complaint._id}`
                            });
                        }
                    } catch (notifError) {
                        console.error('Failed to send user assignment notification:', notifError);
                    }
                }
            } else {
                activityLog.push('Assignment removed');
            }
        }

        if (department !== undefined) {
            complaint.department = department || null;
            updates.department = department;
            if (department) {
                activityLog.push('Department assigned');

                // 🔔 Notify user about department assignment
                try {
                    const dept = await Department.findById(department);
                    if (dept) {
                        await NotificationService.notifyDepartmentAssignment(complaint, dept.name);
                    }
                } catch (notifError) {
                    console.error('Failed to send department assignment notification:', notifError);
                }
            }
        }

        if (category && complaint.category !== category) {
            complaint.category = category;
            updates.category = category;
            activityLog.push(`Category changed to ${category}`);
        }

        if (title && complaint.title !== title) {
            complaint.title = title;
            updates.title = title;
            activityLog.push('Title updated');
        }
        
        if (description && complaint.description !== description) {
            complaint.description = description;
            updates.description = description;
            activityLog.push('Description updated');
        }

        if (status === 'rejected' && rejectionReason) {
            complaint.comments.push({ 
                staff: adminId, 
                message: `[REJECTED]: ${rejectionReason}`,
                createdAt: new Date()
            });
            activityLog.push('Complaint rejected with reason');

            // 🔔 Notify user about rejection with reason
            try {
                await NotificationService.createNotification({
                    userId: complaint.user,
                    recipientType: 'User',
                    type: 'warning',
                    title: 'Complaint Rejected',
                    message: `Your complaint "${complaint.title}" has been rejected. Reason: ${rejectionReason}`,
                    complaintId: complaint._id,
                    actionType: 'complaint_rejected',
                    metadata: {
                        complaintTitle: complaint.title,
                        reason: rejectionReason
                    },
                    actionUrl: `/complaints/${complaint._id}`
                });
            } catch (notifError) {
                console.error('Failed to send rejection notification:', notifError);
            }
        }

        if (comments) {
            complaint.comments.push({ 
                staff: adminId, 
                message: `[ADMIN NOTE]: ${comments}`,
                createdAt: new Date()
            });
            updates.comments = comments;
            activityLog.push('Admin note added');

            // 🔔 Notify user about admin comment
            try {
                await NotificationService.createNotification({
                    userId: complaint.user,
                    recipientType: 'User',
                    type: 'update',
                    title: 'Admin Update on Your Complaint',
                    message: `An administrator has added a note to your complaint "${complaint.title}": ${comments.substring(0, 100)}${comments.length > 100 ? '...' : ''}`,
                    complaintId: complaint._id,
                    actionType: 'comment_added',
                    metadata: {
                        complaintTitle: complaint.title
                    },
                    actionUrl: `/complaints/${complaint._id}`
                });
            } catch (notifError) {
                console.error('Failed to send admin comment notification:', notifError);
            }
        }

        complaint.updatedAt = new Date();
        await complaint.save();
        
        await logAudit({
            actor: req.admin._id,
            actorModel: 'Admin',
            actorName: req.admin.name,
            actorEmail: req.admin.email,
            action: 'ISSUE_UPDATED',
            category: 'ISSUE_MANAGEMENT',
            severity: 'MEDIUM',
            targetModel: 'UserComplaint',
            targetId: complaint._id,
            targetName: complaint.title,
            description: `${req.admin.name} updated issue: ${complaint.title}`,
            changes: trackChanges(oldData, complaint.toObject()),
            metadata: { ipAddress: req.ip, userAgent: req.get('user-agent') }
        });
    
        await complaint.populate('user', 'name email phone');
        await complaint.populate('assignedTo', 'name staffId email');
        await complaint.populate('department', 'name');
        await complaint.populate('comments.staff', 'name staffId');

        res.json({
            success: true,
            message: 'Complaint updated successfully',
            data: complaint,
            updates: updates,
            activity: activityLog
        });

    } catch (error) {
        console.error('Error updating complaint:', error);
        res.status(500).json({ success: false, message: 'Error updating complaint' });
    }
};

// --- 4. Get single complaint details (WORKSPACE LOCKED) ---
export const handleGetComplaintDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin?._id;
        
        // 🚀 THE FIX: Ensure they can only view details of their own workspace's tickets
        const complaint = await UserComplaint.findOne({ _id: id, adminId: adminId })
            .populate('user', 'name email phone')
            .populate('assignedTo', 'name staffId email department')
            .populate('department', 'name')
            .populate('comments.staff', 'name staffId');

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found or access denied'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Complaint details fetched successfully',
            data: complaint
        });

    } catch (error) {
        console.error('Error fetching complaint details:', error);
        res.status(500).json({ success: false, message: 'Error fetching complaint details' });
    }
};

// --- 5. Bulk assign complaints to staff (WORKSPACE LOCKED) ---
export const handleBulkAssign = async (req, res) => {
    try {
        const { complaintIds, assignedTo } = req.body;
        const adminId = req.admin?._id;

        if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide complaint IDs to assign' });
        }
        if (!assignedTo) {
            return res.status(400).json({ success: false, message: 'Please specify staff member to assign' });
        }

        // 🚀 THE FIX: Only bulk update tickets that belong to this admin
        const result = await UserComplaint.updateMany(
            { _id: { $in: complaintIds }, adminId: adminId },
            { 
                $set: { 
                    assignedTo: assignedTo,
                    status: 'in-progress',
                    updatedAt: new Date()
                },
                $push: {
                    comments: {
                        staff: adminId,
                        message: `[BULK ASSIGNED]: Assigned to staff member`,
                        createdAt: new Date()
                    }
                }
            }
        );

        res.json({
            success: true,
            message: `Successfully assigned ${result.modifiedCount} complaints to staff`,
            data: { assignedCount: result.modifiedCount, assignedTo: assignedTo }
        });

    } catch (error) {
        console.error('Error in bulk assignment:', error);
        res.status(500).json({ success: false, message: 'Error during bulk assignment' });
    }
};

// --- 6. Get Issue Stats (WORKSPACE LOCKED) ---
export const getIssueStats = async (req, res) => {
    try {
        const adminId = req.admin?._id; // 🚀 GRAB THE ADMIN ID
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - 7);
        
        const thisMonthStart = new Date(today);
        thisMonthStart.setMonth(today.getMonth() - 1);
        
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        // 🚀 THE FIX: Inject { adminId } into EVERY single query
        const [
            total, pending, inProgress, resolved, rejected, highPriority, criticalPriority,
            todayCount, weekCount, monthCount, assigned, unassigned, overdue
        ] = await Promise.all([
            UserComplaint.countDocuments({ adminId }),
            UserComplaint.countDocuments({ adminId, status: 'pending' }),
            UserComplaint.countDocuments({ adminId, status: 'in-progress' }),
            UserComplaint.countDocuments({ adminId, status: 'resolved' }),
            UserComplaint.countDocuments({ adminId, status: 'rejected' }),
            UserComplaint.countDocuments({ adminId, priority: 'high' }),
            UserComplaint.countDocuments({ adminId, priority: 'critical' }),
            UserComplaint.countDocuments({ adminId, createdAt: { $gte: today } }),
            UserComplaint.countDocuments({ adminId, createdAt: { $gte: thisWeekStart } }),
            UserComplaint.countDocuments({ adminId, createdAt: { $gte: thisMonthStart } }),
            UserComplaint.countDocuments({ adminId, assignedTo: { $exists: true, $ne: null } }),
            UserComplaint.countDocuments({ adminId, assignedTo: { $exists: false } }),
            UserComplaint.countDocuments({
                adminId,
                status: { $nin: ['resolved', 'closed', 'rejected'] },
                createdAt: { $lt: sevenDaysAgo }
            })
        ]);

        res.json({
            success: true,
            message: "Issue statistics fetched successfully",
            data: {
                total, pending, inProgress, resolved, rejected, highPriority, criticalPriority,
                assigned, unassigned, overdue, today: todayCount, thisWeek: weekCount,
                thisMonth: monthCount, resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : '0.0'
            }
        });

    } catch (error) {
        console.error('❌ Error fetching issue stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching issue statistics', error: error.message });
    }
};