import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "fullName is required"],
    },
    avatar: {
      type: String,
    },
    userType: {
      type: String,
      enum: ["Instructor", "Student"],
      required: [true, "userType is required"],
    },
    email: {
      required: true,
      type: String,
      unique: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
      minlength: 5,
    },
    token: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const JWT_SECRET = process.env.JWT_SECRET as any;

userSchema.methods.createJWT = function () {
  const token = jwt.sign({ userId: this._id, fullName: this.fullName }, JWT_SECRET, {
    expiresIn: "27h" ,
  });
  this.token = token;
  return token;
};

userSchema.methods.comparePassword = async function (candidatePassword: any) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

export const User = mongoose.model("User", userSchema);

