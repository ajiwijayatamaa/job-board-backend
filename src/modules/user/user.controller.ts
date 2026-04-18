import { Request, Response } from "express";
import { UserService } from "./user.service.js";
import { UpdateProfileDTO } from "../user/dto/user.dto.js";

export class UserController {
  constructor(private service: UserService) {}

  getProfile = async (req: Request, res: Response) => {
    const userId = res.locals.existingUser.id;
    const result = await this.service.getProfile(userId);
    res.status(200).send(result);
  };

  updateProfile = async (req: Request, res: Response) => {
    const userId = res.locals.existingUser.id;
    const body = req.body as UpdateProfileDTO;
    const file = req.file;
    const result = await this.service.updateProfile(userId, body, file);
    res.status(200).send(result);
  };
}