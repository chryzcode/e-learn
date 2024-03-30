import { StatusCodes } from "http-status-codes";
import CustomAPIError from "./custom-api";

export default class UnauthenticatedError extends CustomAPIError {
  statusCode: Number
  constructor(message: String) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}
