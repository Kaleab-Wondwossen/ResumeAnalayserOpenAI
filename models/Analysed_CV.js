import mongoose from "mongoose";

const analysedCVSchema = new mongoose.Schema({
  cv: { type: mongoose.Schema.Types.ObjectId, ref: "CV_Collection", required: true },
  sections: {
    skills: [String],
    education: String,
    experienceSummary: String,
    techStack: [String]
  },
  rawText: String, // stores the original JSON string from OpenAI
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Analysed_CV", analysedCVSchema);
