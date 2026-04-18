import crypto from "crypto";
import { Role } from "../../../generated/prisma/enums.js";
import { ApiError } from "../../../utils/api-error.js";

export const AuthHelper = {
  generateRandomToken: () => crypto.randomBytes(32).toString("hex"),
  
  getExpiryDate: (hours: number = 1) => new Date(Date.now() + hours * 3600000),

  normalizeRole: (role?: string | Role): Role => {
    if (!role) return Role.USER;
    const normalized = typeof role === "string" ? role.toUpperCase() : role;
    if (normalized === Role.USER || normalized === Role.ADMIN) return normalized as Role;
    throw new ApiError("Invalid role. Use USER or ADMIN", 400);
  },

  mapUserResponse: (user: any, token?: string) => ({
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    ...(user.company && {
      company: {
        id: user.company.id,
        name: user.company.companyName,
        phone: user.company.phone,
      },
    }),
    ...(token && { token }),
  }),
};