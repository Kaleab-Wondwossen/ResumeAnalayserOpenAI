import multer from "multer";
import path from "path";

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/cvs/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = file.originalname.split(" ")[0].replace(/\s/g, "_");
    cb(null, `${name}_${Date.now()}${ext}`);
  },
});

// File filter: allow only pdf and docx
const fileFilter = (req, file, cb) => {
  const allowedTypes = [".pdf", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and DOCX files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
