import UserComplaint from "../models/UserComplaint.models.js";
import priorityService from '../services/priority.service.js';

// GET all issues - PUBLIC
export const handleAllIssueFetch = async (req, res) => {
    try {
        const { status } = req.query;
        
        const statusMap = {
            'Open': 'pending',
            'In-Progress': 'in-progress', 
            'Closed': ['resolved', 'rejected']
        };
        
        let filter = {};
        
        if (status && status !== 'All') {
            if (status === 'Closed') {
                filter.status = { $in: statusMap[status] };
            } else {
                filter.status = statusMap[status];
            }
        }
        
        const complaints = await UserComplaint.find(filter)
            .sort({ createdAt: -1 })
            .populate('user', 'name email');

        res.json({
            success: true,
            data: complaints,
            count: complaints.length
        });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching complaints'
        });
    }
};

export const handleSingleUserIssueFetch = async (req, res)=>{
    try {
        const userIssues = await UserComplaint.find({ user: req.user._id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: userIssues.length,
            data: userIssues
        });
    } 
    catch (error) {
        console.error('Error fetching user issues:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
}

// 🔧 FIXED: POST create issue - PROTECTED (with proper location handling + AI priority)
export const handleIssueGeneration = async (req, res) => {
    try {
        const { title, description, location, category, images, userId } = req.body;
        
        // Use userId from body OR from auth middleware
        const complaintUserId = userId || req.user?._id;

        // 🔧 FIX #1: Validation with proper error messages
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required"
            });
        }

        // 🔧 FIX #2: Handle location properly - support both object and string
        let locationData = {
            address: '',
            latitude: null,
            longitude: null
        };

        if (typeof location === 'string') {
            // Legacy format: just a string address
            locationData.address = location;
        } else if (typeof location === 'object' && location !== null) {
            // New format: object with address, lat, lon
            locationData = {
                address: location.address || '',
                latitude: location.latitude || null,
                longitude: location.longitude || null
            };
        }

        if (!locationData.address || locationData.address.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Location is required"
            });
        }

        // 🔧 FIX #3: Auto-assign priority using AI with better error handling
        let priority = 'medium'; // Default fallback
        let prioritySource = 'fallback';
        
        try {
            console.log('🤖 Calling AI priority service...');
            priority = await priorityService.analyzePriority({
                title,
                description,
                category: category || 'other',
                department: null
            });
            prioritySource = 'ai';
            console.log(`✅ AI assigned priority: ${priority} for complaint: ${title}`);
        } catch (aiError) {
            console.error('⚠️ AI priority assignment failed:', aiError.message);
            // Fallback to rule-based priority
            priority = calculatePriorityFallback(title, description, category);
            prioritySource = 'rule-based';
            console.log(`🔄 Using rule-based priority: ${priority}`);
        }

        // 🔧 FIX #4: Create complaint with proper structure
        const complaint = new UserComplaint({
            title: title.trim(),
            description: description.trim(),
            location: locationData,
            images: images || [],
            category: category || 'other',
            user: complaintUserId,
            status: 'pending',
            priority: priority,
            autoPriorityAssigned: prioritySource === 'ai',
            manualPriorityOverridden: false
        });
        
        await complaint.save();
        await complaint.populate('user', 'name email');
        
        console.log(`✅ Complaint created successfully:`, {
            id: complaint._id,
            title: complaint.title,
            priority: complaint.priority,
            prioritySource: prioritySource,
            location: complaint.location
        });

        res.status(201).json({ 
            success: true,
            message: `Complaint submitted successfully with ${prioritySource === 'ai' ? 'AI-assigned' : 'rule-based'} priority`, 
            data: complaint,
            priorityAssignedBy: prioritySource
        });
    } catch (error) {
        console.error('❌ Error submitting complaint:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error submitting complaint: ' + error.message
        });
    }
};

// 🔧 NEW: Fallback priority calculation
function calculatePriorityFallback(title, description, category) {
    const text = `${title} ${description}`.toLowerCase();

    // Critical priority keywords
    const criticalKeywords = [
        'emergency', 'urgent', 'critical', 'accident', 'fire', 'flood',
        'leak', 'collapse', 'injury', 'danger', 'hazard', 'life threatening',
        'explosion', 'gas leak', 'chemical', 'electrocution', 'building collapse',
        'medical', 'death', 'dying', 'trapped'
    ];

    // High priority keywords
    const highKeywords = [
        'broken', 'stuck', 'power cut', 'water outage', 'no electricity',
        'no water', 'sewage', 'blocked', 'major', 'severe', 'damage',
        'theft', 'robbery', 'fight', 'crime', 'violence', 'overflow'
    ];

    // Medium priority keywords
    const mediumKeywords = [
        'issue', 'problem', 'not working', 'repair', 'fix',
        'slow', 'delay', 'quality', 'service', 'complaint', 'maintenance',
        'broken', 'cracked'
    ];

    // Check for critical priority
    if (criticalKeywords.some(keyword => text.includes(keyword))) {
        return 'critical';
    }

    // Check for high priority
    if (highKeywords.some(keyword => text.includes(keyword))) {
        return 'high';
    }

    // Check for medium priority
    if (mediumKeywords.some(keyword => text.includes(keyword))) {
        return 'medium';
    }

    // Category-based fallback
    const categoryPriorityMap = {
        'water': 'high',
        'electricity': 'high', 
        'road': 'medium',
        'sanitation': 'medium',
        'security': 'high',
        'transport': 'medium',
        'other': 'low'
    };

    return categoryPriorityMap[category] || 'low';
}

// Admin override priority
export const adminOverridePriority = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { priority } = req.body;
        const adminId = req.admin._id;

        if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid priority value. Must be low, medium, high, or critical'
            });
        }

        const complaint = await UserComplaint.findById(complaintId);
        
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        const originalPriority = complaint.priority;

        complaint.priority = priority;
        complaint.manualPriorityOverridden = true;
        complaint.priorityOverriddenBy = 'admin';
        complaint.priorityOverriddenAt = new Date();
        complaint.priorityOverriddenById = adminId;
        complaint.priorityOverriddenByModel = 'Admin';

        await complaint.save();

        console.log(`🔧 Priority overridden for complaint ${complaintId} by admin ${adminId}`);
        console.log(`   Original: ${originalPriority} → New: ${priority}`);

        res.status(200).json({
            success: true,
            message: 'Priority updated successfully',
            data: complaint
        });
    } catch (error) {
        console.error('Error overriding priority:', error);
        res.status(500).json({
            success: false,
            message: 'Error overriding priority'
        });
    }
};

// Get current user's complaints
export const handleGetMyIssues = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        
        const myIssues = await UserComplaint.find({ 
            user: userId 
        }).sort({ createdAt: -1 });
        
        return res.status(200).json({
            success: true,
            data: myIssues
        });
    } catch (error) {
        console.error("Error fetching user's issues:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching your issues"
        });
    }
};

// Get statistics
export const handleGetStats = async (req, res) => {
    try {
        const total = await UserComplaint.countDocuments();
        const resolved = await UserComplaint.countDocuments({ status: 'resolved' });
        const pending = await UserComplaint.countDocuments({ status: 'pending' });
        const inProgress = await UserComplaint.countDocuments({ status: 'in-progress' });
        
        const critical = await UserComplaint.countDocuments({ priority: 'critical' });
        const high = await UserComplaint.countDocuments({ priority: 'high' });
        const medium = await UserComplaint.countDocuments({ priority: 'medium' });
        const low = await UserComplaint.countDocuments({ priority: 'low' });
        
        return res.status(200).json({
            success: true,
            data: {
                total,
                resolved,
                pending,
                inProgress,
                priority: {
                    critical,
                    high,
                    medium,
                    low
                }
            }
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching statistics"
        });
    }
};

// 🔧 FIXED: GET single issue - PUBLIC (with proper location handling)
export const handleSingleIssueFetch = async (req, res) => {
    try {
        const complaint = await UserComplaint.findById(req.params.id)
            .populate('user', 'name email');

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        // 🔧 FIX: Ensure location is always in proper format for frontend
        if (typeof complaint.location === 'string') {
            complaint.location = {
                address: complaint.location,
                latitude: null,
                longitude: null
            };
        }

        res.json({
            success: true,
            data: complaint
        });
    } catch (error) {
        console.error('Error fetching complaint:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching complaint'
        });
    }
};

export const handleComplaintLocations = async (req, res) => {
    try {
        const complaints = await UserComplaint.find(
            {
                "location.latitude": { $exists: true, $ne: null },
                "location.longitude": { $exists: true, $ne: null }
            },
            {
                title: 1,
                category: 1,
                priority: 1,
                status: 1,
                "location.latitude": 1,
                "location.longitude": 1,
                "location.address": 1,
                createdAt: 1,
                autoPriorityAssigned: 1,
                manualPriorityOverridden: 1
            }
        );

        const formatted = complaints.map(c => ({
            title: c.title,
            category: c.category,
            priority: c.priority,
            status: c.status,
            latitude: c.location?.latitude,
            longitude: c.location?.longitude,
            address: c.location?.address || "N/A",
            date: c.createdAt,
            prioritySource: c.manualPriorityOverridden ? 'manual' : (c.autoPriorityAssigned ? 'ai' : 'rule-based')
        }));

        res.json({
            success: true,
            count: formatted.length,
            data: formatted
        });
    } catch (error) {
        console.error("Error fetching complaint locations:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching complaint locations"
        });
    }
};

// PUT vote on issue - PUBLIC
export const handleVoteCount = async (req, res) => {
    try {
        const complaint = await UserComplaint.findById(req.params.id);
        
        if (!complaint) {
            return res.status(404).json({ 
                success: false,
                message: 'Complaint not found' 
            });
        }

        complaint.voteCount = (complaint.voteCount || 0) + 1;
        await complaint.save();

        res.json({ 
            success: true,
            message: 'Vote added successfully', 
            data: { voteCount: complaint.voteCount }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error voting on complaint'
        });
    }
};

// Get complaints filtered by priority
export const getComplaintsByPriority = async (req, res) => {
    try {
        const { priority } = req.params;
        
        if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid priority value'
            });
        }

        const complaints = await UserComplaint.find({ priority })
            .populate('user', 'name email')
            .sort('-createdAt');

        res.json({
            success: true,
            count: complaints.length,
            data: complaints
        });
    } catch (error) {
        console.error('Error fetching complaints by priority:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching complaints'
        });
    }
};