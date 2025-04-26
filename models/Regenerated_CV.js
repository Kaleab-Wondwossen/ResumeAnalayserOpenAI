import mongoose from "mongoose";

const regeneratedCVSchema = new mongoose.Schema({
  cv: { type: mongoose.Schema.Types.ObjectId, ref: "CV_Collection", required: true },
  jobDescription: { type: String, default: "" },
  rewrittenSections: {
    summary: String,
    experience: String,
    skills: [String],
    fullText: String
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Regenerated_CV", regeneratedCVSchema);
