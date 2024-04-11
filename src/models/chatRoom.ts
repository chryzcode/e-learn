import mongoose from "mongoose";

const courseRoomSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
});

const roomMessageSchema = new mongoose.Schema(
    {
    message: {
      type: String,
      required: [true, "message field is required"],
    },
    media: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const courseRoom = mongoose.model("courseRoom", courseRoomSchema);
export const roomMessage = mongoose.model("roomMessage", roomMessageSchema);
