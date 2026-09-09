export interface DashboardStatsResult {
  totalEquipment: number;
  rentedEquipment: number;
  activeCustomers: number;
  activeOrders: number;
  monthlyRevenue: unknown;
  recentOrders: Array<{
    id: string;
    customer: { name: string };
  }>;
}

export interface IDashboardRepository {
  getStats(): Promise<DashboardStatsResult>;
}
