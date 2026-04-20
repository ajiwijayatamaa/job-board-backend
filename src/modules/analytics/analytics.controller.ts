import { plainToInstance } from "class-transformer";
import { Request, Response } from "express";
import { AnalyticsService } from "./analytics.service.js";
import { GetAnalyticsDTO } from "./dto/analytics.dto.js";

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  getOverview = async (req: Request, res: Response) => {
    const adminId = res.locals.existingUser.id;
    const result = await this.analyticsService.getOverview(adminId);
    res.status(200).send(result);
  };

  getDemographics = async (req: Request, res: Response) => {
    const adminId = res.locals.existingUser.id;
    const query = plainToInstance(GetAnalyticsDTO, req.query);
    const result = await this.analyticsService.getDemographics(adminId, query);
    res.status(200).send(result);
  };

  getSalaryTrends = async (req: Request, res: Response) => {
    const adminId = res.locals.existingUser.id;
    const query = plainToInstance(GetAnalyticsDTO, req.query);
    const result = await this.analyticsService.getSalaryTrends(adminId, query);
    res.status(200).send(result);
  };

  getApplicantInterests = async (req: Request, res: Response) => {
    const adminId = res.locals.existingUser.id;
    const query = plainToInstance(GetAnalyticsDTO, req.query);
    const result = await this.analyticsService.getApplicantInterests(
      adminId,
      query,
    );
    res.status(200).send(result);
  };
}
