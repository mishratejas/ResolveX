import { cosineSimilarity, generateEmbedding } from "./embedding.service.js";

const emb1 = await generateEmbedding(
    "Huge pothole near Gate 3"
);

const emb2 = await generateEmbedding(
    "Large pothole near Gate 3"
);

const emb3 = await generateEmbedding(
    "Water leakage in Hostel"
);

console.log("Similar :", cosineSimilarity(emb1, emb2));
console.log("Different:", cosineSimilarity(emb1, emb3));