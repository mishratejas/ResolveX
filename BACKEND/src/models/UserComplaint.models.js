// import mongoose from "mongoose";

// const userComplaintSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//   },
//   description: {
//     type: String,
//     required: true,
//   },
//   category: {
//     type: String,
//     enum: [
//       "road",
//       "water",
//       "electricity",
//       "sanitation",
//       "security",
//       "transport",
//       "other",
//     ],
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ["pending", "in-progress", "resolved", "rejected"],
//     default: "pending",
//   },
//   priority: {
//     type: String,
//     enum: ["low", "medium", "high", "critical"],
//     default: "medium",
//   },
//   autoPriorityAssigned: {
//     type: Boolean,
//     default: false,
//   },
//   manualPriorityOverridden: {
//     type: Boolean,
//     default: false,
//   },
//   priorityOverriddenBy: {
//     type: String,
//     enum: ["admin", "staff"],
//     default: null,
//   },
//   priorityOverriddenAt: {
//     type: Date,
//     default: null,
//   },
//   priorityOverriddenById: {
//     type: mongoose.Schema.Types.ObjectId,
//     refPath: "priorityOverriddenByModel",
//   },
//   priorityOverriddenByModel: {
//     type: String,
//     enum: ["Admin", "Staff"],
//     default: null,
//   },
//   location: {
//     latitude: Number,
//     longitude: Number,
//     address: String,
//   },
//   images: [
//     {
//       type: String,
//     },
//   ],
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   voteCount: {
//     type: Number,
//     default: 0,
//   },
//   voters: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   ],
//   department: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Department",
//   },
//   assignedTo: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Staff",
//   },
//   comments: [
//     {
//       staff: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Staff",
//       },
//       message: String,
//       createdAt: {
//         type: Date,
//         default: Date.now,
//       },
//     },
//   ],
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// export default mongoose.model("UserComplaint", userComplaintSchema);


import mongoose from "mongoose";

const userComplaintSchema = new mongoose.Schema({
  // 🚀 NEW: Strict Workspace Boundary
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
    index: true // For fast querying on the Admin Dashboard
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true, // Removed strict enum so dynamic custom departments don't crash it
  },
  status: {
    type: String,
    enum: ["pending", "in-progress", "resolved", "rejected"],
    default: "pending",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  autoPriorityAssigned: {
    type: Boolean,
    default: false,
  },
  manualPriorityOverridden: {
    type: Boolean,
    default: false,
  },
  priorityOverriddenBy: {
    type: String,
    enum: ["admin", "staff"],
    default: null,
  },
  priorityOverriddenAt: {
    type: Date,
    default: null,
  },
  priorityOverriddenById: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "priorityOverriddenByModel",
  },
  priorityOverriddenByModel: {
    type: String,
    enum: ["Admin", "Staff"],
    default: null,
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  images: [
    {
      type: String,
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  voteCount: {
    type: Number,
    default: 0,
  },
  voters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff", // This will fuel your auto-assignment Load Balancer!
  },
  comments: [
    {
      staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
      },
      message: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, { timestamps: true });

export default mongoose.model("UserComplaint", userComplaintSchema);