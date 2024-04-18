import { createServer } from "node:http";
import { Server } from "socket.io";
import { roomMessage, courseRoom } from "../models/chatRoom";
import { User } from "../models/user";
import { courseComment } from "../models/course";

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

  socket.on("removeUser", async (userId: string, roomId: string) => {
    const user = await User.findOne({ _id: userId });
    const room = await courseRoom.findOne({ _id: roomId });
    socket.broadcast.to(room?.id).emit("message", `${user?.fullName} was removed from the chat room `);
  });

    socket.on("courseComments", async (courseId: string) => {
      const comments = await courseComment.find({ course: courseId }).sort("createdAt");
      io.to(courseId).emit("courseComments", { courseId, comments });
    });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});


