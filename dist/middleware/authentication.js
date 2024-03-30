"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../errors/index");
const user_1 = require("../models/user");
const JWT_SECRET = process.env.JWT_SECRET;
exports.default = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // check header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        throw new index_1.UnauthenticatedError("Authentication invalid");
    }
    const token = authHeader.split(" ")[1];
    const user = yield user_1.User.findOne({ token: token, verified: true });
    if (user) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // attach the user to the job routes
            req.user = { userId: payload.userId, firstName: payload.firstName };
            next();
        }
        catch (error) {
            throw new index_1.UnauthenticatedError("Authentication invalid");
        }
    }
    else {
        throw new index_1.UnauthenticatedError("Authentication invalid");
    }
});
