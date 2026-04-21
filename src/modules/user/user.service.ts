import { Role, Gender } from "../../generated/prisma/enums.js";
import { PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { UpdateProfileDTO } from "../user/dto/user.dto.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";

export class UserService {
  constructor(private prisma: PrismaClient) {}

  private cloudinary = new CloudinaryService();

  private readonly userSelect = {
    id: true,
    email: true,
    fullName: true,
    role: true,
    profilePhoto: true,
    isVerified: true,
    dateOfBirth: true,
    education: true,
    address: true,
    city: true,
    company: {
      select: {
        companyName: true,
        phone: true,
        address: true,
        latitude: true,
        longitude: true,
        description: true,
      },
    },
  };

  getProfile = async (id: number) => {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (!user) {
      throw new ApiError("User tidak ditemukan", 404);
    }

    return {
      message: "Berhasil mengambil profil",
      data: user,
    };
  };

  updateProfile = async (id: number, body: UpdateProfileDTO) => {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError("User tidak ditemukan", 404);

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          fullName: body.fullName ?? undefined,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
          gender: body.gender ? (body.gender.toUpperCase() as Gender) : undefined,
          education: body.education ?? undefined,
          city: body.city ?? undefined,
          address: body.address ?? undefined,
        },
        select: this.userSelect,
      });

      if (user.role === Role.ADMIN) {
        await tx.company.update({
          where: { adminId: id },
          data: {
            companyName: body.companyName ?? undefined,
            phone: body.phone ?? undefined,
            description: body.description ?? undefined,
            address: body.companyAddress ?? undefined,
            latitude: body.latitude ?? undefined,
            longitude: body.longitude ?? undefined,
          },
        });
      }

      // Return fresh data including potential company updates
      return await tx.user.findUnique({
        where: { id },
        select: this.userSelect,
      });
    });

    return {
      message: "Berhasil memperbarui profil",
      data: updatedUser,
    };
  };

  updateProfilePicture = async (id: number, file?: Express.Multer.File) => {
    if (!file) {
      throw new ApiError("File foto profil wajib diunggah", 400);
    }

    // Mencari data user untuk mendapatkan URL foto lama
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { profilePhoto: true }
    });

    if (!user) throw new ApiError("User tidak ditemukan", 404);

    // Catatan: Anda bisa menambahkan logika penghapusan di Cloudinary 
    // menggunakan public_id jika diperlukan di sini.

    const { url } = await this.cloudinary.uploadImage(
      file,
      "profile_pictures",
      `profile-${id}-${Date.now()}`
    );

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { profilePhoto: url },
      select: this.userSelect,
    });

    return {
      message: "Berhasil memperbarui foto profil",
      data: updatedUser,
    };
  };
}