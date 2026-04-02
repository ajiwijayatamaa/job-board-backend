import { Router } from "express";
import { Role } from "../../generated/prisma/enums.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { JobController } from "./job.controller.js";

export class JobRouter {
  private router: Router;
  private controller: JobController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.controller = new JobController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const verifyToken = this.authMiddleware.verifyToken(
      process.env.JWT_SECRET as string
    );

    const verifyAdmin = this.authMiddleware.verifyRole([Role.ADMIN]);

    this.router.get("/published", this.controller.listPublished);

    this.router.get(
      "/my-company",
      verifyToken,
      verifyAdmin,
      this.controller.listMyCompanyJobs
    );

    this.router.post(
      "/",
      verifyToken,
      verifyAdmin,
      this.controller.create
    );

    this.router.get("/:id", this.controller.getById);

    this.router.patch(
      "/:id",
      verifyToken,
      verifyAdmin,
      this.controller.update
    );

    this.router.delete(
      "/:id",
      verifyToken,
      verifyAdmin,
      this.controller.remove
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}