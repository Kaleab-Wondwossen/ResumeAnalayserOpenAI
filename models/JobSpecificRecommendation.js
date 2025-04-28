// models/JobSpecificRecommendation.js

import mongoose from "mongoose";

const jobSpecificRecommendationSchema = new mongoose.Schema(
  {
    cv: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CV_Collection",
      required: true
    },
    jobDescription: {
      type: String,
      required: true
    },
    recommendations: [
      {
        type: {
          type: String, // skill_gap, tech_trend, etc
          required: true
        },
        message: {
          type: String,
          required: true
        }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("JobSpecificRecommendation", jobSpecificRecommendationSchema);
