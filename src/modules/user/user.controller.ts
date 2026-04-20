import { plainToInstance } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import { UserService } from "./user.service.js";
import { UpdateProfileDTO } from "../user/dto/user.dto.js";

export class UserController {
  constructor(private service: UserService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(res.locals.existingUser.id);
      const result = await this.service.getProfile(userId);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(res.locals.existingUser.id);
      const body = plainToInstance(UpdateProfileDTO, req.body);
      const result = await this.service.updateProfile(userId, body);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  updateProfilePicture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number(res.locals.existingUser.id);
      const result = await this.service.updateProfilePicture(userId, req.file);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
}