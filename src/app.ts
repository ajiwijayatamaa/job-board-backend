import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { corsOptions } from "./config/cors.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middlewares/error.middleware.js";
import { loggerHttp } from "./lib/logger-http.js";
import { AuthRouter } from "./modules/auth/auth.routes.js";
import { CompanyRouter } from "./modules/company/company.routes.js";
import { JobRouter } from "./modules/job/job.routes.js";
import { UserRouter } from "./modules/user/user.routes.js";

const PORT = 8000;

export class App {
  app: express.Express;

  constructor() {
    this.app = express();
    this.configure();
    this.registerModules();
    this.handleError();
  }

  private configure = () => {
    this.app.use(cors(corsOptions));
    this.app.use(loggerHttp);
    this.app.use(express.json()); // agar bisa menerima req.body
    this.app.use(cookieParser());
  };

  private registerModules = () => {
    // routes
    const authRouter = new AuthRouter();
    const userRouter = new UserRouter();
    const companyRouter = new CompanyRouter();
    const jobRouter = new JobRouter();

    // entry point
    this.app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

    this.app.use("/auth", authRouter.getRouter());
    this.app.use("/users", userRouter.getRouter());
    this.app.use("/companies", companyRouter.getRouter());
    this.app.use("/jobs", jobRouter.getRouter());
  };

  private handleError = () => {
    this.app.use(errorMiddleware);
    this.app.use(notFoundMiddleware);
  };

  start() {
    this.app.listen(PORT, () => {
      console.log(`Server Running On Port : ${PORT}`);
    });
  }
}
