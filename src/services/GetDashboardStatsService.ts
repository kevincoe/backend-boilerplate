import {
  IDashboardRepository,
  DashboardStatsResult,
} from "../repositories/contracts/IDashboardRepository";

export class GetDashboardStatsService {
  constructor(private readonly dashboardRepository: IDashboardRepository) {}

  public async execute(): Promise<DashboardStatsResult> {
    return this.dashboardRepository.getStats();
  }
}
