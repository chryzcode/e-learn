import cloudinary from "cloudinary";
import { Course, courseCategory } from "../models/course";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { isVideo } from "../utils/mediaType";

export const createCourse = async (req: any, res: any) => {
  req.body.instructor = req.user.userId;

  var category = await courseCategory.findOne({ name: req.body.category });
  if (!category) {
    category = await courseCategory.create({ name: req.body.category });
  }

  req.body.category = category.id;
  if (isVideo(req.body.video) == false) {
    throw new BadRequestError("Video/ Media type not supported");
  }
  try {
    const result = await cloudinary.v2.uploader.upload(req.body.video, {
      resource_type: "video",
      folder: "E-Learn/Course/Video/",
      use_filename: true,
    });
    req.body.video = result.url;
  } catch (error) {
    console.error(error);
    throw new BadRequestError("error uploading video on cloudinary");
  }
  const course = await Course.create({ ...req.body });
  res.status(StatusCodes.CREATED).json({ course });
};

export const allCourses = async (req: any, res: any) => {
  const courses = await Course.find({}).sort("createdAt");
  res.status(StatusCodes.OK).json({ courses });
};

export const getAnInstructorCourses = async (req: any, res: any) => {
  const { userId } = req.param;
  const courses = await Course.find({ instructor: userId });
  res.status(StatusCodes.OK).json({ courses });
};

export const instructorCourses = async (req: any, res: any) => {
  const { userId } = req.user;
  const courses = await Course.find({ instructor: userId });
  res.status(StatusCodes.OK).json({ courses });
};

export const courseCategories = async (req: any, res: any) => {
  const categories = await courseCategory.find({});
  res.status(StatusCodes.OK).json({ categories });
};

export const filterCourseByCategory = async (req: any, res: any) => {
  const { categoryId } = req.param;
  const category = await courseCategory.findOne({ _id: categoryId });
  if (!category) {
    throw new 
  }
  const courses = course.find({});
  res.status(StatusCodes.OK).json({ categories });
};
