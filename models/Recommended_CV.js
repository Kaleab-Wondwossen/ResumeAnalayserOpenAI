import mongoose from "mongoose";

const recommendedCVSchema = new mongoose.Schema({
  cv: { type: mongoose.Schema.Types.ObjectId, ref: "CV_Collection", required: true },
  recommendations: [
    {
      type: { type: String },
      message: String
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Recommended_CV", recommendedCVSchema);
