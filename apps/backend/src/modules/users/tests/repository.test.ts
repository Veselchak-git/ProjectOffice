/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Role } from "@/generated/prisma/client.js";
import type { RefreshToken, User, PrismaClient } from "@/generated/prisma/client.js";

import type { IUserRepository } from "@/modules/users/repository.js";

import { hashPassword } from "@/shared/lib/hash-password/index.js";

import { UserRepository } from "../repository.js";

const mockPrisma = {
  user: { findFirst: vi.fn(), update: vi.fn() },
  refreshToken: { create: vi.fn(), findFirst: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
} as unknown as PrismaClient;

const buildTestRepository = () => {
  return new UserRepository(mockPrisma);
};

describe("UserRepository", () => {
  let repository: IUserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = buildTestRepository();
  });

  describe("findUserRecordByLogin", () => {
    it("calls prisma.user.findFirst with login and deletedAt: null", async () => {
      const login = "student@example.com";
      const mockUser: User = {
        id: 1,
        login,
        role: Role.USER,
        hashPassword: await hashPassword("student123", "test-salt-secret"),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      (mockPrisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const result = await repository.findUserRecordByLogin(login);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { login, deletedAt: null }
      });
    });

    it("returns null when no match", async () => {
      const login = "nonexistent@example.com";

      (mockPrisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await repository.findUserRecordByLogin(login);

      expect(result).toBeNull();
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { login, deletedAt: null }
      });
    });
  });

  describe("findUserById", () => {
    it("calls prisma.user.findFirst with id and deletedAt: null", async () => {
      const id = 1;
      const mockUser: User = {
        id,
        login: "student@example.com",
        role: Role.USER,
        hashPassword: await hashPassword("student123", "test-salt-secret"),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      (mockPrisma.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const result = await repository.findUserById(id);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { id, deletedAt: null }
      });
    });
  });

  describe("updateUserPassword", () => {
    it("calls prisma.user.update with id and new hashPassword", async () => {
      const id = 1;
      const newHashPassword = "newHashPassword123";
      const mockUser: User = {
        id,
        login: "student@example.com",
        role: Role.USER,
        hashPassword: newHashPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      (mockPrisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

      const result = await repository.updateUserPassword(id, newHashPassword);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id },
        data: { hashPassword: newHashPassword }
      });
    });
  });

  describe("createRefreshToken", () => {
    it("calls prisma.refreshToken.create with userId, tokenHash, expiresAt", async () => {
      const userId = 1;
      const tokenHash = "tokenHash123";
      const expiresAt = new Date(Date.now() + 3600000);
      const mockToken: RefreshToken = {
        id: 1,
        userId,
        tokenHash,
        expiresAt,
        createdAt: new Date()
      };

      (mockPrisma.refreshToken.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken);

      const result = await repository.createRefreshToken(userId, tokenHash, expiresAt);

      expect(result).toEqual(mockToken);
      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: { userId, tokenHash, expiresAt }
      });
    });
  });

  describe("findRefreshToken", () => {
    it("calls prisma.refreshToken.findFirst with tokenHash", async () => {
      const tokenHash = "tokenHash123";
      const mockToken: RefreshToken = {
        id: 1,
        userId: 1,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date()
      };

      (mockPrisma.refreshToken.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockToken);

      const result = await repository.findRefreshToken(tokenHash);

      expect(result).toEqual(mockToken);
      expect(mockPrisma.refreshToken.findFirst).toHaveBeenCalledWith({
        where: { tokenHash }
      });
    });

    it("returns null when token not found", async () => {
      const tokenHash = "nonexistentToken";

      (mockPrisma.refreshToken.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await repository.findRefreshToken(tokenHash);

      expect(result).toBeNull();
      expect(mockPrisma.refreshToken.findFirst).toHaveBeenCalledWith({
        where: { tokenHash }
      });
    });
  });

  describe("deleteRefreshToken", () => {
    it("calls prisma.refreshToken.delete with id", async () => {
      const id = 1;

      (mockPrisma.refreshToken.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await repository.deleteRefreshToken(id);

      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id }
      });
    });
  });

  describe("deleteAllUserRefreshTokens", () => {
    it("calls prisma.refreshToken.deleteMany with userId", async () => {
      const userId = 1;

      (mockPrisma.refreshToken.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 2 });

      await repository.deleteAllUserRefreshTokens(userId);

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId }
      });
    });
  });
});