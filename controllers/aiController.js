import { extractCVText } from "../utils/parseCV.js";
import axios from "axios";
import openai from "../config/openaiClient.js";
import CV_Collection from "../models/CV_Collection.js";
import Analysed_CV from "../models/Analysed_CV.js";
import Recommended_CV from "../models/Recommended_CV.js";
import Regenerated_CV from "../models/Regenerated_CV.js";

export const handleCVUpload = async (req, res) => {
  try {
    const filePath = req.file.path;
    const originalFileName = req.file.originalname;
    const cvText = await extractCVText(filePath);

    const cv = await CV_Collection.create({
      originalFileName,
      filePath,
      extractedText: cvText,
    });

    const cvId = cv._id;

    res.status(200).json({ message: "CV uploaded and extracted successfully", cvId, extractedText: cvText });
  } catch (err) {
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

    let rawResponse = localRes.data.response.trim();

    // Try to find valid JSON in response
    const firstCurly = rawResponse.indexOf("{");
    const lastCurly = rawResponse.lastIndexOf("}");
    if (firstCurly !== -1 && lastCurly !== -1) {
      rawResponse = rawResponse.substring(firstCurly, lastCurly + 1);
    }

    try {
      const structured = JSON.parse(rawResponse);
      return { source: "mistral", structured };
    } catch (parseErr) {
      console.warn("⚠️ Local model returned non-JSON after cleanup, fallback to OpenAI.");
      throw new Error("FallbackTrigger");
    }
  } catch (err) {
    if (err.message === "FallbackTrigger" || err.code === "ECONNREFUSED") {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an AI assistant. ONLY respond with pure JSON, no explanation." },
          { role: "user", content: openaiPrompt }
        ]
      });
      const structuredOutput = JSON.parse(response.choices[0].message.content);
      return { source: "openai", structured: structuredOutput };
    }
    throw err;
  }
};

export const analyzeCV = async (req, res) => {
  const { cvText, cvId } = req.body;

  const prompt = `ONLY return valid JSON with no extra text. Analyze this CV and return structured JSON with the following keys: skills (array), education (string), experienceSummary (string), techStack (array).\n\nCV:\n${cvText}`;

  try {
    const { source, structured } = await callHybridModel(prompt, prompt);

    const saved = await Analysed_CV.create({
      cv: cvId,
      sections: structured,
      rawText: JSON.stringify(structured)
    });

    res.status(200).json({ source, result: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const recommendImprovements = async (req, res) => {
  const { cvText, cvId } = req.body;

  const prompt = `Give actionable suggestions to improve this CV for tech jobs in 2025. Return JSON with an array of recommendations (type and message).\n\nCV:\n${cvText}`;

  try {
    const { source, structured } = await callHybridModel(prompt, prompt);

    const saved = await Recommended_CV.create({
      cv: cvId,
      recommendations: structured.recommendations
    });

    res.status(200).json({ source, result: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const rewriteCV = async (req, res) => {
  const { cvText, cvId, jobDescription } = req.body;

  const dynamicPrompt = jobDescription
    ? `Rewrite this CV to match the following job description:\n\n${jobDescription}\n\nCV:\n${cvText}`
    : `Rewrite and improve this CV for modern standards, ATS-friendliness, and clarity.\n\nCV:\n${cvText}`;

  const formatInstruction = `Format output as JSON with fields: summary, experience, skills (array), and fullText.`;

  try {
    const { source, structured } = await callHybridModel(`${dynamicPrompt}\n\n${formatInstruction}`, `${dynamicPrompt}\n\n${formatInstruction}`);

    const saved = await Regenerated_CV.create({
      cv: cvId,
      jobDescription: jobDescription || "",
      rewrittenSections: {
        summary: structured.summary,
        experience: Array.isArray(structured.experience)
          ? JSON.stringify(structured.experience)
          : structured.experience, skills: structured.skills,
        fullText: structured.fullText
      }
    });

    res.status(200).json({ source, result: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const getAnalysisByCVId = async (req, res) => {
  try {
    const analysis = await Analysed_CV.findOne({ cv: req.params.cvId });
    if (!analysis) return res.status(404).json({ error: "No analysis found" });
    res.status(200).json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRecommendationsByCVId = async (req, res) => {
  try {
    const rec = await Recommended_CV.findOne({ cv: req.params.cvId });
    if (!rec) return res.status(404).json({ error: "No recommendations found" });
    res.status(200).json(rec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRewrittenByCVId = async (req, res) => {
  try {
    const rewritten = await Regenerated_CV.findOne({ cv: req.params.cvId });
    if (!rewritten) return res.status(404).json({ error: "No rewritten CV found" });
    res.status(200).json(rewritten);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCVTextById = async (req, res) => {
  try {
    const cv = await CV_Collection.findById(req.params.cvId);
    if (!cv) {
      return res.status(404).json({ error: "CV not found" });
    }

    res.status(200).json({
      cvId: cv._id,
      extractedText: cv.extractedText,
      originalFileName: cv.originalFileName
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};