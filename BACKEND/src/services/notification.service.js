import Notification from "../models/Notification.models.js";
import User from "../models/User.models.js";
import Staff from "../models/Staff.models.js";
import Admin from "../models/Admin.models.js";
import { sendEmail } from "../utils/email.js";

/**
 * Get recipient details (email, name, type)
 */
const getRecipientDetails = async (userId) => {
  try {
    let recipient = await User.findById(userId).select('email name');
    if (recipient) return { ...recipient.toObject(), type: 'User' };

    recipient = await Staff.findById(userId).select('email name');
    if (recipient) return { ...recipient.toObject(), type: 'Staff' };

    recipient = await Admin.findById(userId).select('email name');
    if (recipient) return { ...recipient.toObject(), type: 'Admin' };

    return null;
  } catch (error) {
    console.error(`Error fetching recipient for ${userId}:`, error);
    return null;
  }
};

/**
 * Generate email HTML template
 */
const generateEmailTemplate = (title, message, actionUrl = null, metadata = {}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 30px;
        }
        .message {
          font-size: 16px;
          color: #555;
          margin-bottom: 20px;
          line-height: 1.8;
        }
        .metadata {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .metadata-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .metadata-item:last-child {
          border-bottom: none;
        }
        .metadata-label {
          font-weight: 600;
          color: #666;
        }
        .metadata-value {
          color: #333;
        }
        .action-button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: 600;
          text-align: center;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }
        .badge {
          display: inline-block;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-success {
          background-color: #d4edda;
          color: #155724;
        }
        .badge-warning {
          background-color: #fff3cd;
          color: #856404;
        }
        .badge-danger {
          background-color: #f8d7da;
          color: #721c24;
        }
        .badge-info {
          background-color: #d1ecf1;
          color: #0c5460;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 ${title}</h1>
        </div>
        <div class="content">
          <p class="message">${message}</p>
          ${Object.keys(metadata).length > 0 ? `
            <div class="metadata">
              ${Object.entries(metadata).map(([key, value]) => `
                <div class="metadata-item">
                  <span class="metadata-label">${key}:</span>
                  <span class="metadata-value">${value}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${actionUrl ? `
            <div style="text-align: center;">
              <a href="${actionUrl}" class="action-button">View Details</a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>This is an automated notification from ResolveX.</p>
          <p>© ${new Date().getFullYear()} ResolveX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Create notification and send email
 */
export const createNotification = async ({
  userId,
  recipientType,
  type,
  title,
  message,
  complaintId = null,
  actionType = "general",
  metadata = {},
  actionUrl = null,
  sendEmailNotification = true
}) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      userId,
      recipientType,
      type,
      title,
      message,
      complaintId,
      actionType,
      metadata,
      actionUrl,
      emailSent: false
    });

    // Send real-time notification via Socket.IO if available
    if (global.io) {
      global.io.to(userId.toString()).emit("notification", {
        ...notification.toObject(),
        timestamp: new Date()
      });
      console.log(`✅ Real-time notification sent to user ${userId}`);
    }

    // Send email if enabled
    if (sendEmailNotification) {
      const recipient = await getRecipientDetails(userId);
      if (recipient && recipient.email) {
        const emailMetadata = {};
        
        // Format metadata for email
        if (metadata.oldStatus && metadata.newStatus) {
          emailMetadata['Status Changed'] = `${metadata.oldStatus} → ${metadata.newStatus}`;
        }
        if (metadata.oldPriority && metadata.newPriority) {
          emailMetadata['Priority Changed'] = `${metadata.oldPriority} → ${metadata.newPriority}`;
        }
        if (metadata.assignedToName) {
          emailMetadata['Assigned To'] = metadata.assignedToName;
        }
        if (metadata.departmentName) {
          emailMetadata['Department'] = metadata.departmentName;
        }
        if (complaintId) {
          emailMetadata['Complaint ID'] = complaintId.toString().substring(0, 8);
        }

        const emailHtml = generateEmailTemplate(title, message, actionUrl, emailMetadata);

        sendEmail(
          recipient.email,
          title,
          message, // Plain text fallback
          emailHtml
        )
        .then(() => {
          // Update email sent status
          Notification.findByIdAndUpdate(notification._id, { emailSent: true }).catch(err => 
            console.error('Failed to update emailSent status:', err)
          );
          console.log(`✅ Email notification sent to ${recipient.email}`);
        })
        .catch(err => {
          console.error(`❌ Failed to send email to ${recipient.email}:`, err.message);
        });
      }
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Notify user about complaint status change
 */
export const notifyComplaintStatusChange = async (complaint, oldStatus, newStatus) => {
  const statusMessages = {
    'pending': 'Your complaint has been submitted and is pending review.',
    'in-progress': 'Your complaint is now being addressed by our team.',
    'resolved': 'Great news! Your complaint has been resolved.',
    'rejected': 'Your complaint has been reviewed and closed.'
  };

  const title = `Complaint Status Updated`;
  const message = `Your complaint "${complaint.title}" status has been updated from ${oldStatus} to ${newStatus}. ${statusMessages[newStatus] || ''}`;

  return await createNotification({
    userId: complaint.user,
    recipientType: 'User',
    type: newStatus === 'resolved' ? 'success' : newStatus === 'rejected' ? 'warning' : 'info',
    title,
    message,
    complaintId: complaint._id,
    actionType: 'status_changed',
    metadata: {
      oldStatus,
      newStatus,
      complaintTitle: complaint.title
    },
    actionUrl: `/complaints/${complaint._id}`
  });
};

/**
 * Notify staff about new complaint assignment
 */
export const notifyStaffAssignment = async (complaint, staff) => {
  const title = `New Complaint Assigned`;
  const message = `You have been assigned a new complaint: "${complaint.title}". Priority: ${complaint.priority.toUpperCase()}`;

  return await createNotification({
    userId: staff._id,
    recipientType: 'Staff',
    type: complaint.priority === 'high' || complaint.priority === 'critical' ? 'warning' : 'info',
    title,
    message,
    complaintId: complaint._id,
    actionType: 'complaint_assigned',
    metadata: {
      complaintTitle: complaint.title,
      priority: complaint.priority,
      category: complaint.category
    },
    actionUrl: `/staff/complaints/${complaint._id}`
  });
};

/**
 * Notify user about new comment
 */
export const notifyNewComment = async (complaint, commenter, commentText) => {
  const title = `New Update on Your Complaint`;
  const message = `${commenter.name} has added a comment on your complaint "${complaint.title}": ${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}`;

  return await createNotification({
    userId: complaint.user,
    recipientType: 'User',
    type: 'update',
    title,
    message,
    complaintId: complaint._id,
    actionType: 'comment_added',
    metadata: {
      commenterName: commenter.name,
      complaintTitle: complaint.title
    },
    actionUrl: `/complaints/${complaint._id}`
  });
};

/**
 * Notify about priority change
 */
export const notifyPriorityChange = async (complaint, oldPriority, newPriority, recipient, recipientType) => {
  const title = `Complaint Priority Updated`;
  const message = `The priority of complaint "${complaint.title}" has been changed from ${oldPriority.toUpperCase()} to ${newPriority.toUpperCase()}.`;

  return await createNotification({
    userId: recipient,
    recipientType,
    type: newPriority === 'critical' || newPriority === 'high' ? 'warning' : 'info',
    title,
    message,
    complaintId: complaint._id,
    actionType: 'priority_changed',
    metadata: {
      oldPriority,
      newPriority,
      complaintTitle: complaint.title
    },
    actionUrl: recipientType === 'User' ? `/complaints/${complaint._id}` : `/staff/complaints/${complaint._id}`
  });
};

/**
 * Notify admin about new complaint
 */
export const notifyAdminNewComplaint = async (complaint, adminId) => {
  const title = `New Complaint Submitted`;
  const message = `A new ${complaint.priority.toUpperCase()} priority complaint has been submitted in the ${complaint.category} category: "${complaint.title}"`;

  return await createNotification({
    userId: adminId,
    recipientType: 'Admin',
    type: complaint.priority === 'critical' || complaint.priority === 'high' ? 'warning' : 'info',
    title,
    message,
    complaintId: complaint._id,
    actionType: 'complaint_created',
    metadata: {
      priority: complaint.priority,
      category: complaint.category,
      location: complaint.location?.address || 'Not specified'
    },
    actionUrl: `/admin/complaints/${complaint._id}`
  });
};

/**
 * Notify user about complaint creation
 */
export const notifyUserComplaintCreated = async (complaint) => {
  const title = `Complaint Submitted Successfully`;
  const message = `Your complaint "${complaint.title}" has been successfully submitted. We'll keep you updated on its progress.`;

  return await createNotification({
    userId: complaint.user,
    recipientType: 'User',
    type: 'success',
    title,
    message,
    complaintId: complaint._id,
    actionType: 'complaint_created',
    metadata: {
      complaintTitle: complaint.title,
      category: complaint.category,
      priority: complaint.priority
    },
    actionUrl: `/complaints/${complaint._id}`
  });
};

/**
 * Notify user about department assignment
 */
export const notifyDepartmentAssignment = async (complaint, departmentName) => {
  const title = `Complaint Assigned to Department`;
  const message = `Your complaint "${complaint.title}" has been assigned to the ${departmentName} department for review and action.`;

  return await createNotification({
    userId: complaint.user,
    recipientType: 'User',
    type: 'info',
    title,
    message,
    complaintId: complaint._id,
    actionType: 'department_assigned',
    metadata: {
      departmentName,
      complaintTitle: complaint.title
    },
    actionUrl: `/complaints/${complaint._id}`
  });
};

/**
 * Bulk notify users
 */
export const bulkNotifyUsers = async (userIds, notificationData) => {
  const notifications = userIds.map(userId => ({
    ...notificationData,
    userId
  }));

  try {
    const created = await Notification.insertMany(notifications);
    console.log(`✅ Created ${created.length} bulk notifications`);
    
    // Send real-time notifications
    if (global.io) {
      created.forEach(notification => {
        global.io.to(notification.userId.toString()).emit("notification", {
          ...notification.toObject(),
          timestamp: new Date()
        });
      });
    }

    return created;
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    throw error;
  }
};

export default {
  createNotification,
  notifyComplaintStatusChange,
  notifyStaffAssignment,
  notifyNewComment,
  notifyPriorityChange,
  notifyAdminNewComplaint,
  notifyUserComplaintCreated,
  notifyDepartmentAssignment,
  bulkNotifyUsers
};