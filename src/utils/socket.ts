import { createServer } from "http"; // Import from "http" instead of "node:http"
import { Server } from "socket.io";
import { roomMessage, courseRoom } from "../models/chatRoom";
import { User } from "../models/user";
import { app } from "../app"; // Import the Express app

// Create an HTTP server from the Express app
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins (for testing, consider locking this down in production)
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
  },
});

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

    // Broadcast when a user connects to everyone except the newly joined client
    socket.broadcast.to(room?.id).emit("joinRoom", `${user?.fullName} just joined the chat room`);
  });

  socket.on("removeUser", async (userId: string, roomId: string) => {
    const user = await User.findOne({ _id: userId });
    const room = await courseRoom.findOne({ _id: roomId });
    socket.broadcast.to(room?.id).emit("message", `${user?.fullName} was removed from the chat room`);
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

// Start the HTTP server (the server that runs both Express and Socket.IO)
const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
