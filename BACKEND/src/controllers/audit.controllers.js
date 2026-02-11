import AuditLog from "../models/AuditLog.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// Get all audit logs with filtering
export const getAuditLogs = asyncHandler(async (req, res) => {
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
        searchTerm,
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc'
    } = req.query;

    const filters = {
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
    };

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
    };

    const result = await AuditLog.getLogs(filters, options);

    return res.status(200).json(
        new ApiResponse(200, result, "Audit logs retrieved successfully")
    );
});

// Get audit log by ID
export const getAuditLogById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const log = await AuditLog.findById(id).lean();

    if (!log) {
        throw new ApiError(404, "Audit log not found");
    }

    return res.status(200).json(
        new ApiResponse(200, log, "Audit log retrieved successfully")
    );
});

// Get activity summary
export const getActivitySummary = asyncHandler(async (req, res) => {
    const { startDate, endDate, actor } = req.query;

    const filters = { startDate, endDate, actor };
    const summary = await AuditLog.getActivitySummary(filters);

    return res.status(200).json(
        new ApiResponse(200, summary, "Activity summary retrieved successfully")
    );
});

// Get user activity timeline
export const getUserActivityTimeline = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const activities = await AuditLog.find({
        actor: userId,
        timestamp: { $gte: startDate },
        isDeleted: false
    })
    .sort({ timestamp: -1 })
    .limit(100)
    .select('action category description timestamp metadata.ipAddress')
    .lean();

    return res.status(200).json(
        new ApiResponse(200, activities, "User activity timeline retrieved successfully")
    );
});

// Get issue audit trail
export const getIssueAuditTrail = asyncHandler(async (req, res) => {
    const { issueId } = req.params;

    const trail = await AuditLog.find({
        targetModel: 'UserComplaint',
        targetId: issueId,
        isDeleted: false
    })
    .sort({ timestamp: 1 })
    .populate('actor', 'name email')
    .lean();

    return res.status(200).json(
        new ApiResponse(200, trail, "Issue audit trail retrieved successfully")
    );
});

// Get recent activities (for dashboard)
export const getRecentActivities = asyncHandler(async (req, res) => {
    const { limit = 20 } = req.query;

    const activities = await AuditLog.find({ isDeleted: false })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .select('action category description actorName timestamp severity status')
        .lean();

    return res.status(200).json(
        new ApiResponse(200, activities, "Recent activities retrieved successfully")
    );
});

// Get statistics
export const getAuditStatistics = asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await AuditLog.aggregate([
        {
            $match: {
                timestamp: { $gte: startDate },
                isDeleted: false
            }
        },
        {
            $facet: {
                totalActivities: [
                    { $count: 'count' }
                ],
                byCategory: [
                    { $group: { _id: '$category', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ],
                bySeverity: [
                    { $group: { _id: '$severity', count: { $sum: 1 } } }
                ],
                byStatus: [
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ],
                topActors: [
                    { $group: { _id: '$actor', name: { $first: '$actorName' }, count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ],
                topActions: [
                    { $group: { _id: '$action', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ],
                dailyActivity: [
                    {
                        $group: {
                            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } }
                ],
                hourlyActivity: [
                    {
                        $group: {
                            _id: { $hour: '$timestamp' },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, stats[0], "Audit statistics retrieved successfully")
    );
});

// Export audit logs
export const exportAuditLogs = asyncHandler(async (req, res) => {
    const {
        startDate,
        endDate,
        format = 'csv',
        category,
        severity
    } = req.query;

    const query = { isDeleted: false };
    
    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    if (category) query.category = category;
    if (severity) query.severity = severity;

    const logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .limit(10000) // Limit for performance
        .lean();

    if (format === 'csv') {
        const csvData = convertToCSV(logs);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
        return res.send(csvData);
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.json`);
        return res.send(JSON.stringify(logs, null, 2));
    }
});

// Get security events (high severity logs)
export const getSecurityEvents = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const events = await AuditLog.find({
        severity: { $in: ['HIGH', 'CRITICAL'] },
        timestamp: { $gte: startDate },
        isDeleted: false
    })
    .sort({ timestamp: -1 })
    .limit(100)
    .lean();

    return res.status(200).json(
        new ApiResponse(200, events, "Security events retrieved successfully")
    );
});

// Get failed activities
export const getFailedActivities = asyncHandler(async (req, res) => {
    const { days = 7, limit = 50 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const failed = await AuditLog.find({
        status: 'FAILURE',
        timestamp: { $gte: startDate },
        isDeleted: false
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .lean();

    return res.status(200).json(
        new ApiResponse(200, failed, "Failed activities retrieved successfully")
    );
});

// Helper function to convert logs to CSV
const convertToCSV = (logs) => {
    if (logs.length === 0) return '';

    const headers = [
        'Timestamp',
        'Actor',
        'Role',
        'Action',
        'Category',
        'Severity',
        'Status',
        'Description',
        'Target',
        'IP Address'
    ];

    const rows = logs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.actorName,
        log.actorRole,
        log.action,
        log.category,
        log.severity,
        log.status,
        log.description,
        log.targetName || 'N/A',
        log.metadata?.ipAddress || 'N/A'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
};

export default {
    getAuditLogs,
    getAuditLogById,
    getActivitySummary,
    getUserActivityTimeline,
    getIssueAuditTrail,
    getRecentActivities,
    getAuditStatistics,
    exportAuditLogs,
    getSecurityEvents,
    getFailedActivities
};