import express, { Router } from "express";
import { CVController } from "./cv.controller.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";
import { CreateCVDTO } from "./dto/cv.dto.js";

export class CVRouter {
  private router: Router;

  constructor(
    private controller: CVController,
    private authMiddleware: AuthMiddleware,
    private uploadMiddleware: UploadMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes = (): void => {
    const verifyToken = this.authMiddleware.verifyToken(
      process.env.JWT_SECRET as string
    );
    const verifyVerified = this.authMiddleware.verifyVerified();

    this.router.post(
      "/",
      verifyToken,
      verifyVerified,
      this.validationMiddleware.validateBody(CreateCVDTO),
      this.uploadMiddleware.uploadPDF(2).single("cv"),
      this.controller.create
    );

    this.router.get(
      "/",
      verifyToken,
      verifyVerified,
      this.controller.getAll
    );

    this.router.patch(
      "/:id/primary",
      verifyToken,
      verifyVerified,
      this.controller.setPrimary
    );

    this.router.delete(
      "/:id",
      verifyToken,
      verifyVerified,
      this.controller.delete
    );
  };

  getRouter = (): Router => {
    return this.router;
  };
}