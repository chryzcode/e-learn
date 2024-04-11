import path from "path";

export const isVideo = (filePath: any) => {
  // List of common video file extensions
  const videoExtensions = [".mp4", ".avi", ".mov", ".wmv", ".mkv"]; // Add more video extensions if needed

  // Get the file extension from the file path
  const extension = path.extname(filePath).toLowerCase();

  // Check if the file extension is in the list of video extensions
  return videoExtensions.includes(extension);
};

export const isImage = (filePath: any) => {
  // List of common video file extensions
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"]; // Add more video extensions if needed

  // Get the file extension from the file path
  const extension = path.extname(filePath).toLowerCase();

  // Check if the file extension is in the list of video extensions
  return imageExtensions.includes(extension);
};
