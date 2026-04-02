import { NextFunction, Request, Response, Router } from "express";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";
import { UserController } from "./user.controller.js";

export class UserRouter {
  private router: Router;
  private controller: UserController;
  private authMiddleware: AuthMiddleware;

  constructor(controller?: UserController) {
    this.router = Router();
    this.controller = controller ?? new UserController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const verifyToken = this.authMiddleware.verifyToken(
      process.env.JWT_SECRET as string
    );

    this.router.get(
      "/profile",
      verifyToken,
      (req: Request, res: Response, next: NextFunction) => {
        res.status(200).json({
          message: "Get profile success",
          data: res.locals.existingUser,
        });
      }
    );

    this.router.post(
      "/",
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.create(req, res, next).catch(next);
      }
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
