import cloudinary from "cloudinary";
import { Course, courseCategory, courseStudent, courseLike } from "../models/course";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { isVideo } from "../utils/mediaType";
import express from "express";
import http from "http";
import { init as initSocket, emitCourseLiked } from "../utils/socket";

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

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
      quality: "auto:low", // Set quality to auto:low for automatic compression
      eager: [{ format: "mp4", video_codec: "h264" }], // Convert to MP4 with H.264 codec for better compression
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
  const { userId } = req.params;
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
  const { categoryId } = req.params;
  const categoryObj = await courseCategory.findOne({ _id: categoryId });
  if (!categoryObj) {
    throw new NotFoundError(`Category with ${categoryId} does not exist`);
  }
  const courses = await Course.find({ category: categoryId });
  res.status(StatusCodes.OK).json({ courses });
};

export const freeCourses = async (req: any, res: any) => {
  const courses = await Course.find({ free: true });
  res.status(StatusCodes.OK).json({ courses });
};

export const enrollForCourse = async (req: any, res: any) => {
  const { courseId } = req.params;
  const { userId } = req.user;
  const course = await Course.findOne({ _id: courseId });
  if (!course) {
    throw new NotFoundError(`Course with ${courseId} does nor exist`);
  }
  if (course.free == true) {
    await courseStudent.create({
      student: userId,
      course: courseId,
    });
    res.status(StatusCodes.OK).json({ success: "enrollment successful" });
  } else {
    // payment shit
  }
};

export const courseDetail = async (req: any, res: any) => {
  const { courseId } = req.course;
  const course = await Course.findOne({ _id: courseId });
  res.status(StatusCodes.OK).json({ course });
};

export const editCourse = async (req: any, res: any) => {
  const { userId } = req.user;
  const { courseId } = req.params;
  req.body.instructor = userId;
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
  const course = await Course.findOneAndUpdate({ _id: courseId, instructor: userId }, req.body, {
    runValidators: true,
    new: true,
  });
  if (!course) {
    throw new NotFoundError(`Course with ${courseId} does not exist`);
  }
  res.status(StatusCodes.OK).json({ course });
};

export const deleteCourse = async (req: any, res: any) => {
  const { userId } = req.user;
  const { courseId } = req.params;
  req.body.instructor = userId;
  const course = await Course.findOneAndDelete({ _id: courseId, instructor: userId });
  if (!course) {
    throw new NotFoundError(`Course with ${courseId} does not exist`);
  }
  if (course.free == true) {
    await Course.findOneAndDelete({ _id: courseId, instructor: userId });
    res.status(StatusCodes.OK).json({ success: "course is successfully deleted" });
  } else {
    //check if there are student who just paid
  }
};

export const likeUnLikeCourse = async (req: any, res: any) => {
  const { userId } = req.user;
  const { courseId } = req.course;
  const likeCourse = await courseLike.findOne({ student: userId, course: courseId });
  if (likeCourse) {
    await courseLike.findOneAndDelete({ student: userId, course: courseId });
  } else {
    await courseLike.create({ student: userId, course: courseId });
  }
  const courseLikes = (await courseLike.find({ course: courseId })).length;
  emitCourseLiked(courseId, courseLikes);
  res.status(StatusCodes.OK).json({ courseLikes });
};
