import UserComplaint from "../models/UserComplaint.models.js";
import User from "../models/User.models.js";
import Staff from "../models/Staff.models.js";
import Department from "../models/Department.model.js";

// Comprehensive analytics data
export const getAnalytics = async (req, res) => {
    try {
        const { period = '30d', department = 'all', category = 'all', priority = 'all' } = req.query;
        
        // Calculate date range
        const endDate = new Date();
        let startDate = new Date();
        
        switch (period) {
            case '7d':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(endDate.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(endDate.getDate() - 30); // Default 30 days
        }
        
        // Build query
        const query = { createdAt: { $gte: startDate, $lte: endDate } };
        
        if (department !== 'all') {
            const dept = await Department.findOne({ name: department });
            if (dept) {
                query.department = dept._id;
            }
        }
        
        if (category !== 'all') {
            query.category = category;
        }
        
        if (priority !== 'all') {
            query.priority = priority;
        }
        
        // Get all data
        const complaints = await UserComplaint.find(query)
            .populate('user', 'name email')
            .populate('assignedTo', 'name email')
            .populate('department', 'name')
            .sort({ createdAt: -1 });
        
        // Summary stats
        const totalComplaints = complaints.length;
        const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
        const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
        const inProgressComplaints = complaints.filter(c => c.status === 'in-progress').length;
        
        // Department distribution
        const departmentDistribution = await UserComplaint.aggregate([
            { $match: query },
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
                    count: { $sum: 1 },
                    resolved: {
                        $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    department: '$_id',
                    count: 1,
                    resolved: 1,
                    resolutionRate: {
                        $cond: [
                            { $gt: ['$count', 0] },
                            { $multiply: [{ $divide: ['$resolved', '$count'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Category distribution
        const categoryDistribution = await UserComplaint.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Priority distribution
        const priorityDistribution = await UserComplaint.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Daily trends
        const dailyTrends = await UserComplaint.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    complaints: { $sum: 1 },
                    resolved: {
                        $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
                    }
                }
            },
            { $sort: { "_id": 1 } },
            { $limit: 30 }
        ]);
        
        // Hourly trends
        const hourlyTrends = await UserComplaint.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        $hour: "$createdAt"
                    },
                    complaints: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
        
        // Top performing staff
        const topPerformers = await UserComplaint.aggregate([
            { $match: { ...query, assignedTo: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$assignedTo',
                    total: { $sum: 1 },
                    resolved: {
                        $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
                    },
                    avgResolutionTime: {
                        $avg: {
                            $cond: [
                                { $eq: ['$status', 'resolved'] },
                                { $subtract: ['$updatedAt', '$createdAt'] },
                                null
                            ]
                        }
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
            { $sort: { resolutionRate: -1, total: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'staff',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'staff'
                }
            },
            { $unwind: '$staff' },
            {
                $project: {
                    _id: '$staff._id',
                    name: '$staff.name',
                    email: '$staff.email',
                    department: '$staff.department',
                    total: 1,
                    resolved: 1,
                    resolutionRate: { $round: ['$resolutionRate', 1] },
                    avgResolutionTime: {
                        $round: [
                            { $divide: ['$avgResolutionTime', 1000 * 60 * 60 * 24] },
                            1
                        ]
                    }
                }
            }
        ]);
        
        // Geographic data
        const geographicData = await UserComplaint.aggregate([
            { $match: { 
                ...query,
                'location.latitude': { $exists: true, $ne: null },
                'location.longitude': { $exists: true, $ne: null }
            }},
            {
                $group: {
                    _id: {
                        lat: { $round: ['$location.latitude', 2] },
                        lng: { $round: ['$location.longitude', 2] }
                    },
                    count: { $sum: 1 },
                    categories: { $addToSet: '$category' },
                    avgPriority: { $avg: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$priority', 'high'] }, then: 3 },
                                { case: { $eq: ['$priority', 'medium'] }, then: 2 },
                                { case: { $eq: ['$priority', 'low'] }, then: 1 }
                            ],
                            default: 2
                        }
                    }}
                }
            },
            { $sort: { count: -1 } },
            { $limit: 50 }
        ]);
        
        // Response time metrics
        const responseTimeMetrics = await UserComplaint.aggregate([
            { $match: { ...query, status: 'resolved' } },
            {
                $project: {
                    resolutionTime: {
                        $divide: [
                            { $subtract: ['$updatedAt', '$createdAt'] },
                            1000 * 60 * 60 * 24 // Convert to days
                        ]
                    },
                    priority: 1
                }
            },
            {
                $group: {
                    _id: null,
                    avgResolutionTime: { $avg: '$resolutionTime' },
                    medianResolutionTime: { $median: { input: '$resolutionTime', method: 'approximate' } },
                    p95ResolutionTime: { $percentile: { 
                        input: '$resolutionTime', 
                        p: [0.95], 
                        method: 'approximate' 
                    }}
                }
            }
        ]);
        
        // User engagement
        const userEngagement = await UserComplaint.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$user',
                    complaintCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    avgComplaintsPerUser: { $avg: '$complaintCount' },
                    maxComplaints: { $max: '$complaintCount' },
                    engagedUsers: {
                        $sum: { $cond: [{ $gte: ['$complaintCount', 3] }, 1, 0] }
                    }
                }
            }
        ]);
        
        const analyticsData = {
            summary: {
                totalComplaints,
                resolvedComplaints,
                pendingComplaints,
                inProgressComplaints,
                resolutionRate: totalComplaints > 0 
                    ? Math.round((resolvedComplaints / totalComplaints) * 100) 
                    : 0,
                avgResolutionTime: responseTimeMetrics[0]?.avgResolutionTime 
                    ? Math.round(responseTimeMetrics[0].avgResolutionTime * 10) / 10 
                    : 0
            },
            distributions: {
                departments: departmentDistribution,
                categories: categoryDistribution,
                priorities: priorityDistribution
            },
            trends: {
                daily: dailyTrends,
                hourly: hourlyTrends
            },
            performance: {
                topPerformers,
                metrics: responseTimeMetrics[0] || {}
            },
            geographic: {
                data: geographicData,
                totalLocations: geographicData.length,
                coverage: totalComplaints > 0 
                    ? Math.round((geographicData.reduce((sum, item) => sum + item.count, 0) / totalComplaints) * 100)
                    : 0
            },
            engagement: userEngagement[0] || {
                totalUsers: 0,
                avgComplaintsPerUser: 0,
                maxComplaints: 0,
                engagedUsers: 0
            },
            period: {
                start: startDate,
                end: endDate,
                days: Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))
            }
        };
        
        res.status(200).json({
            success: true,
            message: 'Analytics data retrieved successfully',
            data: analyticsData
        });
        
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics data'
        });
    }
};

// Export analytics
export const exportAnalytics = async (req, res) => {
    try {
        const { format = 'json', period = '30d' } = req.query;
        
        // Get analytics data
        const { data } = await getAnalytics(req, res, true);
        
        if (format === 'csv') {
            // Convert to CSV (simplified)
            const csvData = convertToCSV(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=analytics_${period}.csv`);
            return res.send(csvData);
        } else if (format === 'pdf') {
            // PDF generation would go here
            return res.status(501).json({
                success: false,
                message: 'PDF export not implemented yet'
            });
        } else {
            // Default JSON
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=analytics_${period}.json`);
            return res.json(data);
        }
        
    } catch (error) {
        console.error('Error exporting analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting analytics data'
        });
    }
};

// Helper function to convert to CSV
const convertToCSV = (data) => {
    const headers = ['Metric', 'Value'];
    const rows = [];
    
    // Add summary data
    rows.push(['Summary', '']);
    Object.entries(data.summary).forEach(([key, value]) => {
        rows.push([key, value]);
    });
    
    // Add department distribution
    rows.push(['', '']);
    rows.push(['Department Distribution', '']);
    data.distributions.departments.forEach(dept => {
        rows.push([dept.department, `${dept.count} (${dept.resolutionRate.toFixed(1)}% resolved)`]);
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
};