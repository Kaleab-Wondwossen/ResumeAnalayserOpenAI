import { extractCVText } from "../utils/parseCV.js";
import openai from "../config/openaiClient.js";


export const handleCVUpload = async (req, res) => {
  try {
    const filePath = req.file.path;
    const cvText = await extractCVText(filePath);

    // Step 1: Analyze
    const analysis = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a career coach analyzing a CV.",
        },
        {
          role: "user",
          content: `Analyze this CV and summarize the skills, tech, and experience:\n\n${cvText}`,
        },
      ],
    });

    // Step 2: Recommendations
    const recommendations = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a tech job advisor.",
        },
        {
          role: "user",
          content: `Suggest ways to improve this CV to stay competitive in 2025:\n\n${cvText}`,
        },
      ],
    });

    // Step 3: Rewrite
    const rewritten = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional CV editor.",
        },
        {
          role: "user",
          content: `Rewrite this CV to improve structure, tone, and clarity:\n\n${cvText}`,
        },
      ],
    });

    res.status(200).json({
      analysis: analysis.choices[0].message.content,
      recommendations: recommendations.choices[0].message.content,
      rewritten: rewritten.choices[0].message.content,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
