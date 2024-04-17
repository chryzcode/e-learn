import { createServer } from "node:http";
import { Server } from "socket.io";
import express from "express";
import { Course, courseComment } from "../models/course";
import { roomMessage, courseRoom } from "../models/chatRoom";
import { User } from "../models/user";

// Create an HTTP server using the http module
const server = createServer();

// Initialize Socket.IO by passing the HTTP server instance
const io = new Server(server);

// Export the io instance so it can be used in other parts of your application
export { io };

// Optionally, you can define event handlers for socket connections
io.on("connection", socket => {
  console.log("A client connected");

  socket.on("joinRoom", async (courseId: string, userId: string) => {
    const room = await courseRoom.findOne({ course: courseId });
    const user = await User.findOne({ _id: userId });
    socket.join(room?.id);

    // Welcome message only for the current user
    socket.emit("message", `Welcome! ${user?.fullName}`);

    //broadcast when a user connects to everyone except the newly joined client
    socket.broadcast.to(room?.id).emit("joinRoom", `${user?.fullName} just joined the chat room `);
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

// const app = express();
// const server = createServer(app);
// const io = new Server(server);

// io.on("connection", socket => {
//   socket.on("joinRoom", async (courseId: string, userId: string) => {
//     const room = await courseRoom.findOne({ course: courseId });
//     const user = await User.findOne({ _id: userId });
//     socket.join(room?.id);

//     // Welcome message only for the current user
//     socket.emit("message", `Welcome! ${user?.fullName}`);

//     //broadcast when a user connects to everyone except the newly joined client
//     socket.broadcast.to(room?.id).emit("joinRoom", `${user?.fullName} just joined the chat room `);
//   });

//   socket.on("chatMessage", async (message: any, userId: string, roomId: string) => {
//     const user = await User.findOne({ _id: userId });
//     const room = await courseRoom.findOne({ _id: roomId });
//     io.to(room?.id).emit("message", (user?.fullName, message));
//   });

//   socket.on("roomMessages", async (roomId: string) => {
//     const messages = await roomMessage.find({ room: roomId }).sort("createdAt");
//     io.to(roomId).emit("roomMessages", messages);
//   });

//   socket.on("removeUser", async (userId: string, roomId: string) => {
//     const user = await User.findOne({ _id: userId });
//     const room = await courseRoom.findOne({ _id: roomId });
//     socket.broadcast.to(room?.id).emit("message", `${user?.fullName} was removed from the chat room `);
//   });

//   //Runs when the client leaves room
//   socket.on("leaveRooom", async (userId: string, roomId: string) => {
//     // to everyone chat room
//     const user = await User.findOne({ _id: userId });
//     const room = await courseRoom.findOne({ _id: roomId });

//     if (user) {
//       io.to(room?.id).emit("message", `${user.fullName} has left the chat`);
//     }
//   });

//   socket.on("courseLiked", async (courseId: string, courseLikes: number) => {
//     io.to(courseId).emit("courseLiked", { courseId, courseLikes });
//   });

//   socket.on("courseComments", async (courseId: string) => {
//     const comments = await courseComment.find({ course: courseId }).sort("createdAt");
//     io.to(courseId).emit("courseComments", { courseId, comments });
//   });

//   //Runs when the client disconnects
//   socket.on("disconnect", () => {});
// });
