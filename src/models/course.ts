import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "title field is required"],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    thumbnail: {
      type: String,
      required: [true, "thumbnail field is required"],
    },

    video: {
      type: String,
      required: [true, "video field is required"],
    },

    description: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "courseCategory",
      required: [true, "category field is required"],
    },
    currency: {
      type: String,
      enum: ["usd"],
      default: "usd",
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
    ref: "User",
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
});


const courseCommentSchema = new mongoose.Schema(
  {
    student: {
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
    required: [true, "name field is required"],
  },
});

const courseWishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  courses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
});



export const Course = mongoose.model("Course", courseSchema);
export const courseStudent = mongoose.model("courseStudent", courseStudentSchema);
export const courseLike = mongoose.model("courseLike", courseLikeSchema);
export const courseComment = mongoose.model("courseComment", courseCommentSchema);
export const courseCategory = mongoose.model("courseCategory", courseCategorySchema);
export const courseWishlist = mongoose.model("courseWishlist", courseWishlistSchema);