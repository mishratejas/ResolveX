import mongoose from "mongoose";

const complaintEmbeddingSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserComplaint",
      required: true,
      unique: true,
      index: true,
    },

    embedding: {
      type: [Number],
      required: true,
    },

    embeddingText: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      default: "gemini-embedding-001",
    },

    dimension: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "ComplaintEmbedding",
  complaintEmbeddingSchema
);
