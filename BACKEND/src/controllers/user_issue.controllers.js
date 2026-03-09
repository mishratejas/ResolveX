// import UserComplaint from "../models/UserComplaint.models.js";
// import priorityService from "../services/priority.service.js";
// import {
//   truncateCoordinates,
//   getBoundingBox,
//   calculateDistance,
//   areComplaintsSimilar,
// } from "../utils/locationUtils.js";
// // GET all issues - PUBLIC (with workspace filtering)
// export const handleAllIssueFetch = async (req, res) => {
//   try {
//     const { status, workspaceId } = req.query;

//     const statusMap = {
//       Open: "pending",
//       "In-Progress": "in-progress",
//       Closed: ["resolved", "rejected"],
//     };

//     let filter = {};

//     // 🔧 FIX: Add workspace filtering
//     // If workspaceId is provided, filter by that workspace
//     if (workspaceId) {
//       filter.adminId = workspaceId;
//     }

//     if (status && status !== "All") {
//       if (status === "Closed") {
//         filter.status = { $in: statusMap[status] };
//       } else {
//         filter.status = statusMap[status];
//       }
//     }

//     const complaints = await UserComplaint.find(filter)
//       .sort({ createdAt: -1 })
//       .populate("user", "name email")
//       .populate("adminId", "workspaceCode name"); // 🔧 FIX: Populate workspace info

//     res.json({
//       success: true,
//       data: complaints,
//       count: complaints.length,
//     });
//   } catch (error) {
//     console.error("Error fetching complaints:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching complaints",
//     });
//   }
// };

// export const handleSingleUserIssueFetch = async (req, res) => {
//   try {
//     const { workspaceId } = req.query;
//     let filter = { user: req.user._id };
    
//     // Add workspace filter if provided
//     if (workspaceId) {
//       filter.adminId = workspaceId;
//     }

//     const userIssues = await UserComplaint.find(filter)
//       .sort({ createdAt: -1 })
//       .populate("adminId", "workspaceCode organizationName name"); // Populate workspace info

//     res.status(200).json({
//       success: true,
//       count: userIssues.length,
//       data: userIssues,
//     });
//   } catch (error) {
//     console.error("Error fetching user issues:", error);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };

// export const checkDuplicateComplaint = async (req, res) => {
//   try {
//     const { title, description, location, category, workspaceId } = req.body; // 🔧 FIX: Add workspaceId
//     const userId = req.user?._id;

//     // Validate required fields
//     if (!location || !location.latitude || !location.longitude) {
//       return res.status(400).json({
//         success: false,
//         message: "Location coordinates are required for duplicate check",
//       });
//     }

//     // 🔧 FIX: Validate workspaceId
//     if (!workspaceId) {
//       return res.status(400).json({
//         success: false,
//         message: "Workspace ID is required for duplicate check",
//       });
//     }

//     const { latitude, longitude } = location;

//     // Get bounding box for ~150 meter radius
//     const bbox = getBoundingBox(latitude, longitude, 150);

//     // Find potential duplicates within bounding box AND same workspace
//     const nearbyComplaints = await UserComplaint.find({
//       "location.latitude": { $gte: bbox.minLat, $lte: bbox.maxLat },
//       "location.longitude": { $gte: bbox.minLng, $lte: bbox.maxLng },
//       status: { $in: ["pending", "in-progress"] }, // Only active complaints
//       _id: { $ne: req.body.complaintId }, // Exclude current complaint if editing
//       adminId: workspaceId // 🔧 CRITICAL: Only check within the same workspace
//     }).populate("user", "name email");

//     // Filter for truly similar complaints
//     const similarComplaints = nearbyComplaints.filter((existing) => {
//       // Don't show user's own complaints as duplicates
//       if (existing.user._id.toString() === userId?.toString()) return false;

//       return areComplaintsSimilar({ location, title, category }, existing, {
//         maxDistance: 150,
//         titleSimilarityThreshold: 0.3,
//         sameCategoryRequired: false,
//       });
//     });

//     // Check if user has already voted on any of these
//     const userVotedComplaints = similarComplaints.filter((c) =>
//       c.voters?.includes(userId),
//     );

//     res.json({
//       success: true,
//       hasDuplicates: similarComplaints.length > 0,
//       duplicates: similarComplaints.map((c) => ({
//         _id: c._id,
//         title: c.title,
//         description: c.description,
//         category: c.category,
//         status: c.status,
//         priority: c.priority,
//         voteCount: c.voteCount || 0,
//         hasUserVoted: c.voters?.includes(userId) || false,
//         user: {
//           name: c.user.name,
//           email: c.user.email,
//         },
//         location: c.location,
//         createdAt: c.createdAt,
//         distance: calculateDistance(
//           latitude,
//           longitude,
//           c.location.latitude,
//           c.location.longitude,
//         ).toFixed(0),
//       })),
//       userVotedComplaints: userVotedComplaints.length > 0,
//     });
//   } catch (error) {
//     console.error("Error checking duplicates:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error checking for duplicate complaints",
//     });
//   }
// };

// export const handleIssueGeneration = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       location,
//       category,
//       images,
//       userId,
//       skipDuplicateCheck,
//       adminId // 🔧 CRITICAL: Destructure adminId from request body
//     } = req.body;

//     const complaintUserId = userId || req.user?._id;

//     // Validation
//     if (!title || !description) {
//       return res.status(400).json({
//         success: false,
//         message: "Title and description are required",
//       });
//     }

//     // Handle location
//     let locationData = {
//       address: "",
//       latitude: null,
//       longitude: null,
//     };

//     if (typeof location === "string") {
//       locationData.address = location;
//     } else if (typeof location === "object" && location !== null) {
//       locationData = {
//         address: location.address || "",
//         latitude: location.latitude || null,
//         longitude: location.longitude || null,
//       };
//     }

//     if (!locationData.address || locationData.address.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Location is required",
//       });
//     }

//     // 🔧 CRITICAL FIX: Validate adminId (workspace ID)
//     if (!adminId) {
//       return res.status(400).json({
//         success: false,
//         message: "Workspace selection is required. Please select a workspace before submitting."
//       });
//     }

//     // Check for duplicates if coordinates exist and skipDuplicateCheck is false
//     if (
//       !skipDuplicateCheck &&
//       locationData.latitude &&
//       locationData.longitude
//     ) {
//       const bbox = getBoundingBox(
//         locationData.latitude,
//         locationData.longitude,
//         150,
//       );

//       const nearbyComplaints = await UserComplaint.find({
//         "location.latitude": { $gte: bbox.minLat, $lte: bbox.maxLat },
//         "location.longitude": { $gte: bbox.minLng, $lte: bbox.maxLng },
//         status: { $in: ["pending", "in-progress"] },
//         user: { $ne: complaintUserId }, // Exclude user's own complaints
//         adminId: adminId // 🔧 FIX: Only check duplicates within the same workspace
//       });

//       const similarComplaints = nearbyComplaints.filter((existing) =>
//         areComplaintsSimilar(
//           { location: locationData, title, category },
//           existing,
//           {
//             maxDistance: 150,
//             titleSimilarityThreshold: 0.5,
//             sameCategoryRequired: true,
//           },
//         ),
//       );

//       if (similarComplaints.length > 0) {
//         return res.status(409).json({
//           success: false,
//           message: "Similar complaint already exists in this area",
//           hasDuplicates: true,
//           duplicates: similarComplaints.map((c) => ({
//             _id: c._id,
//             title: c.title,
//             description: c.description,
//             category: c.category,
//             status: c.status,
//             voteCount: c.voteCount || 0,
//             hasUserVoted: c.voters?.includes(complaintUserId) || false,
//           })),
//         });
//       }
//     }

//     // Auto-assign priority
//     let priority = "medium";
//     let prioritySource = "fallback";

//     try {
//       console.log("🤖 Calling AI priority service...");
//       priority = await priorityService.analyzePriority({
//         title,
//         description,
//         category: category || "other",
//         department: null,
//       });
//       prioritySource = "ai";
//       console.log(
//         `✅ AI assigned priority: ${priority} for complaint: ${title}`,
//       );
//     } catch (aiError) {
//       console.error("⚠️ AI priority assignment failed:", aiError.message);
//       priority = calculatePriorityFallback(title, description, category);
//       prioritySource = "rule-based";
//       console.log(`🔄 Using rule-based priority: ${priority}`);
//     }

//     // 🔧 FIX: Create complaint with the provided adminId
//     const complaint = new UserComplaint({
//       title: title.trim(),
//       description: description.trim(),
//       location: locationData,
//       images: images || [],
//       category: category || "other",
//       user: complaintUserId,
//       adminId: adminId, // 🔧 CRITICAL: Use the adminId from request body
//       status: "pending",
//       priority: priority,
//       autoPriorityAssigned: prioritySource === "ai",
//       manualPriorityOverridden: false,
//       voteCount: 0,
//       voters: [],
//     });

//     await complaint.save();
//     await complaint.populate("user", "name email");
//     await complaint.populate("adminId", "workspaceCode organizationName name"); // Populate workspace info

//     console.log(`✅ Complaint created successfully:`, {
//       id: complaint._id,
//       title: complaint.title,
//       priority: complaint.priority,
//       prioritySource: prioritySource,
//       workspaceId: complaint.adminId
//     });

//     res.status(201).json({
//       success: true,
//       message: `Complaint submitted successfully with ${prioritySource === "ai" ? "AI-assigned" : "rule-based"} priority`,
//       data: complaint,
//       priorityAssignedBy: prioritySource,
//     });
//   } catch (error) {
//     console.error("❌ Error submitting complaint:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error submitting complaint: " + error.message,
//     });
//   }
// };

// // 🔧 NEW: Fallback priority calculation
// function calculatePriorityFallback(title, description, category) {
//   const text = `${title} ${description}`.toLowerCase();

//   // Critical priority keywords
//   const criticalKeywords = [
//     "emergency",
//     "urgent",
//     "critical",
//     "accident",
//     "fire",
//     "flood",
//     "leak",
//     "collapse",
//     "injury",
//     "danger",
//     "hazard",
//     "life threatening",
//     "explosion",
//     "gas leak",
//     "chemical",
//     "electrocution",
//     "building collapse",
//     "medical",
//     "death",
//     "dying",
//     "trapped",
//   ];

//   // High priority keywords
//   const highKeywords = [
//     "broken",
//     "stuck",
//     "power cut",
//     "water outage",
//     "no electricity",
//     "no water",
//     "sewage",
//     "blocked",
//     "major",
//     "severe",
//     "damage",
//     "theft",
//     "robbery",
//     "fight",
//     "crime",
//     "violence",
//     "overflow",
//   ];

//   // Medium priority keywords
//   const mediumKeywords = [
//     "issue",
//     "problem",
//     "not working",
//     "repair",
//     "fix",
//     "slow",
//     "delay",
//     "quality",
//     "service",
//     "complaint",
//     "maintenance",
//     "broken",
//     "cracked",
//   ];

//   // Check for critical priority
//   if (criticalKeywords.some((keyword) => text.includes(keyword))) {
//     return "critical";
//   }

//   // Check for high priority
//   if (highKeywords.some((keyword) => text.includes(keyword))) {
//     return "high";
//   }

//   // Check for medium priority
//   if (mediumKeywords.some((keyword) => text.includes(keyword))) {
//     return "medium";
//   }

//   // Category-based fallback
//   const categoryPriorityMap = {
//     water: "high",
//     electricity: "high",
//     road: "medium",
//     sanitation: "medium",
//     security: "high",
//     transport: "medium",
//     other: "low",
//   };

//   return categoryPriorityMap[category] || "low";
// }

// // Admin override priority
// export const adminOverridePriority = async (req, res) => {
//   try {
//     const { complaintId } = req.params;
//     const { priority } = req.body;
//     const adminId = req.admin._id;

//     if (!["low", "medium", "high", "critical"].includes(priority)) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid priority value. Must be low, medium, high, or critical",
//       });
//     }

//     const complaint = await UserComplaint.findById(complaintId);

//     if (!complaint) {
//       return res.status(404).json({
//         success: false,
//         message: "Complaint not found",
//       });
//     }

//     const originalPriority = complaint.priority;

//     complaint.priority = priority;
//     complaint.manualPriorityOverridden = true;
//     complaint.priorityOverriddenBy = "admin";
//     complaint.priorityOverriddenAt = new Date();
//     complaint.priorityOverriddenById = adminId;
//     complaint.priorityOverriddenByModel = "Admin";

//     await complaint.save();

//     console.log(
//       `🔧 Priority overridden for complaint ${complaintId} by admin ${adminId}`,
//     );
//     console.log(`   Original: ${originalPriority} → New: ${priority}`);

//     res.status(200).json({
//       success: true,
//       message: "Priority updated successfully",
//       data: complaint,
//     });
//   } catch (error) {
//     console.error("Error overriding priority:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error overriding priority",
//     });
//   }
// };

// // Get current user's complaints
// export const handleGetMyIssues = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user._id;
//     const { workspaceId } = req.query;
    
//     let filter = { user: userId };
    
//     // Add workspace filter if provided
//     if (workspaceId) {
//       filter.adminId = workspaceId;
//     }

//     const myIssues = await UserComplaint.find(filter)
//       .sort({ createdAt: -1 })
//       .populate("adminId", "workspaceCode organizationName name");

//     return res.status(200).json({
//       success: true,
//       data: myIssues,
//     });
//   } catch (error) {
//     console.error("Error fetching user's issues:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching your issues",
//     });
//   }
// };

// // Get statistics
// export const handleGetStats = async (req, res) => {
//   try {
//     const total = await UserComplaint.countDocuments();
//     const resolved = await UserComplaint.countDocuments({ status: "resolved" });
//     const pending = await UserComplaint.countDocuments({ status: "pending" });
//     const inProgress = await UserComplaint.countDocuments({
//       status: "in-progress",
//     });

//     const critical = await UserComplaint.countDocuments({
//       priority: "critical",
//     });
//     const high = await UserComplaint.countDocuments({ priority: "high" });
//     const medium = await UserComplaint.countDocuments({ priority: "medium" });
//     const low = await UserComplaint.countDocuments({ priority: "low" });

//     return res.status(200).json({
//       success: true,
//       data: {
//         total,
//         resolved,
//         pending,
//         inProgress,
//         priority: {
//           critical,
//           high,
//           medium,
//           low,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching stats:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching statistics",
//     });
//   }
// };

// // 🔧 FIXED: GET single issue - PUBLIC (with proper location handling)
// export const handleSingleIssueFetch = async (req, res) => {
//   try {
//     const complaint = await UserComplaint.findById(req.params.id).populate(
//       "user",
//       "name email",
//     );

//     if (!complaint) {
//       return res.status(404).json({
//         success: false,
//         message: "Complaint not found",
//       });
//     }

//     // 🔧 FIX: Ensure location is always in proper format for frontend
//     if (typeof complaint.location === "string") {
//       complaint.location = {
//         address: complaint.location,
//         latitude: null,
//         longitude: null,
//       };
//     }

//     res.json({
//       success: true,
//       data: complaint,
//     });
//   } catch (error) {
//     console.error("Error fetching complaint:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching complaint",
//     });
//   }
// };

// export const handleComplaintLocations = async (req, res) => {
//   try {
//     const complaints = await UserComplaint.find(
//       {
//         "location.latitude": { $exists: true, $ne: null },
//         "location.longitude": { $exists: true, $ne: null },
//       },
//       {
//         title: 1,
//         category: 1,
//         priority: 1,
//         status: 1,
//         "location.latitude": 1,
//         "location.longitude": 1,
//         "location.address": 1,
//         createdAt: 1,
//         autoPriorityAssigned: 1,
//         manualPriorityOverridden: 1,
//       },
//     );

//     const formatted = complaints.map((c) => ({
//       title: c.title,
//       category: c.category,
//       priority: c.priority,
//       status: c.status,
//       latitude: c.location?.latitude,
//       longitude: c.location?.longitude,
//       address: c.location?.address || "N/A",
//       date: c.createdAt,
//       prioritySource: c.manualPriorityOverridden
//         ? "manual"
//         : c.autoPriorityAssigned
//           ? "ai"
//           : "rule-based",
//     }));

//     res.json({
//       success: true,
//       count: formatted.length,
//       data: formatted,
//     });
//   } catch (error) {
//     console.error("Error fetching complaint locations:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error fetching complaint locations",
//     });
//   }
// };

// // PUT vote on issue - PUBLIC
// export const handleVoteCount = async (req, res) => {
//   try {
//     const complaint = await UserComplaint.findById(req.params.id);

//     if (!complaint) {
//       return res.status(404).json({
//         success: false,
//         message: "Complaint not found",
//       });
//     }

//     complaint.voteCount = (complaint.voteCount || 0) + 1;
//     await complaint.save();

//     res.json({
//       success: true,
//       message: "Vote added successfully",
//       data: { voteCount: complaint.voteCount },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error voting on complaint",
//     });
//   }
// };

// // Get complaints filtered by priority
// export const getComplaintsByPriority = async (req, res) => {
//   try {
//     const { priority } = req.params;

//     if (!["low", "medium", "high", "critical"].includes(priority)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid priority value",
//       });
//     }

//     const complaints = await UserComplaint.find({ priority })
//       .populate("user", "name email")
//       .sort("-createdAt");

//     res.json({
//       success: true,
//       count: complaints.length,
//       data: complaints,
//     });
//   } catch (error) {
//     console.error("Error fetching complaints by priority:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching complaints",
//     });
//   }
// };

// export const handleUpvoteComplaint = async (req, res) => {
//   try {
//     const { complaintId } = req.params;
//     const userId = req.user?._id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Authentication required",
//       });
//     }

//     const complaint = await UserComplaint.findById(complaintId);

//     if (!complaint) {
//       return res.status(404).json({
//         success: false,
//         message: "Complaint not found",
//       });
//     }

//     // Check if user already voted
//     if (complaint.voters?.includes(userId)) {
//       return res.status(400).json({
//         success: false,
//         message: "You have already upvoted this complaint",
//       });
//     }

//     // Add vote
//     complaint.voteCount = (complaint.voteCount || 0) + 1;
//     complaint.voters = complaint.voters || [];
//     complaint.voters.push(userId);

//     await complaint.save();

//     res.json({
//       success: true,
//       message: "Complaint upvoted successfully",
//       data: {
//         voteCount: complaint.voteCount,
//         hasUserVoted: true,
//       },
//     });
//   } catch (error) {
//     console.error("Error upvoting complaint:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error upvoting complaint",
//     });
//   }
// };


import UserComplaint from "../models/UserComplaint.models.js"; // Note: Fixed '.models.js' to '.model.js' based on your previous messages
import priorityService from "../services/priority.service.js";
import {
  truncateCoordinates,
  getBoundingBox,
  calculateDistance,
  areComplaintsSimilar,
} from "../utils/locationUtils.js";

// 🚀 NEW: Import our Load Balancer!
import { getLeastLoadedStaff } from "../utils/loadBalancer.js";
import NotificationService from "../services/notification.service.js";
import Staff from "../models/Staff.models.js";

export const handleAllIssueFetch = async (req, res) => {
  try {
    const { status, workspaceId } = req.query;

    console.log('📥 Fetching complaints with filters:', { status, workspaceId });

    const statusMap = {
      Open: "pending",
      "In-Progress": "in-progress",
      Closed: ["resolved", "rejected"],
    };

    let filter = {};

    // 🔥 CRITICAL FIX: Always require workspaceId
    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: "workspaceId is required",
        data: []
      });
    }

    filter.adminId = workspaceId;

    if (status && status !== "All") {
      if (status === "Closed") {
        filter.status = { $in: statusMap[status] };
      } else {
        filter.status = statusMap[status];
      }
    }

    const complaints = await UserComplaint.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("adminId", "workspaceCode organizationName name");

    // 🔥 DEBUG: Log location data for first few complaints
    console.log('📍 Location data check:');
    complaints.slice(0, 3).forEach((c, i) => {
      console.log(`Complaint ${i + 1}:`, {
        id: c._id,
        title: c.title,
        location: c.location,
        address: c.location?.address,
        lat: c.location?.latitude,
        lng: c.location?.longitude
      });
    });

    res.json({
      success: true,
      data: complaints,
      count: complaints.length,
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching complaints",
    });
  }
};

export const handleSingleUserIssueFetch = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    let filter = { user: req.user._id };
    
    if (workspaceId) {
      filter.adminId = workspaceId;
    }

    const userIssues = await UserComplaint.find(filter)
      .sort({ createdAt: -1 })
      .populate("adminId", "workspaceCode organizationName name"); 

    res.status(200).json({
      success: true,
      count: userIssues.length,
      data: userIssues,
    });
  } catch (error) {
    console.error("Error fetching user issues:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const checkDuplicateComplaint = async (req, res) => {
  try {
    const { title, description, location, category, workspaceId } = req.body; 
    const userId = req.user?._id;

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: "Location coordinates are required for duplicate check",
      });
    }

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: "Workspace ID is required for duplicate check",
      });
    }

    const { latitude, longitude } = location;
    const bbox = getBoundingBox(latitude, longitude, 150);

    const nearbyComplaints = await UserComplaint.find({
      "location.latitude": { $gte: bbox.minLat, $lte: bbox.maxLat },
      "location.longitude": { $gte: bbox.minLng, $lte: bbox.maxLng },
      status: { $in: ["pending", "in-progress"] }, 
      _id: { $ne: req.body.complaintId }, 
      adminId: workspaceId 
    }).populate("user", "name email");

    const similarComplaints = nearbyComplaints.filter((existing) => {
      if (existing.user._id.toString() === userId?.toString()) return false;
      return areComplaintsSimilar({ location, title, category }, existing, {
        maxDistance: 150,
        titleSimilarityThreshold: 0.3,
        sameCategoryRequired: false,
      });
    });

    const userVotedComplaints = similarComplaints.filter((c) =>
      c.voters?.includes(userId),
    );

    res.json({
      success: true,
      hasDuplicates: similarComplaints.length > 0,
      duplicates: similarComplaints.map((c) => ({
        _id: c._id,
        title: c.title,
        description: c.description,
        category: c.category,
        status: c.status,
        priority: c.priority,
        voteCount: c.voteCount || 0,
        hasUserVoted: c.voters?.includes(userId) || false,
        user: { name: c.user.name, email: c.user.email },
        location: c.location,
        createdAt: c.createdAt,
        distance: calculateDistance(
          latitude, longitude, c.location.latitude, c.location.longitude,
        ).toFixed(0),
      })),
      userVotedComplaints: userVotedComplaints.length > 0,
    });
  } catch (error) {
    console.error("Error checking duplicates:", error);
    res.status(500).json({
      success: false,
      message: "Error checking for duplicate complaints",
    });
  }
};

export const handleIssueGeneration = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      category,
      department, // 🚀 NEW: Extracted department from frontend
      images,
      userId,
      skipDuplicateCheck,
      adminId 
    } = req.body;

    const complaintUserId = userId || req.user?._id;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required" });
    }

    let locationData = { address: "", latitude: null, longitude: null };

    if (typeof location === "string") {
      locationData.address = location;
    } else if (typeof location === "object" && location !== null) {
      locationData = {
        address: location.address || "",
        latitude: location.latitude || null,
        longitude: location.longitude || null,
      };
    }
    console.log('📍 Saving location:', locationData);
    
    if (!locationData.address || locationData.address.trim() === "") {
      return res.status(400).json({ success: false, message: "Location is required" });
    }

    if (!adminId) {
      return res.status(400).json({ success: false, message: "Workspace selection is required." });
    }

    if (!skipDuplicateCheck && locationData.latitude && locationData.longitude) {
      const bbox = getBoundingBox(locationData.latitude, locationData.longitude, 150);

      const nearbyComplaints = await UserComplaint.find({
        "location.latitude": { $gte: bbox.minLat, $lte: bbox.maxLat },
        "location.longitude": { $gte: bbox.minLng, $lte: bbox.maxLng },
        status: { $in: ["pending", "in-progress"] },
        user: { $ne: complaintUserId }, 
        adminId: adminId 
      });

      const similarComplaints = nearbyComplaints.filter((existing) =>
        areComplaintsSimilar({ location: locationData, title, category }, existing, {
          maxDistance: 150, titleSimilarityThreshold: 0.5, sameCategoryRequired: true,
        }),
      );

      if (similarComplaints.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Similar complaint already exists in this area",
          hasDuplicates: true,
          duplicates: similarComplaints.map((c) => ({
            _id: c._id, title: c.title, description: c.description, category: c.category,
            status: c.status, voteCount: c.voteCount || 0, hasUserVoted: c.voters?.includes(complaintUserId) || false,
          })),
        });
      }
    }

    let priority = "medium";
    let prioritySource = "fallback";

    try {
      console.log("🤖 Calling AI priority service...");
      priority = await priorityService.analyzePriority({
        title, description, category: category || "other", department: null,
      });
      prioritySource = "ai";
      console.log(`✅ AI assigned priority: ${priority} for complaint: ${title}`);
    } catch (aiError) {
      console.error("⚠️ AI priority assignment failed:", aiError.message);
      priority = calculatePriorityFallback(title, description, category);
      prioritySource = "rule-based";
      console.log(`🔄 Using rule-based priority: ${priority}`);
    }

    // 🚀 NEW: THE LOAD BALANCER EXECUTION
    let assignedStaffId = null;
    let initialStatus = "pending";

    if (department && adminId) {
      console.log(`⚖️ Running Load Balancer for Department: ${department}`);
      assignedStaffId = await getLeastLoadedStaff(department, adminId);
      
      if (assignedStaffId) {
        console.log(`🎯 Load Balancer assigned ticket to Staff: ${assignedStaffId}`);
        // Optional: If auto-assigned, instantly set to in-progress. 
        // Leave as 'pending' if you want staff to manually accept it first.
        // initialStatus = "in-progress"; 
      } else {
        console.log(`⚠️ No available staff found. Ticket remains Pending.`);
      }
    }

    const complaint = new UserComplaint({
      title: title.trim(),
      description: description.trim(),
      location: locationData,
      images: images || [],
      category: category || "other",
      user: complaintUserId,
      adminId: adminId, 
      department: department || null, // 🚀 Saved to DB
      assignedTo: assignedStaffId,    // 🚀 Auto-assigned by Load Balancer
      status: initialStatus,
      priority: priority,
      autoPriorityAssigned: prioritySource === "ai",
      manualPriorityOverridden: false,
      voteCount: 0,
      voters: [],
    });

    await complaint.save();
    await complaint.populate("user", "name email");
    await complaint.populate("adminId", "workspaceCode organizationName name"); 

    // 🔔 Send notifications
    try {
      // Notify user about complaint creation
      await NotificationService.notifyUserComplaintCreated(complaint);

      // Notify admin about new complaint (especially if high/critical priority)
      if (adminId && (priority === 'high' || priority === 'critical')) {
        await NotificationService.notifyAdminNewComplaint(complaint, adminId);
      }

      // Notify assigned staff if auto-assigned
      if (assignedStaffId) {
        const staff = await Staff.findById(assignedStaffId);
        if (staff) {
          await NotificationService.notifyStaffAssignment(complaint, staff);
        }
      }
    } catch (notifError) {
      console.error('Failed to send complaint creation notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    res.status(201).json({
      success: true,
      message: `Complaint submitted successfully with ${prioritySource === "ai" ? "AI-assigned" : "rule-based"} priority`,
      data: complaint,
      priorityAssignedBy: prioritySource,
    });
  } catch (error) {
    console.error("❌ Error submitting complaint:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting complaint: " + error.message,
    });
  }
};

function calculatePriorityFallback(title, description, category) {
  const text = `${title} ${description}`.toLowerCase();
  const criticalKeywords = ["emergency", "urgent", "critical", "accident", "fire", "flood", "leak", "collapse", "injury", "danger", "hazard", "life threatening", "explosion", "gas leak", "chemical", "electrocution", "building collapse", "medical", "death", "dying", "trapped"];
  const highKeywords = ["broken", "stuck", "power cut", "water outage", "no electricity", "no water", "sewage", "blocked", "major", "severe", "damage", "theft", "robbery", "fight", "crime", "violence", "overflow"];
  const mediumKeywords = ["issue", "problem", "not working", "repair", "fix", "slow", "delay", "quality", "service", "complaint", "maintenance", "broken", "cracked"];

  if (criticalKeywords.some((keyword) => text.includes(keyword))) return "critical";
  if (highKeywords.some((keyword) => text.includes(keyword))) return "high";
  if (mediumKeywords.some((keyword) => text.includes(keyword))) return "medium";

  const categoryPriorityMap = { water: "high", electricity: "high", road: "medium", sanitation: "medium", security: "high", transport: "medium", other: "low" };
  return categoryPriorityMap[category] || "low";
}

export const adminOverridePriority = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { priority } = req.body;
    const adminId = req.admin._id;

    if (!["low", "medium", "high", "critical"].includes(priority)) {
      return res.status(400).json({ success: false, message: "Invalid priority value. Must be low, medium, high, or critical" });
    }

    const complaint = await UserComplaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

    complaint.priority = priority;
    complaint.manualPriorityOverridden = true;
    complaint.priorityOverriddenBy = "admin";
    complaint.priorityOverriddenAt = new Date();
    complaint.priorityOverriddenById = adminId;
    complaint.priorityOverriddenByModel = "Admin";

    await complaint.save();
    res.status(200).json({ success: true, message: "Priority updated successfully", data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error overriding priority" });
  }
};

export const handleGetMyIssues = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { workspaceId } = req.query;
    
    let filter = { user: userId };
    if (workspaceId) filter.adminId = workspaceId;

    const myIssues = await UserComplaint.find(filter)
      .sort({ createdAt: -1 })
      .populate("adminId", "workspaceCode organizationName name");

    return res.status(200).json({ success: true, data: myIssues });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching your issues" });
  }
};

export const handleGetStats = async (req, res) => {
  try {
    const total = await UserComplaint.countDocuments();
    const resolved = await UserComplaint.countDocuments({ status: "resolved" });
    const pending = await UserComplaint.countDocuments({ status: "pending" });
    const inProgress = await UserComplaint.countDocuments({ status: "in-progress" });
    const critical = await UserComplaint.countDocuments({ priority: "critical" });
    const high = await UserComplaint.countDocuments({ priority: "high" });
    const medium = await UserComplaint.countDocuments({ priority: "medium" });
    const low = await UserComplaint.countDocuments({ priority: "low" });

    return res.status(200).json({
      success: true,
      data: { total, resolved, pending, inProgress, priority: { critical, high, medium, low } },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching statistics" });
  }
};

export const handleSingleIssueFetch = async (req, res) => {
  try {
    const complaint = await UserComplaint.findById(req.params.id).populate("user", "name email");
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

    if (typeof complaint.location === "string") {
      complaint.location = { address: complaint.location, latitude: null, longitude: null };
    }

    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching complaint" });
  }
};

export const handleComplaintLocations = async (req, res) => {
  try {
    const complaints = await UserComplaint.find(
      { "location.latitude": { $exists: true, $ne: null }, "location.longitude": { $exists: true, $ne: null } },
      { title: 1, category: 1, priority: 1, status: 1, "location.latitude": 1, "location.longitude": 1, "location.address": 1, createdAt: 1, autoPriorityAssigned: 1, manualPriorityOverridden: 1 }
    );

    const formatted = complaints.map((c) => ({
      title: c.title, category: c.category, priority: c.priority, status: c.status,
      latitude: c.location?.latitude, longitude: c.location?.longitude, address: c.location?.address || "N/A",
      date: c.createdAt, prioritySource: c.manualPriorityOverridden ? "manual" : c.autoPriorityAssigned ? "ai" : "rule-based",
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching complaint locations" });
  }
};

export const handleVoteCount = async (req, res) => {
  try {
    const complaint = await UserComplaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

    complaint.voteCount = (complaint.voteCount || 0) + 1;
    await complaint.save();

    res.json({ success: true, message: "Vote added successfully", data: { voteCount: complaint.voteCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error voting on complaint" });
  }
};

export const getComplaintsByPriority = async (req, res) => {
  try {
    const { priority } = req.params;
    if (!["low", "medium", "high", "critical"].includes(priority)) {
      return res.status(400).json({ success: false, message: "Invalid priority value" });
    }

    const complaints = await UserComplaint.find({ priority }).populate("user", "name email").sort("-createdAt");
    res.json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching complaints" });
  }
};

export const handleUpvoteComplaint = async (req, res) => {
  try {
    const { id } = req.params; // Change from complaintId to id
    const userId = req.user?._id || req.user?.id;

    console.log('📝 Upvote request received:');
    console.log('   - id from params:', id);
    console.log('   - userId from auth:', userId);
    console.log('   - full params:', req.params);
    console.log('   - full URL:', req.originalUrl);

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "Complaint ID is required in URL params" 
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    const complaint = await UserComplaint.findById(id);
    
    if (!complaint) {
      return res.status(404).json({ 
        success: false, 
        message: "Complaint not found" 
      });
    }

    // Initialize arrays if they don't exist
    complaint.voters = complaint.voters || [];
    complaint.voteCount = complaint.voteCount || 0;

    // Check if user already voted
    if (complaint.voters.includes(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: "You have already upvoted this complaint" 
      });
    }

    // Add vote
    complaint.voters.push(userId);
    complaint.voteCount += 1;

    await complaint.save();

    console.log('✅ Upvote successful:', { 
      id, 
      newVoteCount: complaint.voteCount 
    });

    res.json({ 
      success: true, 
      message: "Complaint upvoted successfully", 
      data: { 
        voteCount: complaint.voteCount, 
        hasUserVoted: true 
      } 
    });
  } catch (error) {
    console.error("❌ Error upvoting complaint:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error upvoting complaint: " + error.message 
    });
  }
};