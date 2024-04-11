import cloudinary from "cloudinary";
import { Course, courseCategory, courseStudent, courseLike, courseRating, courseComment } from "../models/course";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { isImage } from "../utils/mediaType";
import express from "express";
import http from "http";
import { init as initSocket, emitCourseLiked, emitcourseComments } from "../utils/socket";
