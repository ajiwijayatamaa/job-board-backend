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
import { MailService } from "./modules/mail/mail.service.js";
import { JobService } from "./modules/job/job.service.js";
import { JobController } from "./modules/job/job.controller.js";
import { JobRouter } from "./modules/job/job.router.js";
import { ApplicantService } from "./modules/application/application.service.js";
import { ApplicantUserService } from "./modules/application/applicant-user.service.js";
import { ApplicantController } from "./modules/application/application.controller.js";
import { ApplicantRouter } from "./modules/application/application.router.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { AuthRouter } from "./modules/auth/auth.router.js";
import { CompanyService } from "./modules/company/company.service.js";
import { CompanyController } from "./modules/company/company.controller.js";
import { CompanyRouter } from "./modules/company/company.router.js";
import { CVService } from "./modules/cv/cv.service.js";
import { CVController } from "./modules/cv/cv.controller.js";
import { CVRouter } from "./modules/cv/cv.router.js";
import { PreSelectionTestController } from "./modules/pre-selection-test/pre-selection-test.controller.js";
import { PreSelectionTestRouter } from "./modules/pre-selection-test/pre-selection-test.router.js";
import { PreSelectionTestService } from "./modules/pre-selection-test/pre-selection-test.service.js";
import { UserService } from "./modules/user/user.service.js";
import { UserController } from "./modules/user/user.controller.js";
import { UserRouter } from "./modules/user/user.router.js";
import { InterviewService } from "./modules/interview/interview.service.js";
import { InterviewController } from "./modules/interview/interview.controller.js";
import { InterviewRouter } from "./modules/interview/interview.router.js";
import { initScheduler } from "./scripts/index.js";
import { JobPublicService } from "./modules/job/job-public.service.js";

const PORT = 8000;

export class App {
  app: express.Express;

  constructor() {
    this.app = express();
    this.configure();
    this.registerModules();
    this.handleError();
    initScheduler(); // jalankan semua cron job saat server start
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
    const mailService = new MailService();
    const preSelectionTestService = new PreSelectionTestService(prismaClient);
    const cloudinaryService = new CloudinaryService();
    const jobService = new JobService(prismaClient, cloudinaryService);
    const jobPublicService = new JobPublicService(prismaClient);
    const authService = new AuthService(prismaClient, mailService);
    const userService = new UserService(prismaClient, cloudinaryService);
    const companyService = new CompanyService(prismaClient);
    const cvService = new CVService(prismaClient, cloudinaryService);
    const applicantService = new ApplicantService(prismaClient);
    const applicantUserService = new ApplicantUserService(prismaClient);
    const interviewService = new InterviewService(prismaClient, mailService);

    // controllers
    const preSelectionTestController = new PreSelectionTestController(
      preSelectionTestService,
    );
    const authController = new AuthController(authService);
    const userController = new UserController(userService);
    const companyController = new CompanyController(companyService);
    const cvController = new CVController(cvService);
    const jobController = new JobController(jobService, jobPublicService);
    const applicantController = new ApplicantController(
      applicantService,
      applicantUserService,
    );
    const interviewController = new InterviewController(interviewService);

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
    const authRouter = new AuthRouter(
      authController,
      authMiddleware,
      validationMiddleware,
    );
    const userRouter = new UserRouter(
      userController,
      authMiddleware,
      validationMiddleware,
      uploadMiddleware,
    );
    const companyRouter = new CompanyRouter(
      companyController,
      authMiddleware,
      validationMiddleware,
    );
    const cvRouter = new CVRouter(
      cvController,
      authMiddleware,
      uploadMiddleware,
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
    const interviewRouter = new InterviewRouter(
      interviewController,
      authMiddleware,
      validationMiddleware,
    );

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
    this.app.use("/admin/interviews", interviewRouter.getRouter());
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
