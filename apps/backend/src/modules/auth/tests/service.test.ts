/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { Role } from "@/generated/prisma/client.js";

import { AppError, HTTP_STATUS } from "@/shared/lib/errors/index.js";
import { hashPassword, verifyPassword } from "@/shared/lib/hash-password/index.js";
import { generateRefreshToken, hashRefreshToken } from "@/shared/lib/refresh-token/index.js";

import { loginService, getCurrentUserService, refreshService, logoutService, changePasswordService } from "../service.js";

const SALT_SECRET = "test-salt-secret";
const JWT_ACCESS_SECRET = "test-jwt-access-secret";
const JWT_ACCESS_TTL = "15m";
const REFRESH_TOKEN_SECRET = "test-refresh-token-secret";
const REFRESH_TOKEN_TTL = "7d";
const NODE_ENV = "test";

const buildMockRequest = (overrides: Partial<any> = {}): any => {
  const defaultRequest = {
    user: { sub: "1", login: "test@test.com", role: Role.USER },
    body: { login: "test@test.com", password: "test123" },
    server: {
      config: {
        SALT_SECRET,
        JWT_ACCESS_SECRET,
        JWT_ACCESS_TTL,
        REFRESH_TOKEN_SECRET,
        REFRESH_TOKEN_TTL,
        NODE_ENV
      },
      jwt: {
        sign: vi.fn().mockResolvedValue("test-access-token")
      },
      userRepository: {
        findUserRecordByLogin: vi.fn(),
        findUserById: vi.fn(),
        findRefreshToken: vi.fn(),
        createRefreshToken: vi.fn(),
        deleteRefreshToken: vi.fn(),
        deleteAllUserRefreshTokens: vi.fn(),
        updateUserPassword: vi.fn()
      }
    },
    cookies: {},
    ...overrides
  };

  return defaultRequest;
};

const buildMockReply = (overrides: Partial<any> = {}): any => {
  const defaultReply = {
    setCookie: vi.fn()
  };

  return { ...defaultReply, ...overrides };
};

describe("auth service", () => {
  describe("loginService", () => {
    it("returns accessToken for valid credentials", async () => {
      const request = buildMockRequest({
        body: { login: "test@test.com", password: "test123" }
      });

      const userRecord = {
        id: 1,
        login: "test@test.com",
        role: Role.USER,
        hashPassword: await hashPassword("test123", SALT_SECRET),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      request.server.userRepository.findUserRecordByLogin.mockResolvedValue(userRecord);
      request.server.userRepository.deleteAllUserRefreshTokens.mockResolvedValue(undefined);
      request.server.userRepository.createRefreshToken.mockResolvedValue({ id: 1, userId: 1, tokenHash: "hash", expiresAt: new Date() });

      const reply = buildMockReply();

      const result = await loginService(request, reply);

      expect(request.server.userRepository.findUserRecordByLogin).toHaveBeenCalledWith("test@test.com");
      expect(request.server.userRepository.deleteAllUserRefreshTokens).toHaveBeenCalledWith(1);
      expect(request.server.userRepository.createRefreshToken).toHaveBeenCalled();
      expect(reply.setCookie).toHaveBeenCalled();
      expect(result.accessToken).toBe("test-access-token");
      expect(result.user.login).toBe("test@test.com");
    });

    it("throws 401 for unknown email", async () => {
      const request = buildMockRequest();
      request.server.userRepository.findUserRecordByLogin.mockResolvedValue(null);

      const reply = buildMockReply();

      await expect(loginService(request, reply)).rejects.toThrow(
        new AppError(HTTP_STATUS.UNAUTHORIZED, "Invalid credentials", "AUTH_INVALID_CREDENTIALS")
      );
    });

    it("throws 401 for invalid password", async () => {
      const request = buildMockRequest();

      const userRecord = {
        id: 1,
        login: "test@test.com",
        role: Role.USER,
        hashPassword: await hashPassword("different123", SALT_SECRET),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      request.server.userRepository.findUserRecordByLogin.mockResolvedValue(userRecord);

      const reply = buildMockReply();

      await expect(loginService(request, reply)).rejects.toThrow(
        new AppError(HTTP_STATUS.UNAUTHORIZED, "Invalid credentials", "AUTH_INVALID_CREDENTIALS")
      );
    });
  });

  describe("getCurrentUserService", () => {
    it("returns current user", async () => {
      const request = buildMockRequest();

      const result = await getCurrentUserService(request);

      expect(result.user.id).toBe("1");
      expect(result.user.login).toBe("test@test.com");
      expect(result.user.role).toBe(Role.USER);
    });
  });

  describe("refreshService", () => {
    it("returns new access token for valid refresh cookie", async () => {
      const request = buildMockRequest({
        cookies: { refreshToken: "valid-refresh-token" }
      });

      const storedToken = {
        id: 1,
        userId: 1,
        tokenHash: hashRefreshToken("valid-refresh-token"),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        createdAt: new Date()
      };

      const userRecord = {
        id: 1,
        login: "test@test.com",
        role: Role.USER,
        hashPassword: await hashPassword("test123", SALT_SECRET),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      request.server.userRepository.findRefreshToken.mockResolvedValue(storedToken);
      request.server.userRepository.deleteRefreshToken.mockResolvedValue(undefined);
      request.server.userRepository.createRefreshToken.mockResolvedValue({ id: 2, userId: 1, tokenHash: "new-hash", expiresAt: new Date() });
      request.server.userRepository.findUserById.mockResolvedValue(userRecord);

      const reply = buildMockReply();

      const result = await refreshService(request, reply);

      expect(request.server.userRepository.findRefreshToken).toHaveBeenCalled();
      expect(request.server.userRepository.deleteRefreshToken).toHaveBeenCalled();
      expect(request.server.userRepository.createRefreshToken).toHaveBeenCalled();
      expect(reply.setCookie).toHaveBeenCalled();
      expect(result.accessToken).toBe("test-access-token");
    });

    it("throws 401 without refresh cookie", async () => {
      const request = buildMockRequest({
        cookies: {}
      });

      const reply = buildMockReply();

      await expect(refreshService(request, reply)).rejects.toThrow(
        new AppError(HTTP_STATUS.UNAUTHORIZED, "No refresh token provided", "AUTH_NO_REFRESH_TOKEN")
      );
    });

    it("throws 401 for invalid refresh token", async () => {
      const request = buildMockRequest({
        cookies: { refreshToken: "invalid-token" }
      });

      request.server.userRepository.findRefreshToken.mockResolvedValue(null);

      const reply = buildMockReply();

      await expect(refreshService(request, reply)).rejects.toThrow(
        new AppError(HTTP_STATUS.UNAUTHORIZED, "Invalid refresh token", "AUTH_INVALID_REFRESH_TOKEN")
      );
    });

    it("throws 401 for expired refresh token", async () => {
      const request = buildMockRequest({
        cookies: { refreshToken: "expired-token" }
      });

      const storedToken = {
        id: 1,
        userId: 1,
        tokenHash: hashRefreshToken("expired-token"),
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date()
      };

      request.server.userRepository.findRefreshToken.mockResolvedValue(storedToken);
      request.server.userRepository.deleteRefreshToken.mockResolvedValue(undefined);

      const reply = buildMockReply();

      await expect(refreshService(request, reply)).rejects.toThrow(
        new AppError(HTTP_STATUS.UNAUTHORIZED, "Refresh token expired", "AUTH_REFRESH_TOKEN_EXPIRED")
      );

      expect(request.server.userRepository.deleteRefreshToken).toHaveBeenCalled();
    });
  });

  describe("logoutService", () => {
    it("logs out successfully with valid refresh cookie", async () => {
      const request = buildMockRequest({
        cookies: { refreshToken: "valid-token" }
      });

      const storedToken = {
        id: 1,
        userId: 1,
        tokenHash: hashRefreshToken("valid-token"),
        expiresAt: new Date(Date.now() + 1000),
        createdAt: new Date()
      };

      request.server.userRepository.findRefreshToken.mockResolvedValue(storedToken);
      request.server.userRepository.deleteRefreshToken.mockResolvedValue(undefined);

      const reply = buildMockReply();

      const result = await logoutService(request, reply);

      expect(request.server.userRepository.findRefreshToken).toHaveBeenCalled();
      expect(request.server.userRepository.deleteRefreshToken).toHaveBeenCalled();
      expect(reply.setCookie).toHaveBeenCalled();
      expect(result.message).toBe("Logged out successfully");
    });

    it("succeeds even without refresh cookie", async () => {
      const request = buildMockRequest({
        cookies: {}
      });

      const reply = buildMockReply();

      const result = await logoutService(request, reply);

      expect(result.message).toBe("Logged out successfully");
      expect(reply.setCookie).toHaveBeenCalled();
    });
  });

  describe("changePasswordService", () => {
    it("changes password successfully", async () => {
      const request = buildMockRequest({
        body: { currentPassword: "old123", newPassword: "new123" }
      });

      const userRecord = {
        id: 1,
        login: "test@test.com",
        role: Role.USER,
        hashPassword: await hashPassword("old123", SALT_SECRET),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      request.server.userRepository.findUserRecordByLogin.mockResolvedValue(userRecord);
      request.server.userRepository.updateUserPassword.mockResolvedValue(undefined);

      const result = await changePasswordService(request);

      expect(request.server.userRepository.findUserRecordByLogin).toHaveBeenCalledWith("test@test.com");
      expect(request.server.userRepository.updateUserPassword).toHaveBeenCalledWith(1, expect.any(String));
      expect(result.message).toBe("Password changed successfully");
    });

    it("throws 403 for unknown user", async () => {
      const request = buildMockRequest({
        body: { currentPassword: "old123", newPassword: "new123" }
      });

      request.server.userRepository.findUserRecordByLogin.mockResolvedValue(null);

      await expect(changePasswordService(request)).rejects.toThrow(
        new AppError(HTTP_STATUS.FORBIDDEN, "User not found", "USER_NOT_FOUND")
      );
    });

    it("throws 400 for incorrect current password", async () => {
      const request = buildMockRequest({
        body: { currentPassword: "wrong123", newPassword: "new123" }
      });

      const userRecord = {
        id: 1,
        login: "test@test.com",
        role: Role.USER,
        hashPassword: await hashPassword("correct123", SALT_SECRET),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      request.server.userRepository.findUserRecordByLogin.mockResolvedValue(userRecord);

      await expect(changePasswordService(request)).rejects.toThrow(
        new AppError(HTTP_STATUS.BAD_REQUEST, "Current password is incorrect", "INVALID_CURRENT_PASSWORD")
      );
    });
  });
});