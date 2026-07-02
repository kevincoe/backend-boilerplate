import { Request, Response, NextFunction } from "express";
import { GetDashboardStatsService } from "../services/GetDashboardStatsService";

export class DashboardController {
  constructor(
    private readonly getDashboardStatsService: GetDashboardStatsService,
  ) {}

  public async getStats(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const stats = await this.getDashboardStatsService.execute();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}
