import { prisma } from '../config/prisma';

export interface TransactionFilter {
  search?: string;
  type?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
  isArchived?: boolean;
}

export class TransactionRepository {
  async getTransactions(filter: TransactionFilter, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = await this.buildWhereClause(filter);

    return prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            kycStatus: true,
            riskScore: true,
            riskLevel: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });
  }

  async countTransactions(filter: TransactionFilter): Promise<number> {
    const where = await this.buildWhereClause(filter);
    return prisma.transaction.count({ where });
  }

  async findById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            kycStatus: true,
            riskScore: true,
            riskLevel: true,
          }
        }
      }
    });
  }

  async getTodaySummary() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const txs = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: startOfToday },
        isArchived: false
      }
    });

    const totalValue = txs.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      count: txs.length,
      value: totalValue,
      transactions: txs
    };
  }

  private async buildWhereClause(filter: TransactionFilter) {
    const where: any = {
      isArchived: filter.isArchived ?? false
    };

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
      where.amount = {};
      if (filter.minAmount !== undefined) where.amount.gte = filter.minAmount;
      if (filter.maxAmount !== undefined) where.amount.lte = filter.maxAmount;
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      // To perform case-insensitive or text search across relations we construct an OR block
      where.OR = [
        { id: { contains: filter.search } },
        { description: { contains: filter.search } },
        { recipientName: { contains: filter.search } },
        {
          user: {
            OR: [
              { fullName: { contains: filter.search } },
              { email: { contains: filter.search } },
              { phoneNumber: { contains: filter.search } }
            ]
          }
        }
      ];
    }

    return where;
  }
}

export const transactionRepository = new TransactionRepository();
