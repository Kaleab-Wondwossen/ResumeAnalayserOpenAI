import mongoose from "mongoose";

const processedCVSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // optional depending on if you're tracking logged-in users
    required: false,
  },
  originalFileName: String,
  filePath: String,
  extractedText: String,

  analysis: String,
  recommendations: String,
  rewrittenCV: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ProcessedCV = mongoose.model("ProcessedCV", processedCVSchema);
export default ProcessedCV;
