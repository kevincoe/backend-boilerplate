import { PrismaClient } from "@prisma/client";
import { OrderState } from "../domain/OrderState";

export class GetDashboardStatsService {
  constructor(private readonly prisma: PrismaClient) {}

  public async execute() {
    // 1. Total de Equipamentos (Assets totais)
    const totalEquipment = await this.prisma.asset.count();

    // Equipamentos Locados (Assets indisponíveis)
    const rentedEquipment = await this.prisma.asset.count({
      where: { state: { not: "AVAILABLE" } },
    });

    // 2. Clientes Ativos (Temos pedidos recentes)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Contar clientes distintos com pedidos criados nos últimos 30 dias que não são rascunho
    const activeCustomersData = await this.prisma.order.groupBy({
      by: ["customerId"],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        state: { not: OrderState.DRAFT },
      },
    });
    const activeCustomers = activeCustomersData.length;

    // 3. Pedidos em Andamento
    const inProgressStates = [
      OrderState.AWAITING_DEPOSIT,
      OrderState.RESERVED,
      OrderState.IN_PROGRESS,
      OrderState.PENDING_INSPECTION,
    ];

    const activeOrders = await this.prisma.order.count({
      where: { state: { in: inProgressStates } },
    });

    // 4. Faturamento do Mês
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

    // 5. Atividades Recentes
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
