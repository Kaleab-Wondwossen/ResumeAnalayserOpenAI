// import fs from "fs";
// import pdfParse from "pdf-parse";

// const filePath = "./uploads/cvs/sample.pdf"; // point to a real uploaded file

// const run = async () => {
//   const buffer = fs.readFileSync(filePath);
//   const data = await pdfParse(buffer);
//   console.log("✅ Extracted text:\n", data.text.substring(0, 500));
// };

// run();
import { extractCVText } from "./utils/parseCV.js";

const test = async () => {
  const text = await extractCVText("./uploads/cvs/sample.pdf");
  console.log(text.slice(0, 500)); // print first 500 chars
};

export const analyzeCV = async (req, res) => {
  const { cvText, cvId } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert CV analyzer. Format all outputs as valid JSON."
        },
        {
          role: "user",
          content: `Analyze the following CV and extract key details. Return in this JSON format:

{
  "skills": [ "React", "Node.js", "MongoDB" ],
  "education": "BSc in Computer Science, XYZ University",
  "experienceSummary": "3 years experience as a full-stack web developer.",
  "techStack": [ "JavaScript", "Express", "MongoDB", "Docker" ]
}

CV:
${cvText}`
        }
      ],
      temperature: 0.4,
    });

    const content = response.choices[0].message.content;
    let structuredOutput;

    try {
      structuredOutput = JSON.parse(content);
    } catch (parseErr) {
      return res.status(500).json({
        error: "Failed to parse JSON from OpenAI response",
        raw: content,
        details: parseErr.message
      });
    }

    const saved = await Analysed_CV.create({
      cv: cvId,
      sections: structuredOutput,
      rawText: content
    });

    res.status(200).json({ result: saved });

  } catch (err) {
    const statusCode = err.status || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

export const recommendImprovements = async (req, res) => {
  const { cvText, cvId } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI job coach. Format all outputs as structured JSON."
        },
        {
          role: "user",
          content: `Give actionable suggestions to improve this CV for tech jobs in 2025.
Return output in this format:

{
  "recommendations": [
    { "type": "skill_gap", "message": "Learn Docker for containerization." },
    { "type": "trend_mismatch", "message": "Mention a cloud platform like AWS or GCP." }
  ]
}

CV:
${cvText}`
        }
      ],
      temperature: 0.6,
    });

    const content = response.choices[0].message.content;
    let structuredOutput;

    try {
      structuredOutput = JSON.parse(content);
    } catch (parseErr) {
      return res.status(500).json({
        error: "Failed to parse JSON from OpenAI response",
        raw: content,
        details: parseErr.message
      });
    }

    const saved = await Recommended_CV.create({
      cv: cvId,
      recommendations: structuredOutput.recommendations
    });

    res.status(200).json({ result: saved });

  } catch (err) {
    const statusCode = err.status || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

export const rewriteCV = async (req, res) => {
  const { cvText, cvId, jobDescription } = req.body;

  try {
    const prompt = jobDescription
      ? `Rewrite this CV to match the following job description:\n\n${jobDescription}\n\nCV:\n${cvText}`
      : `Rewrite and enhance this CV. Make it clean, ATS-friendly, modern, and professional.\n\nCV:\n${cvText}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional CV editor. Return a rewritten CV in structured JSON sections."
        },
        {
          role: "user",
          content: `Rewrite this CV. Enhance clarity, grammar, and modern tech stack formatting. 
Format your output like this:

{
  "summary": "Professional full-stack developer with a focus on MERN stack...",
  "experience": "Worked at XYZ Corp for 3 years building scalable web apps...",
  "skills": ["React", "Node.js", "MongoDB", "Docker"],
  "fullText": "Complete rewritten CV as plain text"
}

CV:
${cvText}`
        }
      ],
      temperature: 0.75,
    });

    const content = response.choices[0].message.content;
    let structuredOutput;

    try {
      structuredOutput = JSON.parse(content);
    } catch (parseErr) {
      return res.status(500).json({
        error: "Failed to parse JSON from OpenAI response",
        raw: content,
        details: parseErr.message
      });
    }

    const saved = await Regenerated_CV.create({
      cv: cvId,
      jobDescription: jobDescription || "",
      rewrittenSections: {
        summary: structuredOutput.summary,
        experience: structuredOutput.experience,
        skills: structuredOutput.skills,
        fullText: structuredOutput.fullText
      }
    });

    res.status(200).json({ result: saved });

  } catch (err) {
    const statusCode = err.status || 500;
    res.status(statusCode).json({ error: err.message });
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

test();
