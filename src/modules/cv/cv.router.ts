import { Router } from "express";
import { CVController } from "./cv.controller.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { UploadMiddleware } from "../../middlewares/upload.middleware.js";
import { ValidationMiddleware } from "../../middlewares/validation.middleware.js";

export class CVRouter {
  private router: Router;

  constructor(
    private controller: CVController,
    private authMiddleware: AuthMiddleware,
    private uploadMiddleware: UploadMiddleware,
    private validationMiddleware: ValidationMiddleware,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const verifyToken = this.authMiddleware.verifyToken(
      process.env.JWT_ACCESS_SECRET as string,
    );

    this.router.post(
      "/",
      verifyToken,
      this.uploadMiddleware.uploadPDF(2).single("cv"),
      this.controller.create,
    );

    // ⚠️ /:id/file harus SEBELUM / agar tidak bentrok dengan GET /
    this.router.get("/:id/file", this.controller.streamFile);

    this.router.get("/", verifyToken, this.controller.getAll);

    this.router.patch("/:id/primary", verifyToken, this.controller.setPrimary);

    this.router.delete("/:id", verifyToken, this.controller.delete);
  }

  public getRouter(): Router {
    return this.router;
  }
}
