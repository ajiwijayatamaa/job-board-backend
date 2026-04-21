import express, { Router } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { UserController } from "./user.controller.js";
import { UpdateProfileDTO } from "../user/dto/user.dto.js";

export class UserRouter {
  private router: Router;

  constructor(
    private controller: UserController,
    private authMiddleware: AuthMiddleware,
    private uploadMiddleware: UploadMiddleware,
    private validationMiddleware: ValidationMiddleware
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = (): void => {
    this.router.get(
      "/profile",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.controller.getProfile
    );

    this.router.patch(
      "/profile",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyVerified(),
      this.validationMiddleware.validateBody(UpdateProfileDTO),
      this.controller.updateProfile
    );

    this.router.patch(
      "/profile-picture",
      this.authMiddleware.verifyToken(process.env.JWT_ACCESS_SECRET!),
      this.authMiddleware.verifyVerified(),
      this.uploadMiddleware.uploadImage(2).single("profilePhoto"),
      this.controller.updateProfilePicture
    );
  };

  getRouter = (): Router => {
    return this.router;
  };
}