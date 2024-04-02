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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "courseCategory",
      required: [true, "category field is required"],
    },
    currency: {
      type: String,
      enum: ["ngn"],
      default: "ngn",
    },
    price: {
      type: Number,
      default: 0,
    },
    free: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.pre("save", async function () {
  if (this.price > 1) {
    this.free = false;
  }
});

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

const courseCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'name field is required']
  }
})

export const Course = mongoose.model("Course", courseSchema);
export const courseStudent = mongoose.model("courseStudent", courseStudentSchema);
export const courseLike = mongoose.model("courseLike", courseLikeSchema);
export const courseRating = mongoose.model("courseRating", courseRatingSchema);
export const courseComment = mongoose.model("courseComment", courseCommentSchema);
export const courseCategory = mongoose.model("courseCategory", courseCategorySchema);