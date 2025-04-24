import express from "express";
const router = express.Router(); // <-- 💥 THIS LINE is missing in your file

import upload from "../middleware/uploadCV.js";
import {
  handleCVUpload,
//   analyzeCV,
//   recommendImprovements,
//   rewriteCV,
} from "../controllers/aiController.js";

// Routes
router.post("/upload-cv", upload.single("cv"), handleCVUpload);
// router.post("/analyze-cv", analyzeCV);
// router.post("/recommend-cv", recommendImprovements);
// router.post("/rewrite-cv", rewriteCV);

export default router;
