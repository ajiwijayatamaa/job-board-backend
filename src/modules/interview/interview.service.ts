import { PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { MailService } from "../mail/mail.service.js";
import { CreateInterviewDTO, UpdateInterviewDTO } from "./dto/interview.dto.js";

export class InterviewService {
  constructor(
    private prisma: PrismaClient,
    private mailService: MailService,
  ) {}

  // ========================= ADMIN - INTERVIEW SCHEDULING (START) =========================

  createInterview = async (body: CreateInterviewDTO, adminId: number) => {
    const { applicationId, interviewDate, locationLink } = body;

    // pastikan application ada dan milik perusahaan admin yang login
    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        job: { company: { adminId } },
      },
      include: {
        user: {
          select: { fullName: true, email: true },
        },
        job: {
          select: {
            title: true,
            company: {
              select: { companyName: true },
            },
          },
        },
      },
    });

    if (!application) throw new ApiError("Data pelamar tidak ditemukan", 404);

    // hanya pelamar dengan status INTERVIEW yang boleh dijadwalkan
    if (application.status !== "INTERVIEW") {
      throw new ApiError(
        "Hanya pelamar dengan status INTERVIEW yang dapat dijadwalkan wawancara",
        400,
      );
    }

    // pastikan pelamar belum memiliki jadwal interview sebelumnya
    const existingInterview = await this.prisma.interview.findUnique({
      where: { applicationId },
    });

    if (existingInterview) {
      throw new ApiError(
        "Pelamar ini sudah memiliki jadwal interview. Gunakan fitur update untuk mengubahnya",
        400,
      );
    }

    // validasi tanggal interview tidak boleh di masa lalu
    const scheduledDate = new Date(interviewDate);
    if (scheduledDate <= new Date()) {
      throw new ApiError("Tanggal interview tidak boleh di masa lalu", 400);
    }

    const interview = await this.prisma.interview.create({
      data: {
        applicationId,
        interviewDate: scheduledDate,
        locationLink: locationLink ?? null,
      },
    });

    // kirim email notifikasi jadwal ke pelamar
    await this.mailService.sendEmail(
      application.user.email,
      `Undangan Interview - ${application.job.title}`,
      "interview-schedule",
      {
        applicantName: application.user.fullName,
        jobTitle: application.job.title,
        companyName: application.job.company.companyName,
        interviewDate: scheduledDate.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        interviewTime: scheduledDate.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        locationLink: locationLink ?? "Akan diinformasikan lebih lanjut",
        isUpdate: false,
      },
    );

    return {
      message:
        "Jadwal interview berhasil dibuat dan email notifikasi telah dikirim ke pelamar",
      data: interview,
    };
  };

  getInterviewsByJob = async (jobId: number, adminId: number) => {
    // pastikan job milik perusahaan admin yang login
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, company: { adminId } },
    });

    if (!job) throw new ApiError("Lowongan tidak ditemukan", 404);

    const interviews = await this.prisma.interview.findMany({
      where: {
        application: { jobId },
      },
      include: {
        application: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
      // tampilkan yang paling dekat waktunya lebih dulu
      orderBy: { interviewDate: "asc" },
    });

    return { data: interviews };
  };

  getInterviewById = async (id: number, adminId: number) => {
    const interview = await this.prisma.interview.findFirst({
      where: {
        id,
        application: { job: { company: { adminId } } },
      },
      include: {
        application: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                profilePhoto: true,
                dateOfBirth: true,
                gender: true,
                education: true,
                city: true,
              },
            },
            job: {
              select: {
                id: true,
                title: true,
                category: true,
                city: true,
              },
            },
          },
        },
      },
    });

    if (!interview) throw new ApiError("Jadwal interview tidak ditemukan", 404);

    return interview;
  };

  updateInterview = async (
    id: number,
    body: UpdateInterviewDTO,
    adminId: number,
  ) => {
    // cek interview ada dan milik perusahaan admin yang login
    const interview = await this.prisma.interview.findFirst({
      where: {
        id,
        application: { job: { company: { adminId } } },
      },
      include: {
        application: {
          include: {
            user: {
              select: { fullName: true, email: true },
            },
            job: {
              select: {
                title: true,
                company: {
                  select: { companyName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!interview) throw new ApiError("Jadwal interview tidak ditemukan", 404);

    // validasi tanggal baru tidak boleh di masa lalu (jika diubah)
    if (body.interviewDate) {
      const newDate = new Date(body.interviewDate);
      if (newDate <= new Date()) {
        throw new ApiError("Tanggal interview tidak boleh di masa lalu", 400);
      }
    }

    const updatedInterview = await this.prisma.interview.update({
      where: { id },
      data: {
        ...(body.interviewDate && {
          interviewDate: new Date(body.interviewDate),
          // reset reminderSent agar pengingat H-1 terkirim ulang untuk tanggal baru
          reminderSent: false,
        }),
        ...(body.locationLink !== undefined && {
          locationLink: body.locationLink,
        }),
      },
    });

    // kirim email notifikasi perubahan jadwal ke pelamar (hanya jika tanggal berubah)
    if (body.interviewDate) {
      const newDate = new Date(body.interviewDate);

      await this.mailService.sendEmail(
        interview.application.user.email,
        `Perubahan Jadwal Interview - ${interview.application.job.title}`,
        "interview-schedule",
        {
          applicantName: interview.application.user.fullName,
          jobTitle: interview.application.job.title,
          companyName: interview.application.job.company.companyName,
          interviewDate: newDate.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          interviewTime: newDate.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          locationLink:
            body.locationLink ??
            interview.locationLink ??
            "Akan diinformasikan lebih lanjut",
          isUpdate: true,
        },
      );
    }

    return {
      message: "Jadwal interview berhasil diperbarui",
      data: updatedInterview,
    };
  };

  deleteInterview = async (id: number, adminId: number) => {
    const interview = await this.prisma.interview.findFirst({
      where: {
        id,
        application: { job: { company: { adminId } } },
      },
    });

    if (!interview) throw new ApiError("Jadwal interview tidak ditemukan", 404);

    await this.prisma.interview.delete({ where: { id } });

    return { message: "Jadwal interview berhasil dihapus" };
  };
  // ========================= ADMIN - INTERVIEW SCHEDULING (END) =========================
}
