import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { corsOptions } from "./config/cors.js";
import { loggerHttp } from "./lib/logger-http.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middlewares/error.middleware.js";

import { prisma } from "./lib/prisma.js";
import { AuthMiddleware } from "./middlewares/auth.middleware.js";
import { UploadMiddleware } from "./middlewares/upload.middleware.js";
import { ValidationMiddleware } from "./middlewares/validation.middleware.js";
import { CloudinaryService } from "./modules/cloudinary/cloudinary.service.js";
import { JobService } from "./modules/job/job.service.js";
import { JobController } from "./modules/job/job.controller.js";
import { JobRouter } from "./modules/job/job.router.js";
import { ApplicantService } from "./modules/application/application.service.js";
import { ApplicantController } from "./modules/application/application.controller.js";
import { ApplicantRouter } from "./modules/application/application.router.js";
import { AuthRouter } from "./modules/auth/auth.routes.js";
import { CompanyRouter } from "./modules/company/company.routes.js";
import { CVRouter } from "./modules/cv/cv.router.js";
import { PreSelectionTestController } from "./modules/pre-selection-test/pre-selection-test.controller.js";
import { PreSelectionTestRouter } from "./modules/pre-selection-test/pre-selection-test.router.js";
import { PreSelectionTestService } from "./modules/pre-selection-test/pre-selection-test.service.js";
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
    // shared dependency
    const prismaClient = prisma;

    // services
    const preSelectionTestService = new PreSelectionTestService(prismaClient);
    const cloudinaryService = new CloudinaryService();
    const jobService = new JobService(prismaClient, cloudinaryService);
    const applicantService = new ApplicantService(prismaClient);

    // controllers
    const preSelectionTestController = new PreSelectionTestController(
      preSelectionTestService,
    );
    const jobController = new JobController(jobService);
    const applicantController = new ApplicantController(applicantService);

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
    const jobRouter = new JobRouter(
      jobController,
      authMiddleware,
      uploadMiddleware,
      validationMiddleware,
    );
    const applicationsRouter = new ApplicantRouter(
      applicantController,
      authMiddleware,
      validationMiddleware,
    );

    const authRouter = new AuthRouter();
    const userRouter = new UserRouter();
    const companyRouter = new CompanyRouter();

    const cvRouter = new CVRouter();

    // entry point — USER (Feature 1)
    this.app.use("/auth", authRouter.getRouter());
    this.app.use("/users", userRouter.getRouter());
    this.app.use("/companies", companyRouter.getRouter());
    this.app.use("/cvs", cvRouter.getRouter());

    // entry point — SHARED (berdua)
    this.app.use("/pre-selection-tests", preSelectionTestRouter.getRouter());

    // entry point — ADMIN (Feature 2)
    this.app.use("/admin/applicants", applicationsRouter.getRouter());
    this.app.use(
      "/admin/pre-selection-tests",
      preSelectionTestRouter.getRouter(),
    );
    this.app.use("/admin/jobs", jobRouter.getRouter());
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
