import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    video: {
      type: String,
      required: [true, "uploading video is necessary"],
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const courseStudentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
});

const courseLikeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
});

const courseRatingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },

    numberOfRating: {
      type: Number,
      required: [true, "Please provide number of rating between 1 to 5"],
      min: 1,
      max: 5,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  },
  {
    timestamps: true,
  }
);

const courseCommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    comment: {
      type: String,
      required: [true, "Comment field is required"],
    },
  },
  {
    timestamps: true,
  }
);

export const Course = mongoose.model("Course", courseSchema);
export const courseStudent = mongoose.model("courseStudent", courseStudentSchema);
export const courseLike = mongoose.model("courseLike", courseLikeSchema);
export const courseRating = mongoose.model("courseRating", courseRatingSchema);
export const courseComment = mongoose.model("courseComment", courseCommentSchema);