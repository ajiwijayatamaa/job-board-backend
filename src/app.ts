import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { corsOptions } from "./config/cors.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middlewares/error.middleware.js";
import { loggerHttp } from "./lib/logger-http.js";

import { PreSelectionTestService } from "./modules/pre-selection-test/pre-selection-test.service.js";
import { PreSelectionTestController } from "./modules/pre-selection-test/pre-selection-test.controller.js";
import { PreSelectionTestRouter } from "./modules/pre-selection-test/pre-selection-test.router.js";
import { AuthRouter } from "./modules/auth/auth.routes.js";
import { CompanyRouter } from "./modules/company/company.routes.js";
import { JobRouter } from "./modules/job/job.routes.js";
import { UserRouter } from "./modules/user/user.routes.js";
import { ValidationMiddleware } from "./middlewares/validation.middleware.js";
import { AuthMiddleware } from "./middlewares/auth.middleware.js";
import { prisma } from "./lib/prisma.js";
import { UploadMiddleware } from "./middlewares/upload.middleware.js";

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
    // shared dependency
    const prismaClient = prisma;

    // services
    const preSelectionTestService = new PreSelectionTestService(prismaClient);

    // controllers
    const preSelectionTestController = new PreSelectionTestController(
      preSelectionTestService,
    );

    //middlewares
    const authMiddleware = new AuthMiddleware();
    const validationMiddleware = new ValidationMiddleware();
    const uploadMiddleware = new UploadMiddleware();

    // routes
    const preSelectionTestRouter = new PreSelectionTestRouter(
      preSelectionTestController,
      authMiddleware,
      validationMiddleware,
    );

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
    // entry point preselestion test
    this.app.use("/pre-selection-tests", preSelectionTestRouter.getRouter());
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
