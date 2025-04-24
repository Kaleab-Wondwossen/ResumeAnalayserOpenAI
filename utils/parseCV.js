import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const extractCVText = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await getDocument({ data }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(" ");
      text += pageText + "\n";
    }

    return text;
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  throw new Error("Unsupported file type.");
};
