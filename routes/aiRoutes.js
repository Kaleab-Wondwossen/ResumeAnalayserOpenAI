import express from "express";
const router = express.Router();

import upload from "../middleware/uploadCV.js";
import {
  handleCVUpload,
  analyzeCV,
  recommendImprovements,
  rewriteCV,
  getAnalysisByCVId,
  getRecommendationsByCVId,
  getRewrittenByCVId,
  getCVTextById,
  recommendForSpecificJob
} from "../controllers/aiController.js";

// File upload + all-in-one AI pipeline
router.post("/upload-cv", upload.single("cv"), handleCVUpload);

// Modular AI task routes
router.post("/analyze-cv", analyzeCV);
router.post("/recommend-cv", recommendImprovements);
router.post("/rewrite-cv", rewriteCV);
router.post("/recommend-specific-job", recommendForSpecificJob);

// 🔍 New GET routes
router.get("/analysis/:cvId", getAnalysisByCVId);
router.get("/recommendations/:cvId", getRecommendationsByCVId);
router.get("/rewritten/:cvId", getRewrittenByCVId);
router.get("/cv-text/:cvId", getCVTextById);


export default router;
