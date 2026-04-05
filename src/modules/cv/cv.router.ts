import { Router } from "express";
import { CVController } from "./cv.controller.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";

export class CVRouter {
  private router: Router = Router();
  private controller = new CVController();
  private authMiddleware = new AuthMiddleware();
  private upload = new UploadMiddleware();

  constructor() {
    this.router = Router ();
    this.controller = new CVController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const verifyToken = this.authMiddleware.verifyToken(
        process.env.JWT_SECRET as string
    );

    this.router.post(
      "/",
      verifyToken,
      this.upload.uploadPDF(2).single("cv"),
      this.controller.create
    );

    this.router.get(
      "/",
      verifyToken,
      this.controller.getAll
    );

    this.router.patch(
      "/:id/primary",
      verifyToken,
      this.controller.setPrimary
    );

    this.router.delete(
      "/:id",
      verifyToken,
      this.controller.delete
    );
  }

  getRouter() {
    return this.router;
  }
}