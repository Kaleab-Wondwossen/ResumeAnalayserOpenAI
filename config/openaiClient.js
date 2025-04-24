import dotenv from "dotenv";
dotenv.config(); // ⬅️ This ensures env is loaded before we create the client

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;
