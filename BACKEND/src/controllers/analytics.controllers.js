// src/controllers/analytics.controllers.js
import UserComplaint from "../models/UserComplaint.models.js";
import User from "../models/User.models.js";
import Staff from "../models/Staff.models.js";
import Department from "../models/Department.model.js";
import AuditLog from "../models/AuditLog.models.js";
import ChatMessage from "../models/chat.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// ==================== COMPREHENSIVE ANALYTICS DASHBOARD ====================

export const getComprehensiveAnalytics = asyncHandler(async (req, res) => {
    const { timeRange = '30d', department, category } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
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
            startDate.setDate(endDate.getDate() - 30);
    }

    // Build match query
    const matchQuery = {
        createdAt: { $gte: startDate, $lte: endDate }
    };
    if (department) matchQuery.department = department;
    if (category) matchQuery.category = category;

    // Parallel data fetching for performance
    const [
        overviewMetrics,
        trendData,
        categoryBreakdown,
        departmentPerformance,
        staffPerformance,
        userEngagement,
        resolutionMetrics,
        priorityDistribution,
        locationAnalysis,
        timeAnalysis,
        comparisonMetrics
    ] = await Promise.all([
        getOverviewMetrics(matchQuery),
        getTrendData(startDate, endDate, matchQuery),
        getCategoryBreakdown(matchQuery),
        getDepartmentPerformance(matchQuery),
        getStaffPerformance(matchQuery),
        getUserEngagement(matchQuery),
        getResolutionMetrics(matchQuery),
        getPriorityDistribution(matchQuery),
        getLocationAnalysis(matchQuery),
        getTimeAnalysis(matchQuery),
        getComparisonMetrics(startDate, endDate, matchQuery)
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            timeRange,
            dateRange: { start: startDate, end: endDate },
            overview: overviewMetrics,
            trends: trendData,
            categories: categoryBreakdown,
            departments: departmentPerformance,
            staff: staffPerformance,
            users: userEngagement,
            resolution: resolutionMetrics,
            priority: priorityDistribution,
            location: locationAnalysis,
            timePatterns: timeAnalysis,
            comparison: comparisonMetrics
        }, "Analytics data fetched successfully")
    );
});

// ==================== OVERVIEW METRICS ====================

async function getOverviewMetrics(matchQuery) {
    const [
        totalComplaints,
        activeComplaints,
        resolvedComplaints,
        averageResolutionTime,
        totalUsers,
        activeUsers,
        totalStaff,
        activeStaff,
        satisfactionScore
    ] = await Promise.all([
        UserComplaint.countDocuments(matchQuery),
        UserComplaint.countDocuments({ ...matchQuery, status: { $in: ['pending', 'in-progress'] } }),
        UserComplaint.countDocuments({ ...matchQuery, status: 'resolved' }),
        calculateAverageResolutionTime(matchQuery),
        User.countDocuments(),
        User.countDocuments({ 
            _id: { 
                $in: await UserComplaint.distinct('user', matchQuery) 
            } 
        }),
        Staff.countDocuments(),
        Staff.countDocuments({ isActive: true }),
        calculateSatisfactionScore(matchQuery)
    ]);

    const resolutionRate = totalComplaints > 0 
        ? ((resolvedComplaints / totalComplaints) * 100).toFixed(2) 
        : 0;

    const avgResponseTime = await calculateAverageResponseTime(matchQuery);

    return {
        complaints: {
            total: totalComplaints,
            active: activeComplaints,
            resolved: resolvedComplaints,
            resolutionRate: parseFloat(resolutionRate)
        },
        users: {
            total: totalUsers,
            active: activeUsers,
            engagementRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0
        },
        staff: {
            total: totalStaff,
            active: activeStaff,
            utilization: totalStaff > 0 ? ((activeStaff / totalStaff) * 100).toFixed(2) : 0
        },
        performance: {
            averageResolutionTime: averageResolutionTime,
            averageResponseTime: avgResponseTime,
            satisfactionScore: satisfactionScore
        }
    };
}

// ==================== TREND ANALYSIS ====================

async function getTrendData(startDate, endDate, matchQuery) {
    const dailyTrends = await UserComplaint.aggregate([
        {
            $match: matchQuery
        },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    status: "$status"
                },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: "$_id.date",
                created: { $sum: "$count" },
                pending: {
                    $sum: {
                        $cond: [{ $eq: ["$_id.status", "pending"] }, "$count", 0]
                    }
                },
                inProgress: {
                    $sum: {
                        $cond: [{ $eq: ["$_id.status", "in-progress"] }, "$count", 0]
                    }
                },
                resolved: {
                    $sum: {
                        $cond: [{ $eq: ["$_id.status", "resolved"] }, "$count", 0]
                    }
                },
                rejected: {
                    $sum: {
                        $cond: [{ $eq: ["$_id.status", "rejected"] }, "$count", 0]
                    }
                }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    // Fill in missing dates with zero values
    const filledTrends = fillMissingDates(dailyTrends, startDate, endDate);

    return filledTrends;
}

// ==================== CATEGORY BREAKDOWN ====================

async function getCategoryBreakdown(matchQuery) {
    const categoryStats = await UserComplaint.aggregate([
        {
            $match: matchQuery
        },
        {
            $group: {
                _id: "$category",
                total: { $sum: 1 },
                pending: {
                    $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                },
                inProgress: {
                    $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] }
                },
                resolved: {
                    $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
                },
                rejected: {
                    $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
                },
                averageVotes: { $avg: "$voteCount" },
                totalVotes: { $sum: "$voteCount" }
            }
        },
        {
            $addFields: {
                resolutionRate: {
                    $multiply: [
                        { $divide: ["$resolved", "$total"] },
                        100
                    ]
                }
            }
        },
        {
            $sort: { total: -1 }
        }
    ]);

    return categoryStats.map(cat => ({
        category: cat._id,
        total: cat.total,
        pending: cat.pending,
        inProgress: cat.inProgress,
        resolved: cat.resolved,
        rejected: cat.rejected,
        resolutionRate: cat.resolutionRate.toFixed(2),
        averageVotes: cat.averageVotes.toFixed(1),
        totalVotes: cat.totalVotes
    }));
}

// ==================== DEPARTMENT PERFORMANCE ====================

async function getDepartmentPerformance(matchQuery) {
    const departmentStats = await UserComplaint.aggregate([
        {
            $match: { ...matchQuery, department: { $ne: null } }
        },
        {
            $lookup: {
                from: 'departments',
                localField: 'department',
                foreignField: '_id',
                as: 'deptInfo'
            }
        },
        {
            $unwind: { path: '$deptInfo', preserveNullAndEmptyArrays: true }
        },
        {
            $group: {
                _id: "$department",
                departmentName: { $first: "$deptInfo.name" },
                totalAssigned: { $sum: 1 },
                resolved: {
                    $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
                },
                pending: {
                    $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                },
                inProgress: {
                    $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] }
                },
                avgResolutionTime: {
                    $avg: {
                        $cond: [
                            { $eq: ["$status", "resolved"] },
                            { $subtract: ["$updatedAt", "$createdAt"] },
                            null
                        ]
                    }
                }
            }
        },
        {
            $addFields: {
                resolutionRate: {
                    $multiply: [
                        { $divide: ["$resolved", "$totalAssigned"] },
                        100
                    ]
                },
                avgResolutionHours: {
                    $divide: ["$avgResolutionTime", 3600000]
                }
            }
        },
        {
            $sort: { resolutionRate: -1 }
        }
    ]);

    return departmentStats.map(dept => ({
        departmentId: dept._id,
        departmentName: dept.departmentName || 'Unknown',
        totalAssigned: dept.totalAssigned,
        resolved: dept.resolved,
        pending: dept.pending,
        inProgress: dept.inProgress,
        resolutionRate: dept.resolutionRate.toFixed(2),
        avgResolutionHours: dept.avgResolutionHours ? dept.avgResolutionHours.toFixed(1) : null
    }));
}

// ==================== STAFF PERFORMANCE ====================

async function getStaffPerformance(matchQuery) {
    const staffStats = await UserComplaint.aggregate([
        {
            $match: { ...matchQuery, assignedTo: { $ne: null } }
        },
        {
            $lookup: {
                from: 'staff',
                localField: 'assignedTo',
                foreignField: '_id',
                as: 'staffInfo'
            }
        },
        {
            $unwind: '$staffInfo'
        },
        {
            $group: {
                _id: "$assignedTo",
                staffName: { $first: "$staffInfo.name" },
                staffEmail: { $first: "$staffInfo.email" },
                department: { $first: "$staffInfo.department" },
                totalAssigned: { $sum: 1 },
                resolved: {
                    $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
                },
                inProgress: {
                    $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] }
                },
                pending: {
                    $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                },
                avgResolutionTime: {
                    $avg: {
                        $cond: [
                            { $eq: ["$status", "resolved"] },
                            { $subtract: ["$updatedAt", "$createdAt"] },
                            null
                        ]
                    }
                },
                criticalIssues: {
                    $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] }
                }
            }
        },
        {
            $addFields: {
                resolutionRate: {
                    $multiply: [
                        { $divide: ["$resolved", "$totalAssigned"] },
                        100
                    ]
                },
                avgResolutionHours: {
                    $divide: ["$avgResolutionTime", 3600000]
                },
                performanceScore: {
                    $add: [
                        { $multiply: [{ $divide: ["$resolved", "$totalAssigned"] }, 50] },
                        { $multiply: [{ $divide: ["$criticalIssues", { $add: ["$totalAssigned", 1] }] }, 25] },
                        { 
                            $cond: [
                                { $lt: [{ $divide: ["$avgResolutionTime", 3600000] }, 48] },
                                25,
                                { 
                                    $cond: [
                                        { $lt: [{ $divide: ["$avgResolutionTime", 3600000] }, 72] },
                                        15,
                                        5
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        },
        {
            $sort: { performanceScore: -1 }
        },
        {
            $limit: 20
        }
    ]);

    return staffStats.map(staff => ({
        staffId: staff._id,
        name: staff.staffName,
        email: staff.staffEmail,
        department: staff.department,
        totalAssigned: staff.totalAssigned,
        resolved: staff.resolved,
        inProgress: staff.inProgress,
        pending: staff.pending,
        resolutionRate: staff.resolutionRate.toFixed(2),
        avgResolutionHours: staff.avgResolutionHours ? staff.avgResolutionHours.toFixed(1) : null,
        criticalIssues: staff.criticalIssues,
        performanceScore: staff.performanceScore.toFixed(2)
    }));
}

// ==================== USER ENGAGEMENT ====================

async function getUserEngagement(matchQuery) {
    const userStats = await UserComplaint.aggregate([
        {
            $match: matchQuery
        },
        {
            $group: {
                _id: "$user",
                complaintsCreated: { $sum: 1 },
                totalVotesReceived: { $sum: "$voteCount" },
                resolvedComplaints: {
                    $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
                }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userInfo'
            }
        },
        {
            $unwind: '$userInfo'
        },
        {
            $addFields: {
                engagementScore: {
                    $add: [
                        { $multiply: ["$complaintsCreated", 10] },
                        { $multiply: ["$totalVotesReceived", 2] },
                        { $multiply: ["$resolvedComplaints", 5] }
                    ]
                }
            }
        },
        {
            $sort: { engagementScore: -1 }
        },
        {
            $limit: 10
        }
    ]);

    const totalActiveUsers = await UserComplaint.distinct('user', matchQuery);
    const repeatUsers = await UserComplaint.aggregate([
        {
            $match: matchQuery
        },
        {
            $group: {
                _id: "$user",
                count: { $sum: 1 }
            }
        },
        {
            $match: { count: { $gt: 1 } }
        },
        {
            $count: "repeatCount"
        }
    ]);

    return {
        totalActiveUsers: totalActiveUsers.length,
        repeatUsers: repeatUsers[0]?.repeatCount || 0,
        repeatRate: totalActiveUsers.length > 0 
            ? ((repeatUsers[0]?.repeatCount || 0) / totalActiveUsers.length * 100).toFixed(2)
            : 0,
        topUsers: userStats.map(user => ({
            userId: user._id,
            name: user.userInfo.name,
            email: user.userInfo.email,
            complaintsCreated: user.complaintsCreated,
            totalVotesReceived: user.totalVotesReceived,
            resolvedComplaints: user.resolvedComplaints,
            engagementScore: user.engagementScore
        }))
    };
}

// ==================== RESOLUTION METRICS ====================

async function getResolutionMetrics(matchQuery) {
    const resolutionData = await UserComplaint.aggregate([
        {
            $match: { ...matchQuery, status: 'resolved' }
        },
        {
            $addFields: {
                resolutionTime: { $subtract: ["$updatedAt", "$createdAt"] },
                resolutionHours: {
                    $divide: [
                        { $subtract: ["$updatedAt", "$createdAt"] },
                        3600000
                    ]
                }
            }
        },
        {
            $group: {
                _id: null,
                avgResolutionTime: { $avg: "$resolutionTime" },
                minResolutionTime: { $min: "$resolutionTime" },
                maxResolutionTime: { $max: "$resolutionTime" },
                totalResolved: { $sum: 1 },
                under24Hours: {
                    $sum: { $cond: [{ $lt: ["$resolutionHours", 24] }, 1, 0] }
                },
                under48Hours: {
                    $sum: { $cond: [{ $lt: ["$resolutionHours", 48] }, 1, 0] }
                },
                under72Hours: {
                    $sum: { $cond: [{ $lt: ["$resolutionHours", 72] }, 1, 0] }
                },
                overAWeek: {
                    $sum: { $cond: [{ $gt: ["$resolutionHours", 168] }, 1, 0] }
                }
            }
        }
    ]);

    if (resolutionData.length === 0) {
        return {
            averageResolutionTime: null,
            medianResolutionTime: null,
            fastestResolution: null,
            slowestResolution: null,
            distribution: {
                under24Hours: 0,
                under48Hours: 0,
                under72Hours: 0,
                overAWeek: 0
            }
        };
    }

    const data = resolutionData[0];

    return {
        averageResolutionTime: msToHours(data.avgResolutionTime),
        fastestResolution: msToHours(data.minResolutionTime),
        slowestResolution: msToHours(data.maxResolutionTime),
        distribution: {
            under24Hours: data.under24Hours,
            under48Hours: data.under48Hours,
            under72Hours: data.under72Hours,
            overAWeek: data.overAWeek,
            percentages: {
                under24Hours: ((data.under24Hours / data.totalResolved) * 100).toFixed(2),
                under48Hours: ((data.under48Hours / data.totalResolved) * 100).toFixed(2),
                under72Hours: ((data.under72Hours / data.totalResolved) * 100).toFixed(2),
                overAWeek: ((data.overAWeek / data.totalResolved) * 100).toFixed(2)
            }
        }
    };
}

// ==================== PRIORITY DISTRIBUTION ====================

async function getPriorityDistribution(matchQuery) {
    const priorityStats = await UserComplaint.aggregate([
        {
            $match: matchQuery
        },
        {
            $group: {
                _id: "$priority",
                count: { $sum: 1 },
                resolved: {
                    $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
                },
                avgResolutionTime: {
                    $avg: {
                        $cond: [
                            { $eq: ["$status", "resolved"] },
                            { $subtract: ["$updatedAt", "$createdAt"] },
                            null
                        ]
                    }
                }
            }
        },
        {
            $sort: {
                _id: 1
            }
        }
    ]);

    return priorityStats.map(priority => ({
        priority: priority._id,
        count: priority.count,
        resolved: priority.resolved,
        resolutionRate: ((priority.resolved / priority.count) * 100).toFixed(2),
        avgResolutionHours: priority.avgResolutionTime 
            ? msToHours(priority.avgResolutionTime)
            : null
    }));
}

// ==================== LOCATION ANALYSIS ====================

async function getLocationAnalysis(matchQuery) {
    const locationStats = await UserComplaint.aggregate([
        {
            $match: {
                ...matchQuery,
                'location.address': { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: {
                    city: { 
                        $arrayElemAt: [
                            { $split: ["$location.address", ","] }, 
                            -2
                        ] 
                    }
                },
                count: { $sum: 1 },
                resolved: {
                    $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
                },
                avgVotes: { $avg: "$voteCount" }
            }
        },
        {
            $addFields: {
                city: { $trim: { input: "$_id.city" } }
            }
        },
        {
            $sort: { count: -1 }
        },
        {
            $limit: 10
        }
    ]);

    // Get hot spot coordinates
    const hotspots = await UserComplaint.find({
        ...matchQuery,
        'location.latitude': { $exists: true },
        'location.longitude': { $exists: true }
    })
    .select('location.latitude location.longitude category status voteCount')
    .limit(100)
    .lean();

    return {
        topCities: locationStats.map(loc => ({
            city: loc.city,
            count: loc.count,
            resolved: loc.resolved,
            resolutionRate: ((loc.resolved / loc.count) * 100).toFixed(2),
            avgVotes: loc.avgVotes.toFixed(1)
        })),
        hotspots: hotspots.map(spot => ({
            lat: spot.location.latitude,
            lng: spot.location.longitude,
            category: spot.category,
            status: spot.status,
            votes: spot.voteCount
        }))
    };
}

// ==================== TIME PATTERN ANALYSIS ====================

async function getTimeAnalysis(matchQuery) {
    // Hour of day analysis
    const hourlyPattern = await UserComplaint.aggregate([
        {
            $match: matchQuery
        },
        {
            $group: {
                _id: { $hour: "$createdAt" },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    // Day of week analysis
    const weekdayPattern = await UserComplaint.aggregate([
        {
            $match: matchQuery
        },
        {
            $group: {
                _id: { $dayOfWeek: "$createdAt" },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
        hourlyPattern: hourlyPattern.map(h => ({
            hour: h._id,
            count: h.count
        })),
        weekdayPattern: weekdayPattern.map(d => ({
            day: dayNames[d._id - 1],
            count: d.count
        })),
        peakHour: hourlyPattern.reduce((max, h) => h.count > max.count ? h : max, hourlyPattern[0]),
        peakDay: weekdayPattern.reduce((max, d) => d.count > max.count ? d : max, weekdayPattern[0])
    };
}

// ==================== COMPARISON METRICS ====================

async function getComparisonMetrics(startDate, endDate, matchQuery) {
    // Calculate previous period
    const periodLength = endDate - startDate;
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate - periodLength);

    const [currentPeriod, previousPeriod] = await Promise.all([
        UserComplaint.countDocuments(matchQuery),
        UserComplaint.countDocuments({
            ...matchQuery,
            createdAt: { $gte: prevStartDate, $lt: prevEndDate }
        })
    ]);

    const [currentResolved, previousResolved] = await Promise.all([
        UserComplaint.countDocuments({ ...matchQuery, status: 'resolved' }),
        UserComplaint.countDocuments({
            ...matchQuery,
            createdAt: { $gte: prevStartDate, $lt: prevEndDate },
            status: 'resolved'
        })
    ]);

    const growth = previousPeriod > 0 
        ? (((currentPeriod - previousPeriod) / previousPeriod) * 100).toFixed(2)
        : 100;

    const resolutionGrowth = previousResolved > 0
        ? (((currentResolved - previousResolved) / previousResolved) * 100).toFixed(2)
        : 100;

    return {
        currentPeriod: {
            complaints: currentPeriod,
            resolved: currentResolved
        },
        previousPeriod: {
            complaints: previousPeriod,
            resolved: previousResolved
        },
        growth: {
            complaints: parseFloat(growth),
            resolved: parseFloat(resolutionGrowth)
        }
    };
}

// ==================== HELPER FUNCTIONS ====================

async function calculateAverageResolutionTime(matchQuery) {
    const result = await UserComplaint.aggregate([
        {
            $match: { ...matchQuery, status: 'resolved' }
        },
        {
            $group: {
                _id: null,
                avgTime: {
                    $avg: { $subtract: ["$updatedAt", "$createdAt"] }
                }
            }
        }
    ]);

    return result.length > 0 ? msToHours(result[0].avgTime) : null;
}

async function calculateAverageResponseTime(matchQuery) {
    const result = await ChatMessage.aggregate([
        {
            $match: {
                createdAt: matchQuery.createdAt,
                senderModel: { $in: ['Staff', 'Admin'] }
            }
        },
        {
            $lookup: {
                from: 'usercomplaints',
                localField: 'complaintId',
                foreignField: '_id',
                as: 'complaint'
            }
        },
        {
            $unwind: '$complaint'
        },
        {
            $group: {
                _id: "$complaintId",
                firstResponse: { $min: "$createdAt" },
                complaintCreated: { $first: "$complaint.createdAt" }
            }
        },
        {
            $group: {
                _id: null,
                avgResponseTime: {
                    $avg: { $subtract: ["$firstResponse", "$complaintCreated"] }
                }
            }
        }
    ]);

    return result.length > 0 ? msToHours(result[0].avgResponseTime) : null;
}

async function calculateSatisfactionScore(matchQuery) {
    // This would need a rating/feedback system in your UserComplaint model
    // For now, using resolution rate as a proxy
    const [total, resolved] = await Promise.all([
        UserComplaint.countDocuments(matchQuery),
        UserComplaint.countDocuments({ ...matchQuery, status: 'resolved' })
    ]);

    return total > 0 ? ((resolved / total) * 100).toFixed(2) : 0;
}

function fillMissingDates(data, startDate, endDate) {
    const filled = [];
    const dataMap = new Map(data.map(d => [d._id, d]));
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const existing = dataMap.get(dateStr);
        
        filled.push({
            date: dateStr,
            created: existing?.created || 0,
            pending: existing?.pending || 0,
            inProgress: existing?.inProgress || 0,
            resolved: existing?.resolved || 0,
            rejected: existing?.rejected || 0
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return filled;
}

function msToHours(ms) {
    if (!ms) return null;
    return (ms / (1000 * 60 * 60)).toFixed(2);
}

// ==================== EXPORT DATA ====================

export const exportAnalyticsData = asyncHandler(async (req, res) => {
    const { format = 'json', timeRange = '30d' } = req.query;
    
    // Get comprehensive analytics
    const analytics = await getComprehensiveAnalytics(req, res);
    
    if (format === 'csv') {
        // Convert to CSV format
        const csv = convertToCSV(analytics.data);
        res.header('Content-Type', 'text/csv');
        res.attachment(`analytics-${Date.now()}.csv`);
        return res.send(csv);
    }
    
    // Default JSON format
    res.header('Content-Type', 'application/json');
    res.attachment(`analytics-${Date.now()}.json`);
    res.send(JSON.stringify(analytics, null, 2));
});

function convertToCSV(data) {
    // Implement CSV conversion logic
    // This is a simplified version
    let csv = '';
    
    // Add overview metrics
    csv += 'Metric,Value\n';
    csv += `Total Complaints,${data.overview.complaints.total}\n`;
    csv += `Active Complaints,${data.overview.complaints.active}\n`;
    csv += `Resolved Complaints,${data.overview.complaints.resolved}\n`;
    csv += `Resolution Rate,${data.overview.complaints.resolutionRate}%\n`;
    
    return csv;
}

export default {
    getComprehensiveAnalytics,
    exportAnalyticsData
};