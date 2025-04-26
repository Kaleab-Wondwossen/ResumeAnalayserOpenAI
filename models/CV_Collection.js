import mongoose from "mongoose";

const cvCollectionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  originalFileName: String,
  filePath: String,
  extractedText: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("CV_Collection", cvCollectionSchema);
