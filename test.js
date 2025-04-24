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

test();
