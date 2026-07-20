import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables before instantiating Prisma Client
dotenv.config();

export const prisma = new PrismaClient();
