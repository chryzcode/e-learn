import socketIo from "socket.io";
import { Server } from "http"; // Import Server type from "http" module
import { courseComment } from "../models/course";
import { roomMessage, courseRoom } from "../models/chatRoom";
import { User } from "../models/user";

const botName = "The E-Learn Bot";

let io: any;

const init = (httpServer: any) => {
  io = new Server(httpServer);

  io.on("connection", (socket: socketIo.Socket) => {
    console.log("A client connected");

    // Handle disconnections
    socket.on("disconnect", () => {
      console.log("A client disconnected");
    });
  });
};

const joinRoom = async (roomId: string, userId: string) => {
  if (io) {
    const user = await User.findOne({ _id: userId });
    const room = await courseRoom.findOne({ _id: roomId });
    io.broadcast.to(room).emit("joinRoom", `${user?.fullName} has joined the chat`);
  } else {
    console.error("Socket.IO is not initialized");
  }
};

const emitCourseLiked = (courseId: string, courseLikes: number) => {
  // Assuming courseId is string and courseLikes is number
  if (io) {
    // Check if io is initialized
    io.emit("courseLiked", { courseId, courseLikes });
  } else {
    console.error("Socket.IO is not initialized");
  }
};

const emitcourseComments = async (courseId: string) => {
  if (io) {
    const comments = await courseComment.find({ course: courseId }).sort("createdAt");
    io.to(courseId).emit("courseComments", { courseId, comments });
  } else {
    console.error("Socket.IO is not initialized");
  }
};

const emitroomMessages = async (roomId: string) => {
  if (io) {
    const messages = await roomMessage.find({ room: roomId }).sort("createdAt");
    io.to(roomId).emit("roomMessages", { roomId, messages });
  } else {
    console.error("Socket.IO is not initialized");
  }
};

export { init, emitCourseLiked, emitcourseComments, emitroomMessages };
