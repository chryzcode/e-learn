import socketIo from "socket.io";
import { Server } from "http"; // Import Server type from "http" module
import { Course, courseComment } from "../models/course";
import { roomMessage, courseRoom } from "../models/chatRoom";
import { User } from "../models/user";

let io: any;

export const init = (httpServer: any) => {
  io = new Server(httpServer);

  io.on("connection", (socket: socketIo.Socket) => {
    console.log("A client connected");

    // Handle disconnections
    socket.on("disconnect", () => {
      console.log("A client disconnected");
    });
  });
};

export const joinRoom = async (courseId: string, userId: string) => {
  if (io) {
    const room = await courseRoom.findOne({ course: courseId });
    const user = await User.findOne({ _id: userId });
    //broadcast when a user connects to everyone except the newly joined client
    io.broadcast.to(room?.id).emit("joinRoom", `${user?.fullName} just joined the chat room `);
  } else {
    console.error("Socket.IO is not initialized");
  }
};

export const emitRemoveUser = async (roomId: string, userId: string) => {
  if (io) {
    const user = await User.findOne({ _id: userId });
    //broadcast when a user connects to everyone except the newly joined client
    io.broadcast.to(roomId).emit("removeUser", `${user?.fullName} was removed from the chat room `);
  } else {
    console.error("Socket.IO is not initialized");
  }
};

export const emitLeaveRoom = async (roomId: string, userId: string) => {
  if (io) {
    const user = await User.findOne({ _id: userId });
    io.to(roomId).emit("leaveRooom", `${user?.fullName} just left the chat room`);
  } else {
    console.error("Socket.IO is not initialized");
  }
};

export const emitCourseLiked = (courseId: string, courseLikes: number) => {
  // Assuming courseId is string and courseLikes is number
  if (io) {
    // Check if io is initialized
    io.to(courseId).emit("courseLiked", { courseId, courseLikes });
  } else {
    console.error("Socket.IO is not initialized");
  }
};

export const emitcourseComments = async (courseId: string) => {
  if (io) {
    const comments = await courseComment.find({ course: courseId }).sort("createdAt");
    io.to(courseId).emit("courseComments", { courseId, comments });
  } else {
    console.error("Socket.IO is not initialized");
  }
};

export const emitroomMessages = async (roomId: string) => {
  if (io) {
    const messages = await roomMessage.find({ room: roomId }).sort("createdAt");
    io.to(roomId).emit("roomMessages", { roomId, messages });
  } else {
    console.error("Socket.IO is not initialized");
  }
};
