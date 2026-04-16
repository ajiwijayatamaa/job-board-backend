import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { MailService } from "../modules/mail/mail.service.js";

export const interviewReminderScheduler = () => {
  const mailService = new MailService();

  // Jalankan setiap hari jam 07:00 pagi
  // Format cron: "menit jam hari bulan hari-dalam-seminggu"
  // "0 7 * * *" = jam 07:00 setiap hari
  cron.schedule("0 7 * * *", async () => {
    console.log("[CRON] Checking interview reminders for tomorrow...");

    const now = new Date();

    // hitung rentang waktu "besok" (H-1 dari setiap interview)
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(now.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(now);
    tomorrowEnd.setDate(now.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // ambil semua interview yang:
    // 1. jadwalnya besok (H-1)
    // 2. reminderSent masih false (belum pernah dikirim)
    const interviews = await prisma.interview.findMany({
      where: {
        reminderSent: false,
        interviewDate: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
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
                  select: {
                    companyName: true,
                    // ambil data admin untuk kirim reminder ke admin juga
                    admin: {
                      select: { fullName: true, email: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(
      `[CRON] Found ${interviews.length} interview(s) with pending reminders`,
    );

    for (const interview of interviews) {
      const { application } = interview;
      const { user, job } = application;
      const { company } = job;

      // format tanggal dan waktu ke bahasa Indonesia
      const interviewDate = interview.interviewDate.toLocaleDateString(
        "id-ID",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      );

      const interviewTime = interview.interviewDate.toLocaleTimeString(
        "id-ID",
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      );

      const locationLink =
        interview.locationLink ?? "Akan diinformasikan lebih lanjut";

      // === kirim email reminder ke PELAMAR ===
      await mailService.sendEmail(
        user.email,
        `Pengingat Interview Besok - ${job.title}`,
        "interview-reminder",
        {
          recipientName: user.fullName,
          jobTitle: job.title,
          companyName: company.companyName,
          interviewDate,
          interviewTime,
          locationLink,
          isAdmin: false,
        },
      );

      // === kirim email reminder ke ADMIN (perwakilan perusahaan) ===
      await mailService.sendEmail(
        company.admin.email,
        `Pengingat Interview Besok - ${job.title}`,
        "interview-reminder",
        {
          recipientName: company.admin.fullName ?? "Admin",
          applicantName: user.fullName,
          jobTitle: job.title,
          companyName: company.companyName,
          interviewDate,
          interviewTime,
          locationLink,
          isAdmin: true,
        },
      );

      // tandai reminderSent = true agar tidak terkirim dua kali
      await prisma.interview.update({
        where: { id: interview.id },
        data: { reminderSent: true },
      });

      console.log(
        `[CRON] Reminder sent for interview ID ${interview.id} (applicant: ${user.email}, admin: ${company.admin.email})`,
      );
    }

    console.log("[CRON] Interview reminder check completed.");
  });
};
