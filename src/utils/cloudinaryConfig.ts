// cloudinaryConfig.ts
import { v2 as cloudinary } from "cloudinary";
import multer, { FileFilterCallback, Multer } from "multer";
import { Readable } from "stream";
import dotenv from "dotenv";
import { Request } from "express";

dotenv.config();

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

const uploadToCloudinary = (file: Express.Multer.File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "E-Learn/Media/",
        resource_type: "auto",
        quality: "auto:low", // Set quality to auto:low for automatic compression
        eager: [{ format: "mp4", video_codec: "h264" }], // Convert to MP4 with H.264 codec for better compression
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
    Readable.from(file.buffer).pipe(uploadStream);
  });
};

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Accept images and videos
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    // Pass null for the error and false to indicate unsupported file type
    cb(null, false);
  }
};

const multerUpload: Multer = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter,
});

export { multerUpload, uploadToCloudinary };
