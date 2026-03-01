// src/controllers/issue_assignment.controllers.js
import UserComplaint from "../models/UserComplaint.models.js";
import Staff from "../models/Staff.models.js";
import User from "../models/User.models.js";
import Department from "../models/Department.model.js";
import AuditLog from "../models/AuditLog.models.js";
import Notification from "../models/Notification.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { sendEmail } from "../utils/email.js";

// ==================== ASSIGN ISSUE TO STAFF ====================

export const assignIssueToStaff = asyncHandler(async (req, res) => {
    const { issueId } = req.params;
    const { staffId, priority, notes } = req.body;

    if (!req.admin) {
        throw new ApiError(403, "Only admins can assign issues");
    }

    // Verify issue exists
    const issue = await UserComplaint.findById(issueId)
        .populate('user', 'name email')
        .populate('assignedTo', 'name email');

    if (!issue) {
        throw new ApiError(404, "Issue not found");
    }

    // Verify staff exists
    const staff = await Staff.findById(staffId)
        .populate('department', 'name');

    if (!staff) {
        throw new ApiError(404, "Staff member not found");
    }

    if (!staff.isActive) {
        throw new ApiError(400, "Staff member is not active");
    }

    // Store old assignment for audit log
    const oldAssignment = {
        staffId: issue.assignedTo?._id,
        staffName: issue.assignedTo?.name,
        priority: issue.priority
    };

    // Update issue
    issue.assignedTo = staffId;
    issue.department = staff.department?._id;
    
    if (priority) {
        issue.priority = priority;
    }

    if (issue.status === 'pending') {
        issue.status = 'in-progress';
    }

    // Add assignment comment
    issue.comments.push({
        staff: req.admin._id,
        message: notes || `Issue assigned to ${staff.name}`,
        createdAt: new Date()
    });

    await issue.save();

    // Create audit log
    await AuditLog.createLog({
        actor: req.admin._id,
        actorModel: 'Admin',
        actorName: req.admin.name,
        actorEmail: req.admin.email,
        actorRole: req.admin.role,
        action: oldAssignment.staffId ? 'ISSUE_REASSIGNED' : 'ISSUE_ASSIGNED',
        category: 'ISSUE_MANAGEMENT',
        severity: priority === 'critical' ? 'HIGH' : 'MEDIUM',
        status: 'SUCCESS',
        targetModel: 'UserComplaint',
        targetId: issue._id,
        targetName: issue.title,
        description: oldAssignment.staffId 
            ? `Issue reassigned from ${oldAssignment.staffName} to ${staff.name}`
            : `Issue assigned to ${staff.name}`,
        changes: {
            before: {
                assignedTo: oldAssignment.staffId,
                priority: oldAssignment.priority
            },
            after: {
                assignedTo: staffId,
                priority: issue.priority
            }
        },
        metadata: {
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            endpoint: req.originalUrl,
            method: req.method
        }
    });

    // Create notification for staff
    await Notification.create({
        recipient: staffId,
        recipientModel: 'Staff',
        type: 'issue_assigned',
        title: 'New Issue Assigned',
        message: `You have been assigned to issue: ${issue.title}`,
        data: {
            issueId: issue._id,
            issueTitle: issue.title,
            priority: issue.priority,
            category: issue.category,
            assignedBy: req.admin.name
        },
        priority: issue.priority === 'critical' ? 'high' : 'normal'
    });

    // Create notification for user
    await Notification.create({
        recipient: issue.user._id,
        recipientModel: 'User',
        type: 'issue_assigned',
        title: 'Your Issue Has Been Assigned',
        message: `Your issue "${issue.title}" has been assigned to ${staff.name}`,
        data: {
            issueId: issue._id,
            staffName: staff.name,
            department: staff.department?.name
        }
    });

    // Send email notification to staff
    try {
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">New Issue Assigned to You</h2>
                <p>Hello ${staff.name},</p>
                <p>A new issue has been assigned to you:</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1f2937;">${issue.title}</h3>
                    <p><strong>Category:</strong> ${issue.category}</p>
                    <p><strong>Priority:</strong> <span style="color: ${getPriorityColor(issue.priority)}; font-weight: bold;">${issue.priority.toUpperCase()}</span></p>
                    <p><strong>Status:</strong> ${issue.status}</p>
                    <p><strong>Description:</strong> ${issue.description.substring(0, 200)}${issue.description.length > 200 ? '...' : ''}</p>
                </div>
                
                ${notes ? `<p><strong>Assignment Notes:</strong> ${notes}</p>` : ''}
                
                <p>Please log in to the system to view more details and take action.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px;">This is an automated notification from ResolveX</p>
                </div>
            </div>
        `;

        await sendEmail(
            staff.email,
            `New Issue Assigned: ${issue.title}`,
            `New issue assigned to you: ${issue.title}`,
            emailHtml
        );
    } catch (emailError) {
        console.error('Error sending assignment email:', emailError);
        // Don't fail the request if email fails
    }

    // Emit socket event
    if (global.io) {
        // Notify staff
        global.io.to(staffId.toString()).emit('issue_assigned', {
            issueId: issue._id,
            title: issue.title,
            priority: issue.priority,
            category: issue.category,
            assignedBy: req.admin.name
        });

        // Notify user
        global.io.to(issue.user._id.toString()).emit('issue_updated', {
            issueId: issue._id,
            status: issue.status,
            assignedTo: staff.name
        });

        // Broadcast to complaint room
        global.io.to(`complaint_${issue._id}`).emit('complaint_assigned', {
            staffName: staff.name,
            staffId: staff._id,
            timestamp: new Date()
        });
    }

    res.status(200).json(
        new ApiResponse(200, {
            issue: {
                id: issue._id,
                title: issue.title,
                status: issue.status,
                priority: issue.priority,
                assignedTo: {
                    id: staff._id,
                    name: staff.name,
                    email: staff.email,
                    department: staff.department?.name
                }
            }
        }, "Issue assigned successfully")
    );
});

// ==================== BULK ASSIGN ISSUES ====================

export const bulkAssignIssues = asyncHandler(async (req, res) => {
    const { issueIds, staffId, priority } = req.body;

    if (!req.admin) {
        throw new ApiError(403, "Only admins can assign issues");
    }

    if (!issueIds || !Array.isArray(issueIds) || issueIds.length === 0) {
        throw new ApiError(400, "Issue IDs array is required");
    }

    if (!staffId) {
        throw new ApiError(400, "Staff ID is required");
    }

    // Verify staff exists
    const staff = await Staff.findById(staffId).populate('department', 'name');
    if (!staff) {
        throw new ApiError(404, "Staff member not found");
    }

    if (!staff.isActive) {
        throw new ApiError(400, "Staff member is not active");
    }

    const results = {
        success: [],
        failed: []
    };

    // Process each issue
    for (const issueId of issueIds) {
        try {
            const issue = await UserComplaint.findById(issueId).populate('user', 'name email');
            
            if (!issue) {
                results.failed.push({
                    issueId,
                    reason: 'Issue not found'
                });
                continue;
            }

            // Update issue
            const oldStaffId = issue.assignedTo;
            issue.assignedTo = staffId;
            issue.department = staff.department?._id;
            
            if (priority) {
                issue.priority = priority;
            }

            if (issue.status === 'pending') {
                issue.status = 'in-progress';
            }

            issue.comments.push({
                staff: req.admin._id,
                message: `Bulk assigned to ${staff.name}`,
                createdAt: new Date()
            });

            await issue.save();

            // Create notification for staff
            await Notification.create({
                recipient: staffId,
                recipientModel: 'Staff',
                type: 'issue_assigned',
                title: 'New Issue Assigned',
                message: `Issue assigned: ${issue.title}`,
                data: {
                    issueId: issue._id,
                    issueTitle: issue.title,
                    priority: issue.priority
                }
            });

            // Emit socket event
            if (global.io) {
                global.io.to(staffId.toString()).emit('issue_assigned', {
                    issueId: issue._id,
                    title: issue.title,
                    priority: issue.priority
                });
            }

            results.success.push({
                issueId: issue._id,
                title: issue.title
            });

        } catch (error) {
            results.failed.push({
                issueId,
                reason: error.message
            });
        }
    }

    // Create audit log for bulk action
    await AuditLog.createLog({
        actor: req.admin._id,
        actorModel: 'Admin',
        actorName: req.admin.name,
        actorEmail: req.admin.email,
        actorRole: req.admin.role,
        action: 'ISSUE_BULK_UPDATE',
        category: 'ISSUE_MANAGEMENT',
        severity: 'HIGH',
        status: 'SUCCESS',
        description: `Bulk assigned ${results.success.length} issues to ${staff.name}`,
        metadata: {
            successCount: results.success.length,
            failedCount: results.failed.length,
            staffId: staff._id,
            staffName: staff.name
        }
    });

    res.status(200).json(
        new ApiResponse(200, {
            totalProcessed: issueIds.length,
            successCount: results.success.length,
            failedCount: results.failed.length,
            results
        }, "Bulk assignment completed")
    );
});

// ==================== REASSIGN ISSUE ====================

export const reassignIssue = asyncHandler(async (req, res) => {
    const { issueId } = req.params;
    const { newStaffId, reason } = req.body;

    if (!req.admin) {
        throw new ApiError(403, "Only admins can reassign issues");
    }

    const issue = await UserComplaint.findById(issueId)
        .populate('user', 'name email')
        .populate('assignedTo', 'name email');

    if (!issue) {
        throw new ApiError(404, "Issue not found");
    }

    const oldStaff = issue.assignedTo;
    const newStaff = await Staff.findById(newStaffId);

    if (!newStaff) {
        throw new ApiError(404, "New staff member not found");
    }

    // Update assignment
    issue.assignedTo = newStaffId;
    issue.department = newStaff.department;
    
    issue.comments.push({
        staff: req.admin._id,
        message: reason || `Reassigned from ${oldStaff?.name || 'Unassigned'} to ${newStaff.name}`,
        createdAt: new Date()
    });

    await issue.save();

    // Notify old staff
    if (oldStaff) {
        await Notification.create({
            recipient: oldStaff._id,
            recipientModel: 'Staff',
            type: 'issue_reassigned',
            title: 'Issue Reassigned',
            message: `Issue "${issue.title}" has been reassigned to ${newStaff.name}`,
            data: { issueId: issue._id, newStaffName: newStaff.name }
        });

        if (global.io) {
            global.io.to(oldStaff._id.toString()).emit('issue_reassigned_away', {
                issueId: issue._id,
                newStaffName: newStaff.name
            });
        }
    }

    // Notify new staff
    await Notification.create({
        recipient: newStaffId,
        recipientModel: 'Staff',
        type: 'issue_assigned',
        title: 'Issue Reassigned to You',
        message: `Issue "${issue.title}" has been assigned to you`,
        data: { issueId: issue._id, reassigned: true }
    });

    if (global.io) {
        global.io.to(newStaffId.toString()).emit('issue_assigned', {
            issueId: issue._id,
            title: issue.title,
            reassigned: true
        });
    }

    // Create audit log
    await AuditLog.createLog({
        actor: req.admin._id,
        actorModel: 'Admin',
        actorName: req.admin.name,
        actorEmail: req.admin.email,
        action: 'ISSUE_REASSIGNED',
        category: 'ISSUE_MANAGEMENT',
        severity: 'MEDIUM',
        targetModel: 'UserComplaint',
        targetId: issue._id,
        description: `Issue reassigned from ${oldStaff?.name || 'Unassigned'} to ${newStaff.name}`,
        changes: {
            before: { staffId: oldStaff?._id, staffName: oldStaff?.name },
            after: { staffId: newStaffId, staffName: newStaff.name }
        }
    });

    res.status(200).json(
        new ApiResponse(200, { issue }, "Issue reassigned successfully")
    );
});

// ==================== UNASSIGN ISSUE ====================

export const unassignIssue = asyncHandler(async (req, res) => {
    const { issueId } = req.params;
    const { reason } = req.body;

    if (!req.admin) {
        throw new ApiError(403, "Only admins can unassign issues");
    }

    const issue = await UserComplaint.findById(issueId).populate('assignedTo', 'name email');

    if (!issue) {
        throw new ApiError(404, "Issue not found");
    }

    const oldStaff = issue.assignedTo;

    if (!oldStaff) {
        throw new ApiError(400, "Issue is not assigned to anyone");
    }

    // Unassign
    issue.assignedTo = null;
    issue.status = 'pending';
    
    issue.comments.push({
        staff: req.admin._id,
        message: reason || `Unassigned from ${oldStaff.name}`,
        createdAt: new Date()
    });

    await issue.save();

    // Notify staff
    await Notification.create({
        recipient: oldStaff._id,
        recipientModel: 'Staff',
        type: 'issue_unassigned',
        title: 'Issue Unassigned',
        message: `Issue "${issue.title}" has been unassigned from you`,
        data: { issueId: issue._id, reason }
    });

    if (global.io) {
        global.io.to(oldStaff._id.toString()).emit('issue_unassigned', {
            issueId: issue._id,
            reason
        });
    }

    // Create audit log
    await AuditLog.createLog({
        actor: req.admin._id,
        actorModel: 'Admin',
        actorName: req.admin.name,
        actorEmail: req.admin.email,
        action: 'ISSUE_UNASSIGNED',
        category: 'ISSUE_MANAGEMENT',
        severity: 'MEDIUM',
        targetModel: 'UserComplaint',
        targetId: issue._id,
        description: `Issue unassigned from ${oldStaff.name}`,
        changes: {
            before: { staffId: oldStaff._id, staffName: oldStaff.name },
            after: { staffId: null, staffName: null }
        }
    });

    res.status(200).json(
        new ApiResponse(200, { issue }, "Issue unassigned successfully")
    );
});

// ==================== AUTO-ASSIGN BY WORKLOAD ====================

export const autoAssignByWorkload = asyncHandler(async (req, res) => {
    const { issueId } = req.params;
    const { department } = req.body;

    if (!req.admin) {
        throw new ApiError(403, "Only admins can auto-assign issues");
    }

    const issue = await UserComplaint.findById(issueId);
    if (!issue) {
        throw new ApiError(404, "Issue not found");
    }

    // Find staff with least workload in the department
    const staff = await Staff.aggregate([
        {
            $match: {
                isActive: true,
                ...(department && { department })
            }
        },
        {
            $lookup: {
                from: 'usercomplaints',
                let: { staffId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$assignedTo', '$$staffId'] },
                                    { $in: ['$status', ['pending', 'in-progress']] }
                                ]
                            }
                        }
                    }
                ],
                as: 'activeIssues'
            }
        },
        {
            $addFields: {
                workload: { $size: '$activeIssues' }
            }
        },
        {
            $sort: { workload: 1 }
        },
        {
            $limit: 1
        }
    ]);

    if (staff.length === 0) {
        throw new ApiError(404, "No available staff found");
    }

    const selectedStaff = staff[0];

    // Assign to selected staff
    issue.assignedTo = selectedStaff._id;
    issue.department = selectedStaff.department;
    issue.status = 'in-progress';
    
    issue.comments.push({
        staff: req.admin._id,
        message: `Auto-assigned to ${selectedStaff.name} (Workload: ${selectedStaff.workload} issues)`,
        createdAt: new Date()
    });

    await issue.save();

    // Send notifications
    await Notification.create({
        recipient: selectedStaff._id,
        recipientModel: 'Staff',
        type: 'issue_assigned',
        title: 'Issue Auto-Assigned',
        message: `Issue "${issue.title}" has been auto-assigned to you`,
        data: { issueId: issue._id, autoAssigned: true }
    });

    if (global.io) {
        global.io.to(selectedStaff._id.toString()).emit('issue_assigned', {
            issueId: issue._id,
            title: issue.title,
            autoAssigned: true
        });
    }

    res.status(200).json(
        new ApiResponse(200, {
            issue,
            assignedTo: {
                id: selectedStaff._id,
                name: selectedStaff.name,
                currentWorkload: selectedStaff.workload
            }
        }, "Issue auto-assigned successfully")
    );
});

// ==================== GET STAFF WORKLOAD ====================

export const getStaffWorkload = asyncHandler(async (req, res) => {
    const { department } = req.query;

    if (!req.admin) {
        throw new ApiError(403, "Only admins can view staff workload");
    }

    const matchQuery = { isActive: true };
    if (department) {
        matchQuery.department = department;
    }

    const staffWorkload = await Staff.aggregate([
        { $match: matchQuery },
        {
            $lookup: {
                from: 'usercomplaints',
                let: { staffId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$assignedTo', '$$staffId'] }
                        }
                    },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ],
                as: 'issuesByStatus'
            }
        },
        {
            $lookup: {
                from: 'departments',
                localField: 'department',
                foreignField: '_id',
                as: 'departmentInfo'
            }
        },
        {
            $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true }
        },
        {
            $addFields: {
                totalIssues: { $size: '$issuesByStatus' },
                pending: {
                    $size: {
                        $filter: {
                            input: '$issuesByStatus',
                            cond: { $eq: ['$$this._id', 'pending'] }
                        }
                    }
                },
                inProgress: {
                    $size: {
                        $filter: {
                            input: '$issuesByStatus',
                            cond: { $eq: ['$$this._id', 'in-progress'] }
                        }
                    }
                },
                resolved: {
                    $size: {
                        $filter: {
                            input: '$issuesByStatus',
                            cond: { $eq: ['$$this._id', 'resolved'] }
                        }
                    }
                }
            }
        },
        {
            $sort: { totalIssues: -1 }
        }
    ]);

    res.status(200).json(
        new ApiResponse(200, { staffWorkload }, "Staff workload fetched successfully")
    );
});

// ==================== HELPER FUNCTIONS ====================

function getPriorityColor(priority) {
    const colors = {
        low: '#10b981',
        medium: '#f59e0b',
        high: '#ef4444',
        critical: '#dc2626'
    };
    return colors[priority] || '#6b7280';
}

export default {
    assignIssueToStaff,
    bulkAssignIssues,
    reassignIssue,
    unassignIssue,
    autoAssignByWorkload,
    getStaffWorkload
};