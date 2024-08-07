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


const multerUpload: Multer = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

export { multerUpload, uploadToCloudinary };
