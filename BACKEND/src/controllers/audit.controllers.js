import AuditLog from "../models/AuditLog.models.js";

// Get all audit logs with filtering
export const getAuditLogs = async (req, res) => {
  try {
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
        { success: true, message: "Audit logs retrieved successfully", data: result }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Get audit log by ID
export const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findById(id).lean();

    if (!log) {
        return res.status(404).json({ success: false, message: "Audit log not found" });
    }

    return res.status(200).json(
        { success: true, message: "Audit log retrieved successfully", data: log }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Get activity summary
export const getActivitySummary = async (req, res) => {
  try {
    const { startDate, endDate, actor } = req.query;

    const filters = { startDate, endDate, actor };
    const summary = await AuditLog.getActivitySummary(filters);

    return res.status(200).json(
        { success: true, message: "Activity summary retrieved successfully", data: summary }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Get user activity timeline
export const getUserActivityTimeline = async (req, res) => {
  try {
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
        { success: true, message: "User activity timeline retrieved successfully", data: activities }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Get issue audit trail
export const getIssueAuditTrail = async (req, res) => {
  try {
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
        { success: true, message: "Issue audit trail retrieved successfully", data: trail }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Get recent activities (for dashboard)
export const getRecentActivities = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const activities = await AuditLog.find({ isDeleted: false })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .select('action category description actorName timestamp severity status')
        .lean();

    return res.status(200).json(
        { success: true, message: "Recent activities retrieved successfully", data: activities }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Get statistics
export const getAuditStatistics = async (req, res) => {
  try {
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
        { success: true, message: "Audit statistics retrieved successfully", data: stats[0] }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Export audit logs
export const exportAuditLogs = async (req, res) => {
  try {
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

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Get security events (high severity logs)
export const getSecurityEvents = async (req, res) => {
  try {
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
        { success: true, message: "Security events retrieved successfully", data: events }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Get failed activities
export const getFailedActivities = async (req, res) => {
  try {
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
        { success: true, message: "Failed activities retrieved successfully", data: failed }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

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