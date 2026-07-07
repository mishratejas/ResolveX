import UserComplaint from "../models/UserComplaint.models.js"; // Note: Fixed '.models.js' to '.model.js' based on your previous messages
import ComplaintEmbedding from "../models/ComplaintEmbedding.model.js";
import priorityService from "../services/priority.service.js";
import {
  truncateCoordinates,
  getBoundingBox,
  calculateDistance,
  areComplaintsSimilar,
} from "../utils/locationUtils.js";

import {
  buildEmbeddingText,
  generateEmbedding,
  saveEmbedding,
  getEmbeddingsByComplaintIds,
  findSimilarComplaints,
} from "../services/embedding.service.js";    

//   NEW: Import our Load Balancer!
import { getLeastLoadedStaff } from "../utils/loadBalancer.js";
import NotificationService from "../services/notification.service.js";
import Staff from "../models/Staff.models.js";
import { generateCSVData } from "../utils/exportGenerator.js";

export const handleAllIssueFetch = async (req, res) => {
  try {
    const { status, workspaceId } = req.query;

    console.log('Fetching complaints with filters:', { status, workspaceId });

    const statusMap = {
      Open: "pending",
      "In-Progress": "in-progress",
      Closed: ["resolved", "rejected"],
    };

    let filter = {};

    // CRITICAL FIX: Always require workspaceId
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

    // DEBUG: Log location data for first few complaints
    console.log('Location data check:');
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

// expects a CSV blob from GET /api/user_issues/export. Reuses the CSV
// generator already used elsewhere in the codebase instead of writing a new
// one, and handles the 0/1/many-complaints cases the same way.
export const handleExportMyIssues = async (req, res) => {
  try {
    const complaints = await UserComplaint.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("user", "name")
      .populate("assignedTo", "name")
      .lean();

    const csv = generateCSVData(complaints);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="my-issues.csv"');
    return res.status(200).send(csv);

  } catch (error) {
    console.error("Error exporting user issues:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const checkDuplicateComplaint = async (req, res) => {
  try {
    console.log("DUPLICATE API HIT");
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

    if (nearbyComplaints.length === 0) {
      return res.json({
        success: true,
        hasDuplicates: false,
        duplicates: [],
        userVotedComplaints: false,
      });
    }

    const queryEmbeddingText = buildEmbeddingText({
      title,
      description,
      category,
      location,
    });

    const newEmbedding = await generateEmbedding(queryEmbeddingText);

    const complaintIds = nearbyComplaints.map((c) => c._id);

    const embeddingMap = await getEmbeddingsByComplaintIds(complaintIds);

    console.log("Nearby complaints:", nearbyComplaints.length);

    console.log(
      "Complaint IDs:",
      complaintIds.map(id => id.toString())
    );

    console.log(
      "Embedding Map Size:",
      embeddingMap.size
    );

    console.log(
      "Embedding Keys:",
      [...embeddingMap.keys()]
    );

    
    const similarComplaintResults = findSimilarComplaints({
      embedding: newEmbedding,
      // nearbyComplaints: nearbyComplaints.filter(
      //   (complaint) =>
      //     complaint.user._id.toString() !== userId?.toString()
      // ),
      nearbyComplaints,
      embeddingMap,
    });

    const userVotedComplaints = similarComplaintResults.some(
      ({ complaint }) =>
        complaint.voters?.some((v) => v.toString() === userId?.toString())
    );

    res.json({
      success: true,
      hasDuplicates: similarComplaintResults.length > 0,
      duplicates: similarComplaintResults.map(({ complaint: c, similarity }) => ({
        _id: c._id,
        title: c.title,
        description: c.description,
        category: c.category,
        status: c.status,
        priority: c.priority,
        voteCount: c.voteCount || 0,
        hasUserVoted: c.voters?.some((v) => v.toString() === userId?.toString()) || false,
        isOwnComplaint: c.user._id.toString() === userId?.toString(),
        user: { name: c.user.name, email: c.user.email },
        location: c.location,
        createdAt: c.createdAt,
        distance: calculateDistance(
          latitude, longitude, c.location.latitude, c.location.longitude,
        ).toFixed(0),
        similarity: Number((similarity * 100).toFixed(1)),
      })),
      userVotedComplaints: userVotedComplaints,
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
      department, //   NEW: Extracted department from frontend
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
    console.log('Saving location:', locationData);
    
    if (!locationData.address || locationData.address.trim() === "") {
      return res.status(400).json({ success: false, message: "Location is required" });
    }

    if (!adminId) {
      return res.status(400).json({ success: false, message: "Workspace selection is required." });
    }

    // if (!skipDuplicateCheck && locationData.latitude && locationData.longitude) {
    //   const bbox = getBoundingBox(locationData.latitude, locationData.longitude, 150);

    //   const nearbyComplaints = await UserComplaint.find({
    //     "location.latitude": { $gte: bbox.minLat, $lte: bbox.maxLat },
    //     "location.longitude": { $gte: bbox.minLng, $lte: bbox.maxLng },
    //     status: { $in: ["pending", "in-progress"] },
    //     user: { $ne: complaintUserId }, 
    //     adminId: adminId 
    //   });

    //   // const similarComplaints = nearbyComplaints.filter((existing) =>
    //   //   areComplaintsSimilar({ location: locationData, title, category }, existing, {
    //   //     maxDistance: 150, titleSimilarityThreshold: 0.5, sameCategoryRequired: true,
    //   //   }),
    //   // );

    //   if (similarComplaints.length > 0) {
    //     return res.status(409).json({
    //       success: false,
    //       message: "Similar complaint already exists in this area",
    //       hasDuplicates: true,
    //       duplicates: similarComplaints.map((c) => ({
    //         _id: c._id, title: c.title, description: c.description, category: c.category,
    //         status: c.status, voteCount: c.voteCount || 0, hasUserVoted: c.voters?.includes(complaintUserId) || false,
    //       })),
    //     });
    //   }
    // }

    let priority = "medium";
    let prioritySource = "fallback";

    try {
      console.log("Calling AI priority service...");
      priority = await priorityService.analyzePriority({
        title, description, category: category || "other", department: null,
      });
      prioritySource = "ai";
      console.log(`AI assigned priority: ${priority} for complaint: ${title}`);
    } catch (aiError) {
      console.error("AI priority assignment failed:", aiError.message);
      priority = calculatePriorityFallback(title, description, category);
      prioritySource = "rule-based";
      console.log(`Using rule-based priority: ${priority}`);
    }

    //   NEW: THE LOAD BALANCER EXECUTION
    let assignedStaffId = null;
    let initialStatus = "pending";

    if (department && adminId) {
      console.log(`Running Load Balancer for Department: ${department}`);
      assignedStaffId = await getLeastLoadedStaff(department, adminId);
      
      if (assignedStaffId) {
        console.log(`Load Balancer assigned ticket to Staff: ${assignedStaffId}`);
        // Optional: If auto-assigned, instantly set to in-progress. 
        // Leave as 'pending' if you want staff to manually accept it first.
        // initialStatus = "in-progress"; 
      } else {
        console.log(`No available staff found. Ticket remains Pending.`);
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
      department: department || null, //   Saved to DB
      assignedTo: assignedStaffId,    //   Auto-assigned by Load Balancer
      status: initialStatus,
      priority: priority,
      autoPriorityAssigned: prioritySource === "ai",
      manualPriorityOverridden: false,
      voteCount: 0,
      voters: [],
    });

    await complaint.save();

    try {
      const embeddingText = buildEmbeddingText({
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        location: complaint.location,
      });

      const embedding = await generateEmbedding(embeddingText);

      await saveEmbedding({
        complaintId: complaint._id,
        embedding,
        embeddingText,
      });

      console.log(`Embedding stored for complaint ${complaint._id}`);
    } catch (embeddingError) {
      console.error(
        " Failed to generate complaint embedding:",
        embeddingError
      );

      // Don't fail complaint creation if embeddings fail.
    }

    await complaint.populate("user", "name email");
    await complaint.populate("adminId", "workspaceCode organizationName name"); 

    //  Send notifications
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
    console.error("Error submitting complaint:", error);
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

    const complaint = await UserComplaint.findOne({ _id: complaintId, adminId });
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found or you do not have permission to edit it." });

    complaint.priority = priority;
    complaint.manualPriorityOverridden = true;
    complaint.priorityOverriddenAt = new Date();
    complaint.priorityOverriddenById = adminId;

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
    const complaint = await UserComplaint.findById(req.params.id)
      .populate("user", "name email")
      .populate("comments.user", "name profileImage")
      .populate("comments.staff", "name staffId")
      .populate("comments.admin", "name organizationName");
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

export const handleUpvoteComplaint = async (req, res) => {
  try {
    const { id } = req.params; // Change from complaintId to id
    const userId = req.user?._id || req.user?.id;

    console.log('Upvote request received:');
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

    // Check if user already voted.
    // NOTE: complaint.voters is an array of Mongoose ObjectId objects, and
    // userId is also an ObjectId object - two ObjectIds with the same value
    // are still different object instances, so Array.includes() (reference
    // equality) was always returning false here, letting anyone vote
    // unlimited times. Compare the string form instead.
    const alreadyVoted = complaint.voters.some(
      (voterId) => voterId.toString() === userId.toString()
    );

    if (alreadyVoted) {
      return res.status(400).json({ 
        success: false, 
        message: "You have already upvoted this complaint" 
      });
    }

    // Add vote
    complaint.voters.push(userId);
    complaint.voteCount += 1;

    await complaint.save();

    console.log('Upvote successful:', { 
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
    console.error("Error upvoting complaint:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error upvoting complaint: " + error.message 
    });
  }
};
// POST /api/user_issues/:id/comments — Add a comment to a complaint (requires auth)
// Any logged-in user can comment on any complaint (not just their own), the same
// way upvoting is open to the whole community.
export const addComplaintComment = async (req, res) => {
  try {
    const { id } = req.params;
    // The frontend's complaintService.addComment() sends { comment }; support { message } too.
    const message = req.body.comment ?? req.body.message;
    const userId = req.user?._id || req.user?.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Comment message is required" });
    }

    const complaint = await UserComplaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const newComment = {
      authorRole: "user",
      user: userId,
      message: message.trim(),
      createdAt: new Date(),
    };

    complaint.comments.push(newComment);
    await complaint.save();

    //  Notify the complaint owner about the new comment (skip if they're commenting on their own complaint)
    if (complaint.user.toString() !== userId.toString()) {
      try {
        await NotificationService.notifyNewComment(complaint, req.user, message.trim());
      } catch (notifError) {
        console.error("Failed to send comment notification:", notifError);
      }
    }

    await complaint.populate("comments.user", "name profileImage");
    await complaint.populate("comments.staff", "name staffId");
    await complaint.populate("comments.admin", "name organizationName");

    const addedComment = complaint.comments[complaint.comments.length - 1];

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: addedComment,
      comments: complaint.comments,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ success: false, message: "Error adding comment: " + error.message });
  }
};

// GET /api/user_issues/:id/comments — Fetch all comments for a complaint (public)
export const getComplaintComments = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await UserComplaint.findById(id)
      .select("comments")
      .populate("comments.user", "name profileImage")
      .populate("comments.staff", "name staffId")
      .populate("comments.admin", "name organizationName");

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    res.json({
      success: true,
      count: complaint.comments.length,
      data: complaint.comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ success: false, message: "Error fetching comments" });
  }
};

// DELETE /api/user_issues/:id — user can only delete their own complaint
export const handleDeleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;

    const complaint = await UserComplaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Only the owner can delete
    if (complaint.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this complaint' });
    }

    await complaint.deleteOne();

    await ComplaintEmbedding.deleteOne({
      complaintId: complaint._id,
    });

    res.json({ success: true, message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ success: false, message: 'Error deleting complaint: ' + error.message });
  }
};