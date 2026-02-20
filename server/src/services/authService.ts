import bcrypt from "bcrypt";
import { prisma } from "../config/database";
import { UserRole } from "@prisma/client";
import { generateToken } from "../utils/jwt";
import { AuthenticationError, ConflictError, NotFoundError } from "../utils/errors";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export const login = async (credentials: LoginCredentials) => {
  const { email, password } = credentials;

  const user = await prisma.users.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    throw new AuthenticationError("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AuthenticationError("Invalid email or password");
  }

  const token = generateToken({
    userId: user.userId,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      imageUrl: user.imageUrl,
    },
  };
};

export const register = async (data: RegisterData) => {
  const { email, password, name, role } = data;

  const existingUser = await prisma.users.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || UserRole.EMPLOYEE,
      isActive: true,
    },
  });

  const token = generateToken({
    userId: user.userId,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      imageUrl: user.imageUrl,
    },
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.users.findUnique({
    where: { userId },
    select: {
      userId: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError("User");
  }

  return user;
};

