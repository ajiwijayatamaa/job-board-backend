import { NextFunction, Request, Response, Router } from "express";
import { Role } from "../../generated/prisma/enums.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { ApplicationController} from "../../modules/application/application.controller.js";

export class ApplicationRouter {
  private router: Router;
  private controller: ApplicationController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.controller = new ApplicationController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const verifyToken = this.authMiddleware.verifyToken(
      process.env.JWT_SECRET as string
    );

    // user routes
    this.router.post(
      "/",
      verifyToken,
      this.authMiddleware.verifyRole([Role.USER]),
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.apply(req, res, next).catch(next);
      }
    );

    this.router.get(
      "/me",
      verifyToken,
      this.authMiddleware.verifyRole([Role.USER]),
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.getMyApplications(req, res, next).catch(next);
      }
    );

    // shared (authenticated) routes
    this.router.get(
      "/:id",
      verifyToken,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.getById(req, res, next).catch(next);
      }
    );

    // admin routes
    this.router.get(
      "/job/:jobId",
      verifyToken,
      this.authMiddleware.verifyRole([Role.ADMIN]),
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.getApplicantsByJob(req, res, next).catch(next);
      }
    );

    this.router.patch(
      "/:id/status",
      verifyToken,
      this.authMiddleware.verifyRole([Role.ADMIN]),
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.updateStatus(req, res, next).catch(next);
      }
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
