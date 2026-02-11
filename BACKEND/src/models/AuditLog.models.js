import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    // WHO performed the action
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'actorModel',
        required: true
    },
    actorModel: {
        type: String,
        required: true,
        enum: ['Admin', 'Staff', 'User']
    },
    actorName: {
        type: String,
        required: true
    },
    actorEmail: {
        type: String,
        required: true
    },
    actorRole: {
        type: String,
        enum: ['user', 'staff', 'admin', 'superadmin']
    },

    // WHAT action was performed
    action: {
        type: String,
        required: true,
        enum: [
            // Authentication Actions
            'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET', 'PASSWORD_CHANGED',
            
            // User Actions
            'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_ACTIVATED', 'USER_DEACTIVATED',
            'USER_VERIFIED', 'USER_UNVERIFIED', 'USER_ROLE_CHANGED', 'USER_BULK_UPDATE',
            
            // Staff Actions
            'STAFF_CREATED', 'STAFF_UPDATED', 'STAFF_DELETED', 'STAFF_ACTIVATED', 'STAFF_DEACTIVATED',
            'STAFF_ASSIGNED', 'STAFF_UNASSIGNED', 'STAFF_BULK_UPDATE', 'STAFF_PERFORMANCE_REVIEWED',
            
            // Admin Actions
            'ADMIN_CREATED', 'ADMIN_UPDATED', 'ADMIN_DELETED', 'ADMIN_ROLE_CHANGED',
            'ADMIN_PERMISSIONS_CHANGED',
            
            // Issue/Complaint Actions
            'ISSUE_CREATED', 'ISSUE_VIEWED', 'ISSUE_UPDATED', 'ISSUE_DELETED',
            'ISSUE_ASSIGNED', 'ISSUE_UNASSIGNED', 'ISSUE_REASSIGNED',
            'ISSUE_STATUS_CHANGED', 'ISSUE_PRIORITY_CHANGED', 'ISSUE_CATEGORY_CHANGED',
            'ISSUE_RESOLVED', 'ISSUE_REOPENED', 'ISSUE_CLOSED', 'ISSUE_REJECTED',
            'ISSUE_COMMENT_ADDED', 'ISSUE_ATTACHMENT_ADDED', 'ISSUE_BULK_UPDATE',
            
            // Department Actions
            'DEPARTMENT_CREATED', 'DEPARTMENT_UPDATED', 'DEPARTMENT_DELETED',
            
            // System Settings
            'SETTINGS_UPDATED', 'SETTINGS_RESET', 'SYSTEM_CONFIG_CHANGED',
            
            // Data Export/Import
            'DATA_EXPORTED', 'DATA_IMPORTED', 'REPORT_GENERATED',
            
            // Analytics
            'ANALYTICS_VIEWED', 'DASHBOARD_VIEWED', 'REPORT_DOWNLOADED'
        ]
    },

    // WHERE/ON WHAT the action was performed
    targetModel: {
        type: String,
        enum: ['User', 'Staff', 'Admin', 'UserComplaint', 'Department', 'System', null]
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'targetModel'
    },
    targetName: {
        type: String
    },

    // DETAILS of the action
    description: {
        type: String,
        required: true
    },
    
    // Changes made (before/after)
    changes: {
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed
    },

    // Additional context
    metadata: {
        ipAddress: String,
        userAgent: String,
        endpoint: String,
        method: String,
        statusCode: Number,
        duration: Number, // milliseconds
        location: {
            city: String,
            country: String,
            coordinates: {
                latitude: Number,
                longitude: Number
            }
        }
    },

    // Categorization
    category: {
        type: String,
        enum: [
            'AUTHENTICATION',
            'USER_MANAGEMENT',
            'STAFF_MANAGEMENT',
            'ADMIN_MANAGEMENT',
            'ISSUE_MANAGEMENT',
            'DEPARTMENT_MANAGEMENT',
            'SYSTEM_CONFIGURATION',
            'DATA_OPERATION',
            'ANALYTICS'
        ],
        required: true
    },

    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'LOW'
    },

    // Status
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE', 'WARNING'],
        default: 'SUCCESS'
    },

    // Error details (if any)
    error: {
        message: String,
        stack: String,
        code: String
    },

    // Timestamps
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    // For soft deletion
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for fast queries
auditLogSchema.index({ actor: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, timestamp: -1 });
auditLogSchema.index({ targetModel: 1, targetId: 1 });
auditLogSchema.index({ 'metadata.ipAddress': 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });

// Compound index for common queries
auditLogSchema.index({ actor: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, severity: 1, timestamp: -1 });

// Static method to create audit log
auditLogSchema.statics.createLog = async function(data) {
    try {
        const log = new this(data);
        await log.save();
        return log;
    } catch (error) {
        console.error('Error creating audit log:', error);
        // Don't throw - audit logging should never break the main flow
        return null;
    }
};

// Static method to get logs with filters
auditLogSchema.statics.getLogs = async function(filters = {}, options = {}) {
    const {
        actor,
        actorModel,
        action,
        category,
        severity,
        status,
        targetModel,
        targetId,
        startDate,
        endDate,
        searchTerm
    } = filters;

    const {
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc'
    } = options;

    const query = { isDeleted: false };

    if (actor) query.actor = actor;
    if (actorModel) query.actorModel = actorModel;
    if (action) query.action = action;
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (targetModel) query.targetModel = targetModel;
    if (targetId) query.targetId = targetId;

    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (searchTerm) {
        query.$or = [
            { description: { $regex: searchTerm, $options: 'i' } },
            { actorName: { $regex: searchTerm, $options: 'i' } },
            { actorEmail: { $regex: searchTerm, $options: 'i' } },
            { targetName: { $regex: searchTerm, $options: 'i' } }
        ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        this.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query)
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// Static method to get activity summary
auditLogSchema.statics.getActivitySummary = async function(filters = {}) {
    const { startDate, endDate, actor } = filters;
    
    const matchQuery = { isDeleted: false };
    if (startDate || endDate) {
        matchQuery.timestamp = {};
        if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
        if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
    }
    if (actor) matchQuery.actor = actor;

    const summary = await this.aggregate([
        { $match: matchQuery },
        {
            $facet: {
                byCategory: [
                    { $group: { _id: '$category', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ],
                byAction: [
                    { $group: { _id: '$action', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ],
                bySeverity: [
                    { $group: { _id: '$severity', count: { $sum: 1 } } }
                ],
                byStatus: [
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ],
                byHour: [
                    {
                        $group: {
                            _id: { $hour: '$timestamp' },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } }
                ],
                total: [
                    { $count: 'count' }
                ]
            }
        }
    ]);

    return summary[0];
};

export default mongoose.model("AuditLog", auditLogSchema);