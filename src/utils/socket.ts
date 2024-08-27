// In your server file (likely app.js or similar)

import { Server } from "socket.io";
import { createServer } from "http";
import { app } from "../app"; // Import the Express app
import { User } from "../models/user";
import { courseRoom } from "../models/chatRoom";
import { roomMessage } from "../models/chatRoom"; // Import your roomMessage model

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

  // Join Room
  socket.on("joinRoom", async (courseId, userId) => {
    const room = await courseRoom.findOne({ course: courseId });
    const user = await User.findOne({ _id: userId });

    if (room) {
      socket.join(room.id);

      // Send all existing messages to the newly joined user
      const messages = await roomMessage.find({ room: room.id }).populate("sender");
      socket.emit("roomMessages", messages);
    }
  });

  // Send Message
  socket.on("sendMessage", async messageData => {
    const { roomId, message, sender } = messageData;
    const room = await courseRoom.findOne({ _id: roomId });
    if (room) {
      // Save the message to the database
      const newMessage = await roomMessage.create({
        room: roomId,
        message: message,
        sender: sender,
      });

      // Populate the sender data for the new message
      await newMessage.populate("sender");

      // Emit the new message to all clients in the room
      io.to(roomId).emit("newMessage", newMessage);
    }
  });

  // Edit Message
  socket.on("editMessage", async messageData => {
    const { messageId, roomId, updatedMessage } = messageData;

    // Update the message content and set the edited flag to true
    const message = await roomMessage
      .findOneAndUpdate(
        { _id: messageId, room: roomId },
        { message: updatedMessage, edited: true },
        { new: true, runValidators: true }
      )
      .populate("sender");

    if (message) {
      // Emit the updated message to all clients in the room
      io.to(roomId).emit("updatedMessage", message);
    }
  });

  // Delete Message
  socket.on("deleteMessage", async messageData => {
    const { messageId, roomId } = messageData;
    const deletedMessage = await roomMessage.findOneAndDelete({ _id: messageId, room: roomId });

    // Fetch the latest messages for all clients
    const messages = await roomMessage.find({ room: roomId }).populate("sender");

    // Emit the updated list of messages to all clients in the room
    io.to(roomId).emit("roomMessages", messages);

    // Emit delete message announcement
    if (deletedMessage) {
      const user = await User.findOne({ _id: deletedMessage.sender });
      const userName = user ? user.fullName : "Unknown User";

      io.to(roomId).emit("announcement", {
        type: "messageDeleted",
        message: `${userName} deleted a message`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Remove User
  socket.on("removeUser", async (userId, roomId) => {
    const user = await User.findOne({ _id: userId });
    const room = await courseRoom.findOneAndUpdate({ _id: roomId }, { $pull: { users: userId } }, { new: true });

    if (room && user) {
      io.to(room.id).emit("announcement", {
        type: "userRemoved",
        message: `${user.fullName} was removed from the chat room`,
        userId: userId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

export { io };
