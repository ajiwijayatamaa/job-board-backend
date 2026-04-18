import { PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { UpdateProfileDTO } from "../user/dto/user.dto.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";

export class UserService {
  constructor(
    private prisma: PrismaClient,
    private cloudinaryService: CloudinaryService,
  ) {}

  getProfile = async (id: number) => {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        profilePhoto: true,
        phoneNumber: true,
        gender: true,
        address: true,
      },
    });

    if (!user) {
      throw new ApiError("User tidak ditemukan", 404);
    }

    return {
      message: "Berhasil mengambil profil",
      data: user,
    };
  };

  updateProfile = async (
    id: number,
    body: UpdateProfileDTO,
    file?: Express.Multer.File,
  ) => {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError("User tidak ditemukan", 404);

    let profilePhoto = user.profilePhoto;

    if (file) {
      if (profilePhoto) {
        await this.cloudinaryService.deleteByUrl(profilePhoto);
      }
      const uploaded = await this.cloudinaryService.uploadImage(file, "profile-photos");
      profilePhoto = uploaded.url;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...body,
        profilePhoto,
      },
    });

    return {
      message: "Berhasil memperbarui profil",
      data: updatedUser,
    };
  };
}