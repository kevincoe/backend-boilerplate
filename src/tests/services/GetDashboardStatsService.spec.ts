import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { GetDashboardStatsService } from "../../services/GetDashboardStatsService";
import { IDashboardRepository } from "../../repositories/contracts/IDashboardRepository";

describe("GetDashboardStatsService", () => {
  let dashboardRepositoryMock: Record<string, Mock>;
  let getDashboardStatsService: GetDashboardStatsService;

  beforeEach(() => {
    dashboardRepositoryMock = {
      getStats: vi.fn(),
    };

    getDashboardStatsService = new GetDashboardStatsService(
      dashboardRepositoryMock as unknown as IDashboardRepository,
    );
  });

  it("should retrieve dashboard statistics successfully", async () => {
    const mockStats = {
      totalEquipment: 120,
      rentedEquipment: 45,
      activeCustomers: 18,
      activeOrders: 12,
      monthlyRevenue: 15400,
      recentOrders: [
        { id: "order-1", customer: { name: "Alice" } },
        { id: "order-2", customer: { name: "Bob" } },
      ],
    };

    (dashboardRepositoryMock.getStats as Mock).mockResolvedValue(mockStats);

    const result = await getDashboardStatsService.execute();

    expect(dashboardRepositoryMock.getStats).toHaveBeenCalled();
    expect(result).toEqual(mockStats);
    expect(result.totalEquipment).toBe(120);
    expect(result.rentedEquipment).toBe(45);
    expect(result.monthlyRevenue).toBe(15400);
  });
});
