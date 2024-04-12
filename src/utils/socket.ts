import socketIo from "socket.io";
import { Server } from "http"; // Import Server type from "http" module
import { courseComment } from "../models/course";

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
    const comments = await courseComment.find({ course: courseId });
    io.emit("courseComments", { courseId, comments });
  } else {
    console.error("Socket.IO is not initialized");
  }
};

const emitroomMessages = async (roomId: string, messages: any) => {
  if (io) {
    io.emit("roomMessages", { roomId, messages });
  } else {
    console.error("Socket.IO is not initialized");
  }
};

export { init, emitCourseLiked, emitcourseComments, emitroomMessages };
