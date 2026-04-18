import { Request, Response } from "express";
import { CompanyService } from "./company.service.js";
import { ApiError } from "../../utils/api-error.js";
import { CreateCompanyDTO, UpdateCompanyDTO } from "./dto/company.dto.js";

export class CompanyController {
  constructor(private service: CompanyService) {}

  create = async (req: Request, res: Response) => {
    const adminId = res.locals.existingUser.id;
    const body = req.body as CreateCompanyDTO;

    const result = await this.service.create(adminId, body);

    res.status(201).send(result);
  };

  getMyCompany = async (req: Request, res: Response) => {
    const adminId = res.locals.existingUser.id;

    const result = await this.service.getByAdminId(adminId);
    res.status(200).send(result);
  };

  getById = async (req: Request, res: Response) => {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const companyId = parseInt(rawId);

    if (Number.isNaN(companyId)) {
      throw new ApiError("Invalid company id", 400);
    }

    const result = await this.service.getById(companyId);
    res.status(200).send(result);
  };

  updateMyCompany = async (req: Request, res: Response) => {
    const adminId = res.locals.existingUser.id;
    const body = req.body as UpdateCompanyDTO;

    const result = await this.service.updateByAdminId(adminId, body);

    res.status(200).send(result);
  };
}
