import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // The recipient ID (can be User, Staff, or Admin ObjectId)
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    
    // Recipient type for proper querying
    recipientType: { 
      type: String, 
      enum: ["User", "Staff", "Admin"], 
      required: true 
    },
    
    // Notification type
    type: { 
      type: String, 
      enum: [
        "info", 
        "success", 
        "warning", 
        "error", 
        "update", 
        "new_complaint",
        "status_change",
        "assignment",
        "comment",
        "priority_change"
      ], 
      default: "info" 
    },
    
    // Notification title
    title: { type: String, required: true },
    
    // Notification message
    message: { type: String, required: true },
    
    // Related complaint (if applicable)
    complaintId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "UserComplaint",
      default: null 
    },
    
    // Action type for better context
    actionType: {
      type: String,
      enum: [
        "complaint_created",
        "complaint_assigned",
        "status_changed",
        "comment_added",
        "priority_changed",
        "department_assigned",
        "complaint_resolved",
        "complaint_rejected",
        "general"
      ],
      default: "general"
    },
    
    // Additional metadata
    metadata: {
      oldStatus: String,
      newStatus: String,
      oldPriority: String,
      newPriority: String,
      assignedToName: String,
      departmentName: String
    },
    
    // Read status
    isRead: { type: Boolean, default: false },
    
    // Email sent status
    emailSent: { type: Boolean, default: false },
    
    // Click/Action URL
    actionUrl: { type: String, default: null }
  },
  { timestamps: true }
);

// Index for faster queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ complaintId: 1 });

export default mongoose.model("Notification", notificationSchema);