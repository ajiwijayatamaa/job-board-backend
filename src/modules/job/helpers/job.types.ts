import type { JobStatus } from "../../../generated/prisma/enums.js";

export type CreateJobBody = {
  title: string;
  description: string;
  banner?: string;
  salary?: number | string;
  city: string;
  deadline: Date | string;
  status?: JobStatus | string;
  preTest?: boolean;
};

export type UpdateJobBody = {
  title?: string;
  description?: string;
  banner?: string | null;
  salary?: number | string | null;
  city?: string;
  deadline?: Date | string;
  status?: JobStatus | string;
  preTest?: boolean;
};

export type ListPublishedJobsQuery = {
  q?: string;
  city?: string;
  take?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: string;
};

export type ListMyCompanyJobsQuery = {
  status?: JobStatus | string;
  take?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: string;
};
