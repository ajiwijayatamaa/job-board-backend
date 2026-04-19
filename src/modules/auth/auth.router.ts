import express, { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ForgotPasswordDTO, LoginDTO, RegisterDTO, ResetPasswordDTO } from "./dto/auth.dto.js";

export class AuthRouter {
  private router: Router;

  constructor(
    private controller: AuthController,
    private validationMiddleware: ValidationMiddleware,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = (): void => {
    this.router.post(
      "/register",
      this.validationMiddleware.validateBody(RegisterDTO),
      this.controller.register,
    );
    this.router.post(
      "/login",
      this.validationMiddleware.validateBody(LoginDTO),
      this.controller.login,
    );
    this.router.post(
      "/forgot-password",
      this.validationMiddleware.validateBody(ForgotPasswordDTO),
      this.controller.forgotPassword,
    );
    this.router.post(
      "/reset-password",
      this.validationMiddleware.validateBody(ResetPasswordDTO),
      this.controller.resetPassword,
    );

    this.router.get("/verify-email", this.controller.verifyEmail);

    // Protected Routes
    this.router.post(
      "/resend-verification",
      this.authMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.controller.resendVerification,
    );
  };

  getRouter = (): Router => {
    return this.router;
  };
}
