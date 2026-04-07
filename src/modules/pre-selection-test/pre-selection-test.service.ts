import { PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import {
  CreatePreSelectionTestDTO,
  UpdatePreSelectionTestDTO,
  SubmitTestDTO,
} from "./dto/pre-selection-test.dto.js";

export class PreSelectionTestService {
  constructor(private prisma: PrismaClient) {}

  private mapQuestions = (questions: any[]) => {
    return questions.map((q) => ({
      questionText: q.questionText,
      correctAnswer: q.correctAnswer,
      options: {
        create: q.options.map((o: any) => ({
          optionText: o.optionText,
          isCorrect: o.isCorrect,
        })),
      },
    }));
  };

  createTest = async (body: CreatePreSelectionTestDTO, adminId: number) => {
    const job = await this.prisma.job.findFirst({
      where: { id: body.jobId, company: { adminId } },
    });
    if (!job)
      throw new ApiError("Job tidak ditemukan atau bukan milik Anda", 404);
    if (body.questions.length !== 25)
      throw new ApiError("Wajib memiliki 25 soal", 400);

    return await this.prisma.$transaction(async (tx) => {
      const isExist = await tx.preSelectionTest.findUnique({
        where: { jobId: body.jobId },
      });
      if (isExist)
        throw new ApiError("Job ini sudah memiliki pre selection test", 400);

      const test = await tx.preSelectionTest.create({
        data: {
          jobId: body.jobId,
          title: body.title,
          questions: { create: this.mapQuestions(body.questions) },
        },
        include: { questions: { include: { options: true } } },
      });
      await tx.job.update({
        where: { id: body.jobId },
        data: { preTest: true },
      });
      return test;
    });
  };

  getTestByJobId = async (jobId: number, adminId: number) => {
    const test = await this.prisma.preSelectionTest.findFirst({
      where: { jobId, job: { company: { adminId } } },
      include: { questions: { include: { options: true } } },
    });
    if (!test) throw new ApiError("Pre selection test tidak ditemukan", 404);
    return test;
  };

  updateTest = async (
    id: number,
    body: UpdatePreSelectionTestDTO,
    adminId: number,
  ) => {
    const test = await this.prisma.preSelectionTest.findFirst({
      where: { id, job: { company: { adminId } } },
    });
    if (!test)
      throw new ApiError("Test tidak ditemukan atau bukan milik Anda", 404);
    if (body.questions && body.questions.length !== 25)
      throw new ApiError("Soal harus berjumlah tepat 25", 400);

    return await this.prisma.$transaction(async (tx) => {
      await tx.testQuestion.deleteMany({ where: { testId: id } });
      return await tx.preSelectionTest.update({
        where: { id },
        data: {
          title: body.title,
          questions: { create: this.mapQuestions(body.questions!) },
        },
        include: { questions: { include: { options: true } } },
      });
    });
  };

  deleteTest = async (id: number, adminId: number) => {
    const test = await this.prisma.preSelectionTest.findFirst({
      where: { id, job: { company: { adminId } } },
    });
    if (!test)
      throw new ApiError("Test tidak ditemukan atau bukan milik Anda", 404);

    return await this.prisma.$transaction(async (tx) => {
      await tx.job.update({
        where: { id: test.jobId },
        data: { preTest: false },
      });
      return await tx.preSelectionTest.delete({ where: { id } });
    });
  };

  // Ambil soal untuk dikerjakan user (tanpa correctAnswer)
  takeTest = async (jobId: number, userId: number) => {
    const test = await this.prisma.preSelectionTest.findFirst({
      where: { jobId },
      include: {
        questions: {
          select: {
            id: true,
            questionText: true,
            // correctAnswer sengaja tidak di-select
            options: {
              select: {
                id: true,
                optionText: true,
                // isCorrect sengaja tidak di-select
              },
            },
          },
        },
      },
    });
    if (!test) throw new ApiError("Pre selection test tidak ditemukan", 404);

    // Cek apakah user sudah pernah melamar dan punya hasil tes untuk job ini
    const existingResult = await this.prisma.testResult.findFirst({
      where: {
        preSelectionTestId: test.id,
        application: { userId: userId },
      },
    });

    if (existingResult)
      throw new ApiError("Anda sudah mengerjakan tes untuk lowongan ini", 400);

    return test;
  };

  // Pastikan SubmitTestDTO di file .dto.ts sudah menyertakan jobId dan cvId
  submitTest = async (body: any, userId: number) => {
    const { jobId, cvId, answers, expectedSalary } = body;

    // 1. Ambil data tes berdasarkan JobId
    const test = await this.prisma.preSelectionTest.findFirst({
      where: { jobId },
      include: { questions: true },
    });

    if (!test) throw new ApiError("Pre selection test tidak ditemukan", 404);

    // 2. Cek apakah user sudah pernah punya TestResult untuk job ini
    const existingResult = await this.prisma.testResult.findFirst({
      where: {
        preSelectionTestId: test.id,
        application: { userId },
      },
    });

    if (existingResult)
      throw new ApiError("Anda sudah mengerjakan tes ini", 400);

    // 3. Hitung skor
    let correctCount = 0;
    for (const answer of answers) {
      const question = test.questions.find((q) => q.id === answer.questionId);
      if (question && question.correctAnswer === answer.selectedAnswer) {
        correctCount++;
      }
    }

    // Gunakan total soal yang ada di DB, jangan hardcode 25 agar lebih fleksibel
    const totalQuestions = test.questions.length;
    const score = (correctCount / totalQuestions) * 100;

    // 4. TRANSACTION: Buat Application dan TestResult sekaligus
    return await this.prisma.$transaction(async (tx) => {
      // Buat data lamaran (Application)
      const newApplication = await tx.application.create({
        data: {
          userId,
          jobId,
          cvId,
          expectedSalary,
          status: "PENDING", // Lamaran masuk dengan status pending
        },
      });

      // Buat data hasil tes (TestResult) yang terhubung ke application tadi
      return await tx.testResult.create({
        data: {
          preSelectionTestId: test.id,
          applicationId: newApplication.id,
          score,
        },
        include: {
          application: true, // Sertakan data lamaran di return value
        },
      });
    });
  };

  // Admin melihat semua hasil tes pelamar
  getTestResults = async (testId: number, adminId: number) => {
    const test = await this.prisma.preSelectionTest.findFirst({
      where: { id: testId, job: { company: { adminId } } },
    });
    if (!test)
      throw new ApiError("Test tidak ditemukan atau bukan milik Anda", 404);

    return await this.prisma.testResult.findMany({
      where: { preSelectionTestId: testId },
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
      orderBy: { score: "desc" }, // urutkan dari skor tertinggi
    });
  };
}
