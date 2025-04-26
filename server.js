import dotenv from "dotenv";
dotenv.config();
console.log("API Key loaded:", process.env.OPENAI_API_KEY ? "✅ YES" : "❌ NO");


import express from "express";
import cors from "cors";
import path from "path";
import aiRoutes from "./routes/aiRoutes.js";
import mongoose from "mongoose";


const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (optional)
app.use("/uploads", express.static(path.resolve("uploads")));

// Routes
app.use("/api/ai", aiRoutes);

// Basic health check
app.get("/", (req, res) => {
  res.send("Server is running... 🎯");
});

// Start server
const PORT = process.env.PORT || 5000;

mongoose.connect("mongodb+srv://kaleabwondwossen12:rbACngaob5XyvJ9g@dastabasedb.rnu5m.mongodb.net/NodeAPI?retryWrites=true&w=majority&appName=DastabaseDB ").then(() => {
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
  console.log('Connected to MongoDB')
}).catch(() => {
  console.log('Connection failed')
})
