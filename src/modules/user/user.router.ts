import express, { Router } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { UserController } from "./user.controller.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import { UpdateProfileDTO } from "../user/dto/user.dto.js";

export class UserRouter {
  private router: Router;

  constructor(
    private controller: UserController,
    private authMiddleware: AuthMiddleware,
    private validationMiddleware: ValidationMiddleware,
    private uploadMiddleware: UploadMiddleware,
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = (): void => {
    const verifyToken = this.authMiddleware.verifyToken(
      process.env.JWT_SECRET as string
    );

    this.router.get(
      "/me",
      verifyToken,
      this.controller.getProfile
    );

    this.router.patch(
      "/me",
      verifyToken,
      this.uploadMiddleware.uploadImage(1).single("profilePhoto"),
      this.validationMiddleware.validateBody(UpdateProfileDTO),
      this.controller.updateProfile
    );
  };

  getRouter = (): Router => {
    return this.router;
  };
}