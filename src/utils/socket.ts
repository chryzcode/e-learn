import { Server } from "socket.io";
import { createServer } from "http";
import { app } from "../app"; // Import the Express app
import { User } from "../models/user";
import { courseRoom } from "../models/chatRoom";

// Create an HTTP server from the Express app
const httpServer = createServer(app);

// Create a new Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins (for testing, consider locking this down in production)
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
  },
});

io.on("connection", socket => {
  console.log("A client connected");

  socket.on("joinRoom", async (courseId: string, userId: string) => {
    const room = await courseRoom.findOne({ course: courseId });
    const user = await User.findOne({ _id: userId });
    if (room) {
      socket.join(room.id);

      // Welcome message only for the current user
      socket.emit("message", `Welcome! ${user?.fullName}`);

      // Broadcast when a user connects to everyone except the newly joined client
      socket.broadcast.to(room.id).emit("joinRoom", `${user?.fullName} just joined the chat room`);
    }
  });

  socket.on("removeUser", async (userId: string, roomId: string) => {
    const user = await User.findOne({ _id: userId });
    const room = await courseRoom.findOne({ _id: roomId });
    if (room && user) {
      socket.broadcast.to(room.id).emit("message", `${user.fullName} was removed from the chat room`);
    }
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

export { io };
