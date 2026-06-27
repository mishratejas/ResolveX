import { GoogleGenAI } from "@google/genai";
import ComplaintEmbedding from "../models/ComplaintEmbedding.model.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * Build a structured text representation of a complaint
 * that will be sent to the embedding model.
 */
export const buildEmbeddingText = (complaint) => {
  const {
    department,
    category,
    title,
    description,
    location,
  } = complaint;

  return `
Department: ${department || "Unknown"}

Category: ${category || "Unknown"}

Complaint Title:
${title}

Complaint Description:
${description}

Location:
${location?.address || "Unknown"}
  `.trim();
};

/**
 * Generate embedding using Gemini.
 * (Implementation in next step)
 */
export const generateEmbedding = async (text) => {
  try {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
    });

    return response.embeddings[0].values;
  } catch (error) {
    console.error("Embedding Generation Error:", error);
    throw new Error("Failed to generate embedding.");
  }
};

/**
 * Save embedding for a complaint.
 */
/**
 * Save an already generated embedding to the database.
 * Does NOT generate embeddings again.
 */
export const saveEmbedding = async ({
  complaintId,
  embedding,
  embeddingText,
}) => {
  try {
    const savedEmbedding = await ComplaintEmbedding.findOneAndUpdate(
      { complaintId },
      {
        complaintId,
        embedding,
        embeddingText,
        model: EMBEDDING_MODEL,
        dimension: embedding.length,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return savedEmbedding;
  } catch (error) {
    console.error("Error saving complaint embedding:", error);
    throw error;
  }
};

/**
 * Get embeddings for a list of complaint IDs.
 */
export const getEmbeddingsByComplaintIds = async (complaintIds) => {
  const embeddings = await ComplaintEmbedding.find({
    complaintId: { $in: complaintIds },
  });

  const embeddingMap = new Map();

  embeddings.forEach((embedding) => {
    embeddingMap.set(
      embedding.complaintId.toString(),
      embedding
    );
  });

  return embeddingMap;
};

/**
 * Compute cosine similarity between two vectors.
 * Returns a value between -1 and 1.
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB) {
    throw new Error("Vectors cannot be null.");
  }

  if (vecA.length !== vecB.length) {
    throw new Error("Vector dimensions do not match.");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
};

// /**
//  * Finds similar complaints using cosine similarity.
//  *
//  * @param {Object} params
//  * @param {number[]} params.embedding - Embedding of the new complaint
//  * @param {Array} params.nearbyComplaints - Nearby complaints from MongoDB
//  * @param {Map} params.embeddingMap - Map of complaintId -> embedding document
//  * @param {number} params.threshold - Similarity threshold
//  *
//  * @returns {Array}
//  */

export const findSimilarComplaints = ({
  embedding,
  nearbyComplaints,
  embeddingMap,
  threshold = process.env.SIMILARITY_THRESHOLD || 0.92,
}) => {
  const similarComplaints = [];

  for (const complaint of nearbyComplaints) {
    const embeddingDoc = embeddingMap.get(complaint._id.toString());

    // Skip if no embedding exists
    if (!embeddingDoc) continue;

    const similarity = cosineSimilarity(
      embedding,
      embeddingDoc.embedding
    );

    if (similarity >= threshold) {
      similarComplaints.push({
        complaint,
        similarity,
      });
    }
  }

  // Highest similarity first
  similarComplaints.sort(
    (a, b) => b.similarity - a.similarity
  );

  return similarComplaints;
};

