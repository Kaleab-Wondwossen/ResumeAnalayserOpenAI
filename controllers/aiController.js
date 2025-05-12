import { extractCVText } from "../utils/parseCV.js";
import axios from "axios";
import openai from "../config/openaiClient.js";
import CV_Collection from "../models/CV_Collection.js";
import Analysed_CV from "../models/Analysed_CV.js";
import Recommended_CV from "../models/Recommended_CV.js";
import Regenerated_CV from "../models/Regenerated_CV.js";
import JobSpecificRecommendation from "../models/JobSpecificRecommendation.js";

export const handleCVUpload = async (req, res) => {
  try {
    const filePath = req.file.path;
    const userId = req.user.id; // ✅ from verifyToken middleware
    const extractedText = await extractCVText(filePath);

    const saved = await CV_Collection.create({
      user: userId,                           // ✅ Associate with user
      filePath,
      extractedText,
      originalFileName: req.file.originalname
    });

    res.status(200).json({
      message: "CV uploaded and processed successfully.",
      cvId: saved._id,
      extractedText
    });
  } catch (err) {
    console.error("🔥 Upload CV error:", err);
    res.status(500).json({ error: err.message });
  }
};


// Helper function to try local model first, then fallback to OpenAI
const callHybridModel = async (localPrompt, openaiPrompt) => {
  try {
    const localRes = await axios.post("http://localhost:11434/api/generate", {
      model: "mistral",
      prompt: localPrompt,
      stream: false
    });

    let cleaned = localRes.data.response.trim();

    // Try to repair bad JSON using regex (basic fix)
    if (!cleaned.startsWith("{")) {
      cleaned = cleaned.substring(cleaned.indexOf("{")); // cut garbage before
    }

    try {
      const structured = JSON.parse(cleaned);
      return { source: "mistral", structured };
    } catch {
      console.warn("⚠️ Still non-JSON after trimming. No fallback.");
      throw new Error("LocalLLMReturnedInvalidFormat");
    }
  } catch (err) {
    if (err.message === "LocalLLMReturnedInvalidFormat") {
      throw new Error("Local model output malformed. Fix prompt or use OpenAI manually.");
    }
    throw err;
  }
};


export const analyzeCV = async (req, res) => {
  console.log("📥 analyzeCV body:", req.body);
  console.log("👤 User:", req.user);

  const { cvText, cvId } = req.body;

  try {
    const prompt = `You are a CV parser. 
    Your job is to extract structured information from resumes.
    
    Extract the following from the CV and return it as a valid JSON:
    {
      "skills": [string],
      "education": string,
      "experienceSummary": string,
      "techStack": [string]
    }
    
    CV:
    ${cvText}`;


    // Hybrid call: tries local Ollama, falls back to OpenAI
    const { source, structured } = await callHybridModel(prompt, prompt);

    const saved = await Analysed_CV.create({
      user: req.user.id,         // ✅ Associate analysis with user
      cv: cvId,
      sections: structured,
      rawText: JSON.stringify(structured)
    });

    res.status(200).json({ source, result: saved });
  } catch (err) {
    console.error("🔥 Analysis error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const recommendImprovements = async (req, res) => {
  const { cvText, cvId } = req.body;

  try {
    const prompt = `You are an AI job coach. Provide actionable suggestions to improve this CV for modern tech roles in 2025.

Format your output as valid JSON:
{
  "recommendations": [
    { "type": "skill_gap", "message": "..." },
    { "type": "trend_mismatch", "message": "..." }
  ]
}

CV:
${cvText}`;

    const { source, structured } = await callHybridModel(prompt, prompt);

    const saved = await Recommended_CV.create({
      user: req.user.id,                     // ✅ Track user who requested this
      cv: cvId,
      recommendations: structured.recommendations,
    });

    res.status(200).json({ source, result: saved });
  } catch (err) {
    console.error("🔥 Recommendation error:", err);
    res.status(500).json({ error: err.message });
  }
};



export const recommendForSpecificJob = async (req, res) => {
  const { cvText, cvId, jobDescription } = req.body;

  if (!jobDescription) {
    return res.status(400).json({ error: "Job description is required for specific job recommendations." });
  }

  const prompt = `You are a career advisor.

Your task is to recommend how to optimize a CV to better match the following job description:

Job Description in such away on what to add to the skills in addition to the skills on the cv:
${jobDescription}

CV:
${cvText}

Return the result as valid JSON in the following format:
{
  "recommendations": [
    { "type": "skill_gap", "message": ${jobDescription} },
    { "type": "tech_trend", "message": ${jobDescription} }
  ]
}`;

  try {
    const { source, structured } = await callHybridModel(prompt, prompt);

    const saved = await JobSpecificRecommendation.create({
      user: req.user.id, // ✅ track user
      cv: cvId,
      jobDescription,
      recommendations: structured.recommendations
    });

    res.status(200).json({ source, result: saved });
  } catch (err) {
    console.error("🔥 Job-specific recommendation error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const rewriteCV = async (req, res) => {
  const { cvText, cvId, jobDescription } = req.body;

  const dynamicPrompt = jobDescription
    ? `Rewrite this CV to match the following job description:\n\n${jobDescription}\n\nCV:\n${cvText}`
    : `Rewrite and improve this CV for modern standards, ATS-friendliness, and clarity.\n\nCV:\n${cvText}`;

  const formatInstruction = `Return the result as valid JSON with the following format:
{
  "summary": "One paragraph summary...",
  "experience": "Experience section rewritten in clear format.",
  "skills": ["React", "Node.js", "MongoDB"],
  "fullText": "Complete CV in clean modern prose..."
}`;

  try {
    const { source, structured } = await callHybridModel(
      `${dynamicPrompt}\n\n${formatInstruction}`,
      `${dynamicPrompt}\n\n${formatInstruction}`
    );

    const saved = await Regenerated_CV.create({
      user: req.user.id, // ✅ Track the job seeker who rewrote this CV
      cv: cvId,
      jobDescription: jobDescription || "",
      rewrittenSections: {
        summary: structured.summary?.trim() || "",
        experience:
          typeof structured.experience === "string"
            ? structured.experience
            : JSON.stringify(structured.experience), // Fallback if array
        skills: Array.isArray(structured.skills) ? structured.skills : [],
        fullText: structured.fullText?.trim() || ""
      }
    });

    res.status(200).json({ source, result: saved });
  } catch (err) {
    console.error("🔥 RewriteCV error:", err);
    res.status(500).json({ error: err.message });
  }
};




export const getAnalysisByCVId = async (req, res) => {
  try {
    const analysis = await Analysed_CV.findOne({ cv: req.params.cvId })
      .select("user cv sections rawText createdAt");

    if (!analysis) {
      return res.status(404).json({ error: "No analysis found" });
    }

    res.status(200).json({
      _id: analysis._id,
      user: analysis.user,                // ✅ include user ID
      cv: analysis.cv,
      sections: analysis.sections,
      rawText: analysis.rawText,
      createdAt: analysis.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getRecommendationsByCVId = async (req, res) => {
  try {
    const rec = await Recommended_CV.findOne({ cv: req.params.cvId })
      .select("user cv recommendations createdAt");

    if (!rec) {
      return res.status(404).json({ error: "No recommendations found" });
    }

    res.status(200).json({
      _id: rec._id,
      user: rec.user,                      // ✅ include user ID
      cv: rec.cv,
      recommendations: rec.recommendations,
      createdAt: rec.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getRewrittenByCVId = async (req, res) => {
  try {
    const rewritten = await Regenerated_CV.findOne({ cv: req.params.cvId })
      .select("user cv jobDescription rewrittenSections createdAt");

    if (!rewritten) {
      return res.status(404).json({ error: "No rewritten CV found" });
    }

    res.status(200).json({
      _id: rewritten._id,
      user: rewritten.user,                        // ✅ Include user ID
      cv: rewritten.cv,
      jobDescription: rewritten.jobDescription,
      rewrittenSections: rewritten.rewrittenSections,
      createdAt: rewritten.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getCVTextById = async (req, res) => {
  try {
    const cv = await CV_Collection.findById(req.params.cvId).select("user extractedText originalFileName");

    if (!cv) {
      return res.status(404).json({ error: "CV not found" });
    }

    res.status(200).json({
      cvId: cv._id,
      user: cv.user, // ✅ Include user ID
      originalFileName: cv.originalFileName,
      extractedText: cv.extractedText
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getMyCVs = async (req, res) => {
  try {
    const userId = req.user.id;

    const cvs = await CV_Collection.find({ user: userId })
      .select("_id originalFileName extractedText createdAt");

    // Optionally add user ID to each result
    const enriched = cvs.map(cv => ({
      ...cv.toObject(),
      user: userId
    }));

    res.status(200).json({ cvs: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};