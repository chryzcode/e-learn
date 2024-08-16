import cloudinary from "cloudinary";
import {
  Course,
  courseCategory,
  courseStudent,
  courseLike,
  courseRating,
  courseComment,
  courseWishlist,
} from "../models/course";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { isVideo, isImage } from "../utils/mediaType";
import { makeCoursePayment } from "../utils/stripe";
import { courseRoom } from "../models/chatRoom";
import { io } from "../utils/socket";
import { uploadToCloudinary } from "../utils/cloudinaryConfig";
import jwt from "jsonwebtoken";
import { User } from "../models/user";

const JWT_SECRET = process.env.JWT_SECRET as any;

export const createCourse = async (req: any, res: any) => {
  const { userId } = req.user;
  req.body.instructor = userId;

  const category = await courseCategory.findOne({ name: req.body.category });
  if (!category) {
    throw new NotFoundError("Category does not exist");
  }
  req.body.category = category.id;

  // Handle video upload if provided
  if (req.files && req.files.video) {
    if (!isVideo(req.files.video[0])) {
      throw new BadRequestError("Video/Media type not supported");
    }
    try {
      const result = await uploadToCloudinary(req.files.video[0]);
      req.body.video = result.secure_url;
    } catch (error) {
      console.error("Error uploading video to Cloudinary:", error);
      return res.status(400).json({ error: "Error uploading video to Cloudinary" });
    }
  }

  // Handle thumbnail upload if provided
  if (req.files && req.files.thumbnail) {
    if (!isImage(req.files.thumbnail[0].originalname)) {
      throw new BadRequestError("Image type not supported");
    }
    try {
      const result = await uploadToCloudinary(req.files.thumbnail[0]);
      req.body.thumbnail = result.secure_url;
    } catch (error) {
      console.error("Error uploading thumbnail to Cloudinary:", error);
      return res.status(400).json({ error: "Error uploading thumbnail to Cloudinary" });
    }
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
  const courses = await Course.find({})
    .populate({
      path: "category",
      select: "name",
    })
    .populate({
      path: "instructor",
      select: "_id fullName userType avatar",
    })
    .sort("createdAt");
  res.status(StatusCodes.OK).json({ courses });
};

export const getAnInstructorCourses = async (req: any, res: any) => {
  const { instructorId } = req.params;
  const courses = await Course.find({ instructor: instructorId })
    .populate("instructor", "fullName")
    .populate("category", "name");
  res.status(StatusCodes.OK).json({ courses });
};

export const instructorCourses = async (req: any, res: any) => {
  const { userId } = req.user;
  const courses = await Course.find({ instructor: userId })
    .populate("instructor", "fullName")
    .populate("category", "name");
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
    await room.save();

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
  const { courseId } = req.params;
  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload: any = jwt.verify(token, process.env.JWT_SECRET || JWT_SECRET);
      const user = await User.findOne({ _id: payload.userId, verified: true });

      if (user) {
        userId = payload.userId; // Attach userId if authenticated
      }
    } catch (error) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Authentication invalid" });
    }
  }

  // Fetch the course with populated fields
  const course = await Course.findOne({ _id: courseId })
    .populate({
      path: "category",
      select: "name",
    })
    .populate({
      path: "instructor",
      select: "_id fullName userType avatar",
    });

  if (!course) {
    throw new NotFoundError(`Course does not exist`);
  }

  // Fetch likes
  const likes = await courseLike.find({ course: courseId }).countDocuments();

  // Fetch comments
  const comments = await courseComment
    .find({ course: courseId })
    .populate({
      path: "student",
      select: "fullName avatar",
    })
    .exec();

  // Fetch ratings
  const ratings = await courseRating.find({ course: courseId });
  const averageRating =
    ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating.numberOfRating, 0) / ratings.length : 0;

  let isStudent = false;
  if (userId) {
    const aStudent = await courseStudent.findOne({ student: userId, course: courseId });
    console.log(aStudent);
    if (aStudent) {
      isStudent = true;
    }
    console.log(isStudent);
  }
  // Construct the course data response
  const courseData = {
    ...course.toObject(),
    video: isStudent ? course.video : null, // Conditionally include video URL
    likes,
    comments,
    averageRating,
  };

  res.status(StatusCodes.OK).json({ course: courseData });
};

export const editCourse = async (req: any, res: any) => {
  const { userId } = req.user;
  const { courseId } = req.params;
  req.body.instructor = userId;

  const category = await courseCategory.findOne({ name: req.body.category });
  if (!category) {
    throw new NotFoundError("Category does not exist");
  }
  req.body.category = category.id;

  // Ensure video field is not modified
  delete req.body.video;

  // Handle thumbnail upload if provided
  if (req.files && req.files.thumbnail) {
    if (!isImage(req.files.thumbnail[0].originalname)) {
      throw new BadRequestError("Image type not supported");
    }
    try {
      const result = await uploadToCloudinary(req.files.thumbnail[0]);
      req.body.thumbnail = result.secure_url;
    } catch (error) {
      console.error("Error uploading thumbnail to Cloudinary:", error);
      return res.status(400).json({ error: "Error uploading thumbnail to Cloudinary" });
    }
  }

  const course = await Course.findOneAndUpdate({ _id: courseId, instructor: userId }, req.body, {
    runValidators: true,
    new: true,
  });

  if (!course) {
    throw new NotFoundError(`Course does not exist`);
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

export const courseStudents = async (req: any, res: any) => {
  const { courseId } = req.params;
  const course = await Course.findOne({ _id: courseId });
  if (!course) {
    throw new NotFoundError(`Course does not exist`);
  }
  const students = await courseStudent.find({ course: course._id });
  res.status(StatusCodes.OK).json({ students });
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
  io.to(courseId).emit("courseLiked", { courseId, courseLikes });
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
  const { courseId } = req.params;

  // Create the comment
  const newComment = await courseComment.create({
    student: userId,
    course: courseId,
    comment: req.body.comment,
  });

  const populatedComment = await courseComment
    .findById(newComment._id)
    .populate("student", "fullName avatar")
    .populate("course", "title");

  res.status(StatusCodes.CREATED).json({ comment: populatedComment });
};
export const courseComments = async (req: any, res: any) => {
  const { courseId } = req.params;
  const course = await Course.findOne({ _id: courseId });
  if (!course) {
    throw new NotFoundError(`Course does not exist`);
  }
  const comments = await courseComment.find({ course: courseId });
  io.to(courseId).emit("courseComments", { courseId, comments });
  res.status(StatusCodes.OK).json({ comments });
};

export const editComment = async (req: any, res: any) => {
  const { userId } = req.user;
  const { courseId } = req.params;
  const { commentId } = req.params;

  const updatedComment = await courseComment.findOneAndUpdate(
    { _id: commentId, course: courseId, student: userId },
    { comment: req.body.comment },
    { new: true, runValidators: true }
  );

  // Check if the comment was found and updated
  if (!updatedComment) {
    throw new NotFoundError("Comment not found");
  }

  // Populate the necessary fields
  const populatedComment = await courseComment
    .findById(updatedComment._id)
    .populate("student", "fullName avatar")
    .populate("course", "title");

  res.status(StatusCodes.OK).json({ comment: populatedComment });
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

export const addCourseWishlist = async (req: any, res: any) => {
  const { userId } = req.user;
  const { courseId } = req.params;
  let userWishlist = await courseWishlist.findOne({ user: userId });
  if (!userWishlist) {
    userWishlist = await courseWishlist.create({ user: userId });
  }
  if (!userWishlist.courses.includes(courseId)) {
    userWishlist.courses.push(courseId);
    await userWishlist.save(); // Save changes to the wishlist
  } else {
    throw new BadRequestError(`Course is bookmarked already`);
  }

  res.status(StatusCodes.OK).json({ userWishlist });
};

export const getUserWishlist = async (req: any, res: any) => {
  const { userId } = req.user;
  const userWishlist = await courseWishlist.findOne({ user: userId }).populate("courses");
  if (!userWishlist) {
    res.status(StatusCodes.OK).json({ wishlist: [] });
    return;
  }
  const wishlist = userWishlist.courses;
  res.status(StatusCodes.OK).json({ wishlist });
};

export const studentCourses = async (req: any, res: any) => {
  const { userId } = req.user;

  const courses = await courseStudent.find({ student: userId }).populate({
    path: "course",
    model: "Course",
    populate: [
      { path: "instructor", model: "User", select: "fullName" },
      { path: "category", model: "courseCategory", select: "name" },
    ],
  });

  res.status(200).json({
    courses: courses.map(cs => cs.course),
  });
};
