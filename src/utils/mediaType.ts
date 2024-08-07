import path from "path";

export const isVideo = (file: Express.Multer.File) => {
  // List of common video MIME types
  const videoMimeTypes = ["video/mp4", "video/avi", "video/quicktime", "video/x-ms-wmv", "video/x-matroska"]; // Add more video MIME types if needed

  // List of common video file extensions
  const videoExtensions = [".mp4", ".avi", ".mov", ".wmv", ".mkv"]; // Add more video extensions if needed

  // Get the file extension from the file original name
  const extension = path.extname(file.originalname).toLowerCase();

  // Check if the file extension or MIME type is in the list of video extensions or MIME types
  return videoExtensions.includes(extension) || videoMimeTypes.includes(file.mimetype);
};

export const isImage = (filePath: any) => {
  // List of common video file extensions
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp"]; // Add more video extensions if needed

  // Get the file extension from the file path
  const extension = path.extname(filePath).toLowerCase();

  // Check if the file extension is in the list of video extensions
  return imageExtensions.includes(extension);
};
