import UserComplaint from "../models/UserComplaint.models.js";
import NotificationService from "../services/notification.service.js";

export const handleGetStaffComplaints=async(req ,res)=>{
    try{
        const staffId=req.staff._id;
        const {status}=req.query;

        let filter={
            assignedTo: staffId
        };
        if(status && status !== 'all'){
            filter.status=status;
        }
        const complaints=await UserComplaint.find(filter)
        .populate('user', 'name email phone')
            .populate('assignedTo', 'name staffId email')
            .populate('department', 'name')
            .populate('comments.staff', 'name staffId')
            .populate('comments.admin', 'name organizationName')
            .populate('comments.user', 'name')
            .sort({ 
                priority: -1, // High priority first
                createdAt: -1 // Newest first
            });

        res.status(200).json({
            success: true,
            message: 'Staff complaints fetched successfully',
            data: complaints,
            count: complaints.length
        });

    } catch (error) {
        console.error('Error fetching staff complaints:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching staff complaints'
        });
    }
};

// Staff updates complaint status
export const handleUpdateStaffComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comments } = req.body;
        const staffId = req.staff._id;
        
        const complaint = await UserComplaint.findById(id);
        
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        // Check if staff is assigned to this complaint
        if (!complaint.assignedTo || complaint.assignedTo.toString() !== staffId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this complaint'
            });
        }

        const updates = {};
        const activityLog = [];
        const oldStatus = complaint.status;

        // Update status
        if (status && complaint.status !== status) {
            complaint.status = status;
            updates.status = status;
            activityLog.push(`Status updated to ${status}`);

            //   THE FIX: Record the exact time it was resolved for our Analytics Engine!
            if (status === 'resolved' || status === 'closed') {
                complaint.resolvedAt = new Date();
            }

            // Send notification to user about status change
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

        // Add staff comments/work notes
        if (comments) {
            complaint.comments.push({
                authorRole: 'staff',
                staff: staffId,
                message: `[STAFF UPDATE]: ${comments}`,
                createdAt: new Date()
            });
            updates.comments = comments;
            activityLog.push('Work notes added');

            // Send notification to user about new comment
            try {
                const staffDetails = await complaint.populate('assignedTo', 'name');
                await NotificationService.notifyNewComment(
                    complaint,
                    req.staff,
                    comments
                );
            } catch (notifError) {
                console.error('Failed to send comment notification:', notifError);
            }
        }

        complaint.updatedAt = new Date();
        await complaint.save();

        // Populate for response
        await complaint.populate('user', 'name email phone');
        await complaint.populate('assignedTo', 'name staffId email');
        await complaint.populate('department', 'name');
        await complaint.populate('comments.staff', 'name staffId');
        await complaint.populate('comments.admin', 'name organizationName');
        await complaint.populate('comments.user', 'name');

        res.json({
            success: true,
            message: 'Complaint updated successfully',
            data: complaint,
            updates: updates,
            activity: activityLog
        });

    } catch (error) {
        console.error('Error updating staff complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating complaint'
        });
    }
};

