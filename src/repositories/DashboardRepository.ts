import { PrismaClient } from "@prisma/client";
import { OrderState } from "../domain/OrderState";
import { IDashboardRepository, DashboardStatsResult } from "./contracts/IDashboardRepository";

export class DashboardRepository implements IDashboardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async getStats(): Promise<DashboardStatsResult> {
    const totalEquipment = await this.prisma.asset.count();

    const rentedEquipment = await this.prisma.asset.count({
      where: { state: { not: "AVAILABLE" } },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeCustomersData = await this.prisma.order.groupBy({
      by: ["customerId"],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        state: { not: OrderState.DRAFT },
      },
    });
    const activeCustomers = activeCustomersData.length;

    const inProgressStates = [
      OrderState.AWAITING_DEPOSIT,
      OrderState.RESERVED,
      OrderState.IN_PROGRESS,
      OrderState.PENDING_INSPECTION,
    ];

    const activeOrders = await this.prisma.order.count({
      where: { state: { in: inProgressStates } },
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const revenueAggregation = await this.prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: startOfMonth, lt: endOfMonth },
        state: { notIn: [OrderState.DRAFT] },
      },
    });
    const monthlyRevenue = revenueAggregation._sum.totalAmount || 0;

    const recentOrders = await this.prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
      },
    });

    return {
      totalEquipment,
      rentedEquipment,
      activeCustomers,
      activeOrders,
      monthlyRevenue,
      recentOrders,
    };
  }
}
