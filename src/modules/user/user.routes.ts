import { Request, Response, Router } from "express";
import { UserController } from "./user.controller.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";

export class UserRouter {
  private router: Router;
  private authMiddleware: AuthMiddleware;

  constructor(private controller: UserController) {
    this.router = Router();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Create user (public)
    this.router.post("/", this.controller.create);

    // Contoh route protected
    this.router.get("/profile", this.authMiddleware.verifyToken, (req: Request, res: Response) => {
      res.json({ message: "Protected route success" });
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}