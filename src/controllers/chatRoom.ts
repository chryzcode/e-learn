import cloudinary from "cloudinary";
import { StatusCodes } from "http-status-codes";
import { courseRoom, roomMessage } from "../models/chatRoom";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { isImage } from "../utils/mediaType";
import express from "express";
import http from "http";
import { init as initSocket, emitroomMessages } from "../utils/socket";

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

export const userRooms = async (req: any, res: any) => {
  const { userId } = req.user;
  const rooms = await courseRoom.find({ users: userId });
  res.status(StatusCodes.OK).json({ rooms });
};

export const roomMessages = async (req: any, res: any) => {
  const { userId } = req.user;
  const { roomId } = req.course;
  const room = await courseRoom.findOne({ _id: roomId, users: userId });
  if (!room) {
    throw new NotFoundError(`Room does not exist`);
  }
  const messages = await roomMessage.find({ room: roomId }).sort("createdAt");
  emitroomMessages(roomId);
  res.status(StatusCodes.OK).json({ messages });
};

export const sendMessage = async (req: any, res: any) => {
  const { roomId } = req.params;
  const { userId } = req.user;
  req.body.room = roomId;
  req.body.sender = userId;
  if (req.body.media) {
    if (isImage(req.body.media) == false) {
      throw new BadRequestError("Image/ Media type not supported");
    }
    try {
      const result = await cloudinary.v2.uploader.upload(req.body.media, {
        folder: "E-Learn/Message/Image/",
        use_filename: true,
      });
      req.body.media = result.url;
    } catch (error) {
      console.error(error);
      throw new BadRequestError("error uploading video on cloudinary");
    }
  }
  const room = await courseRoom.findOne({ course: roomId, users: userId });
  if (!room) {
    throw new NotFoundError(`Room does not exist`);
  }
  const message = await roomMessage.create({ ...req.body });
  emitroomMessages(roomId);
  res.status(StatusCodes.OK).json({ message });
};

export const editMessage = async (req: any, res: any) => {};
