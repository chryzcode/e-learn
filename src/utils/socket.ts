import { Server } from "socket.io";
import { createServer } from "http";
import { app } from "../app"; // Import the Express app
import { User } from "../models/user";
import { courseRoom } from "../models/chatRoom";
import { roomMessage } from "../models/chatRoom"; // Import your roomMessage model
import { createAnnouncement } from "../controllers/chatRoom";

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

  socket.on("joinRoom", async (courseId, userId) => {
    const room = await courseRoom.findOne({ course: courseId });
    if (room) {
      socket.join(room.id);
      const messages = await roomMessage.find({ room: room.id }).populate("sender");
      socket.emit("roomMessages", messages);
    }
  });

  socket.on("sendMessage", async messageData => {
    const { roomId, message, sender } = messageData;
    const newMessage = await roomMessage.create({ room: roomId, message, sender });
    await newMessage.populate("sender");
    console.log("Emitting newMessage:", newMessage);
    io.to(roomId).emit("newMessage", newMessage);
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

  socket.on("deleteMessage", async messageData => {
    try {
      const { messageId, roomId } = messageData;
      const deletedMessage = await roomMessage.findOneAndDelete({ _id: messageId, room: roomId });

      const messages = await roomMessage.find({ room: roomId }).populate("sender");
      io.to(roomId).emit("roomMessages", messages);

      if (deletedMessage) {
        const user = await User.findOne({ _id: deletedMessage.sender });
        const userName = user?.fullName;
        const announcementMessage = `${userName} deleted a message`;
        const announcement = await createAnnouncement(roomId, announcementMessage, user);

        // Emit the announcement message to all clients in the room
        io.to(roomId).emit("newMessage", announcement);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  });

  // Remove User
 socket.on("removeUser", async (userId, roomId) => {
  try {
    const user = await User.findOne({ _id: userId });
    const room = await courseRoom.findOneAndUpdate({ _id: roomId }, { $pull: { users: userId } }, { new: true });

    if (room && user) {
      const announcementMessage = `${user.fullName} was removed from the chat room`;
      const announcement = await createAnnouncement(room.id, announcementMessage, user);

      // Emit the announcement message to all clients in the room
      io.to(roomId).emit("newMessage", announcement);
    }
  } catch (error) {
    console.error("Error removing user:", error);
  }
});


  // **New Socket Event to Get Room Messages**
  socket.on("getRoomMessages", async roomId => {
    // Fetch all messages for the specified room
    const messages = await roomMessage.find({ room: roomId }).populate("sender");

    // Emit the list of messages back to the client
    socket.emit("roomMessages", messages);
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

export { io };
