import { StatusCodes } from "http-status-codes";
import { courseRoom, roomMessage } from "../models/chatRoom";
import { courseStudent } from "../models/course";
import { User } from "../models/user";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { io } from "../utils/socket";

export const createAnnouncement = async (roomId: any, message: any, sender: any) => {
  // Create the announcement message and populate the sender field
  const announcement = await roomMessage.create({
    room: roomId,
    message,
    sender,
    isAnnouncement: true,
  });

  // Populate the sender field
  await announcement.populate("sender");

  // Return the populated announcement
  return announcement;
};

export const userRooms = async (req: any, res: any) => {
  const { userId } = req.user;
  const rooms = await courseRoom
    .find({ users: userId })
    .populate({
      path: "course",
      select: "title thumbnail instructor",
    })
    .populate({
      path: "users",
      select: "fullName userType avatar",
    });
  res.status(StatusCodes.OK).json({ rooms });
};

export const roomMessages = async (req: any, res: any) => {
  const { userId } = req.user;
  const { roomId } = req.params;
  const room = await courseRoom.findOne({ _id: roomId, users: userId });
  if (!room) {
    throw new NotFoundError(`Room does not exist`);
  }
  const messages = await roomMessage.find({ room: roomId }).sort("createdAt").populate({
    path: "sender",
    select: "fullName avatar",
  });
  io.to(roomId).emit("roomMessages", messages);
  res.status(StatusCodes.OK).json({ messages });
};

export const sendMessage = async (req: any, res: any) => {
  const { roomId } = req.params;
  const { userId } = req.user;
  req.body.room = roomId;
  req.body.sender = userId;
  const room = await courseRoom.findOne({ _id: roomId, users: userId });
  if (!room) {
    throw new NotFoundError(`Room does not exist`);
  }
  const message = await roomMessage.create({ ...req.body });
  io.to(room?.id).emit("message", message);
  res.status(StatusCodes.OK).json({ message });
};

export const editMessage = async (req: any, res: any) => {
  const { messageId, roomId } = req.params;
  const { userId } = req.user;
  var message = await roomMessage.findOne({ _id: messageId, room: roomId, sender: userId });
  if (!message) {
    throw new NotFoundError(`Message not found`);
  }
  message = await roomMessage.findOneAndUpdate({ _id: messageId, room: roomId, sender: userId }, req.body, {
    new: true,
    runValidators: true,
  });

  io.to(roomId).emit("message", message);
  res.status(StatusCodes.OK).json({ message });
};

export const deleteMessage = async (req: any, res: any) => {
  const { messageId, roomId } = req.params;
  const { userId } = req.user;
  const message = await roomMessage.findOneAndDelete({ _id: messageId, room: roomId, sender: userId });
  if (!message) {
    throw new NotFoundError(`Message not found`);
  }
  io.to(roomId).emit("message", message);
  res.status(StatusCodes.OK).json({ success: "Message deleted successfully" });
};

export const leaveRoom = async (req: any, res: any) => {
  const { roomId } = req.params;
  const { userId } = req.user;
  const user = await User.findOne({ _id: userId });
  const room = await courseRoom.findOneAndUpdate({ _id: roomId }, { $pull: { users: userId } }, { new: true });
  if (!room) {
    throw new NotFoundError(`Room does not exist`);
  }
  io.to(room?.id).emit("message", `${user?.fullName} has left the chat`);
  res.status(StatusCodes.OK).json({ success: "you have successfully left the room" });
};

export const getAChatRoom = async (req: any, res: any) => {
  const { roomId } = req.params;
  // Find the chat room and populate the course details, including thumbnail and title
  const room = await courseRoom.findById(roomId).populate({
    path: "course", // Path to the course reference in the room schema
    select: "thumbnail title", // Fields to include from the course
    populate: {
      path: "instructor", // Populate the instructor field in the course
      select: "fullName", // Specify the fields you want to include from the instructor
    },
  });

  if (!room) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Room does not exist" });
  }

  res.status(StatusCodes.OK).json({ room });
};

export const getAChatRoomByCourseId = async (req: any, res: any) => {
  const { courseId } = req.params;
  // Find the chat room and populate the course details, including thumbnail and title
  const room = await courseRoom.findOne({ course: courseId });

  if (!room) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Room does not exist" });
  }

  res.status(StatusCodes.OK).json({ room });
};

export const inviteUserToRoom = async (req: any, res: any) => {
  const { roomId, userId } = req.params;
  const room = await courseRoom.findOne({ _id: roomId });
  const isStudent = await courseStudent.findOne({ course: room?.course, student: userId });
  const user = await User.findOne({ _id: userId });

  if (!room) {
    throw new NotFoundError(`Room does not exist`);
  }
  if (!isStudent) {
    throw new BadRequestError(`You cannot add a user who has not registered for the course`);
  }
  if (room.users.includes(userId)) {
    throw new BadRequestError(`User is already in the room`);
  }

  // Update the room with the new user
  await courseRoom.findOneAndUpdate({ _id: roomId }, { $push: { users: userId } }, { new: true });

  const announcementMessage = `${user?.fullName} has joined the chat room`;
  const announcement = await createAnnouncement(roomId, announcementMessage, user);

  // Emit the announcement message to all clients in the room
  io.to(roomId).emit("newMessage", announcement);

  res.status(StatusCodes.OK).json({ success: "You have successfully joined the room" });
};

export const removeUser = async (req: any, res: any) => {
  const { roomId, userId } = req.params;
  const room = await courseRoom.findOneAndUpdate(
    { _id: roomId, users: userId },
    { $pull: { users: userId } },
    { new: true }
  );
  if (!room) {
    throw new NotFoundError(`Room does not exist`);
  }
  res.status(StatusCodes.OK).json({ success: `${userId} has been successfully sent off the room` });
};
