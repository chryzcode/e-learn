import cloudinary from "cloudinary";
import { Course, courseCategory, courseStudent, courseLike, courseRating, courseComment } from "../models/course";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { isVideo } from "../utils/mediaType";
import express from "express";
import http from "http";
import { init as initSocket, emitCourseLiked, emitcourseComments } from "../utils/socket";
import { makeCoursePayment } from "../utils/stripe";
import { courseRoom } from "../models/chatRoom";

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

export const createCourse = async (req: any, res: any) => {
  const { userId } = req.user;
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
      quality: "auto:low", // Set quality to auto:low for automatic compression
      eager: [{ format: "mp4", video_codec: "h264" }], // Convert to MP4 with H.264 codec for better compression
    });
    req.body.video = result.url;
  } catch (error) {
    console.error(error);
    throw new BadRequestError("error uploading video on cloudinary");
  }
  const course = await Course.create({ ...req.body });
  const room = await courseRoom.create({
    course: course.id,
  });
  room.users.push(userId);
  await room.save();
  res.status(StatusCodes.CREATED).json({ course });
};

export const allCourses = async (req: any, res: any) => {
  const courses = await Course.find({}).sort("createdAt");
  res.status(StatusCodes.OK).json({ courses });
};

export const getAnInstructorCourses = async (req: any, res: any) => {
  const { instructorId } = req.params;
  const courses = await Course.find({ instructor: instructorId });
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
  const { userId } = req.user;
  const { courseId } = req.params;
  const course = await Course.findOne({ _id: courseId });
  if (!course) {
    throw new NotFoundError(`Course with id ${courseId} does not exist`);
  }
  const enrolledAlready = await courseStudent.findOne({ student: userId, course: courseId });
  if (enrolledAlready) {
    throw new BadRequestError(`You have already enrolled for course before`);
  }
  if (course.free == true) {
    await courseStudent.create({
      student: userId,
      course: courseId,
    });
    const room = await courseRoom.findOne({ course: courseId });
    if (!room) {
      throw new NotFoundError("Course room not found");
    }
    room.users.push(userId);
    res.status(StatusCodes.OK).json({ success: "enrollment successful" });
  } else {
    const payment = await makeCoursePayment(userId, courseId);
    if (payment) {
      res.status(StatusCodes.OK).json({ payment });
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "error in generating payment link" });
    }
  }
};

export const courseDetail = async (req: any, res: any) => {
  const { userId } = req.user;
  const { courseId } = req.params;
  const course = await Course.findOne({ _id: courseId });
  if (!course) {
    throw new NotFoundError(`Course with ${courseId} does not exist`);
  }
  const student = await courseStudent.findOne({ student: userId, course: courseId });
  if (student) {
    res.status(StatusCodes.OK).json({ access: course });
  } else {
    res.status(StatusCodes.OK).json({ noAcesss: course });
  }
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
  if (req.body.video) {
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
  const course = await Course.findOne({ _id: courseId, instructor: userId });
  if (!course) {
    throw new NotFoundError(`Course with ${courseId} does not exist`);
  }
  if (course.free == true) {
    await Course.findOneAndDelete({ _id: courseId, instructor: userId });
    res.status(StatusCodes.OK).json({ success: "course is successfully deleted" });
  } else {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ unathorized: "Students might have just paid for the course. Reach out to the team" });
  }
};

export const likeCourse = async (req: any, res: any) => {
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

export const rateCourse = async (req: any, res: any) => {
  const { userId } = req.user;
  const { courseId } = req.course;
  req.body.student = userId;
  req.body.course = courseId;
  let rating = await courseRating.findOne({ student: userId, course: courseId });
  if (!rating) {
    rating = await courseRating.create({ ...req.body });
  } else {
    rating = await courseRating.findOneAndUpdate({ _id: rating.id }, req.body, { new: true, runValidators: true });
  }
  res.status(StatusCodes.OK).json({ rating });
};

export const courseRatings = async (req: any, res: any) => {
  const { courseId } = req.params;
  const course = await Course.findOne({ _id: courseId });
  if (!course) {
    throw new NotFoundError(`Course with ${courseId} does not exist`);
  }
  const ratings = await courseRating.find({ course: courseId });
  res.status(StatusCodes.OK).json({ ratings });
};

export const createComment = async (req: any, res: any) => {
  const { userId } = req.user;
  const { courseId } = req.course;
  const comment = await courseComment.create({ student: userId, course: courseId, comment: req.body.comment });
  const comments = await courseComment.find({ course: courseId });
  emitcourseComments(courseId, comments);
  res.status(StatusCodes.CREATED).json({ comment });
};

export const courseComments = async (req: any, res: any) => {
  const { courseId } = req.params;
  const course = await Course.findOne({ _id: courseId });
  if (!course) {
    throw new NotFoundError(`Course with ${courseId} does not exist`);
  }
  const comments = await courseComment.find({ course: courseId });
  emitcourseComments(courseId, comments);
  res.status(StatusCodes.OK).json({ comments });
};

export const editComment = async (req: any, res: any) => {
  const { userId } = req.user;
  const { courseId } = req.course;
  const { commentId } = req.params;
  const comment = await courseComment.findOneAndUpdate(
    { _id: commentId, course: courseId, student: userId },
    { comment: req.body.comment },
    { new: true, runValidators: true }
  );
  if (!comment) {
    throw new NotFoundError(`comment not found`);
  }
  res.status(StatusCodes.OK).json({ comment });
};

export const deleteComment = async (req: any, res: any) => {
  const { userId } = req.user;
  const { courseId } = req.course;
  const { commentId } = req.params;
  const comment = await courseComment.findOneAndDelete({ _id: commentId, course: courseId, student: userId });
  if (!comment) {
    throw new NotFoundError(`comment not found`);
  }
  res.status(StatusCodes.OK).json({ success: "comment deleted successfully" });
};
