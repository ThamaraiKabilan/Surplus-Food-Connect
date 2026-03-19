import fs from "fs";
import path from "path";
import multer from "multer";

const ensureDirectory = (folderName) => {
  const uploadPath = path.resolve("uploads", folderName);
  fs.mkdirSync(uploadPath, { recursive: true });
  return uploadPath;
};

export const createUploader = (folderName) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, ensureDirectory(folderName));
    },
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
      cb(null, `${Date.now()}-${safeName}`);
    }
  });

  return multer({ storage });
};
