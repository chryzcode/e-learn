import cloudinary from "cloudinary";
import { Course } from "../models/course";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { isVideo } from "../utils/mediaType";

export const createCourse = async (req: any, res: any) => {
  req.body.instructor = req.user.userId;
  const course = await Course.create({ ...req.body });
  if (isVideo(req.body.video) == false) {
    throw new BadRequestError("Video/ Media type not supported");
  }
  try {
    const result = await cloudinary.v2.uploader.upload(req.body.video, {
      folder: "E-Learn/Course/Video/",
      use_filename: true,
    });
    req.body.video = result.url;
  } catch (error) {
    console.error(error);
    throw new BadRequestError("error uploading video on cloudinary");
  }
};
