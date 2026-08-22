import AnalyticsService from "../services/AnalyticsService.js";

class AnalyticsController {
  buildFilters(req) {
    return {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
    };
  }

  async overview(req, res, next) {
    try {
      const data = await AnalyticsService.getOverview(
        req.user.condominiumId,
        this.buildFilters(req)
      );
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async dailyMovement(req, res, next) {
    try {
      const data = await AnalyticsService.getDailyMovement(
        req.user.condominiumId,
        this.buildFilters(req)
      );
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async monthlyMovement(req, res, next) {
    try {
      const data = await AnalyticsService.getMonthlyMovement(
        req.user.condominiumId,
        this.buildFilters(req)
      );
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async visitors(req, res, next) {
    try {
      const data = await AnalyticsService.getVisitorAnalytics(
        req.user.condominiumId,
        this.buildFilters(req)
      );
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async packages(req, res, next) {
    try {
      const data = await AnalyticsService.getPackageAnalytics(
        req.user.condominiumId,
        this.buildFilters(req)
      );
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async reservations(req, res, next) {
    try {
      const data = await AnalyticsService.getReservationAnalytics(
        req.user.condominiumId,
        this.buildFilters(req)
      );
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async occurrences(req, res, next) {
    try {
      const data = await AnalyticsService.getOccurrenceAnalytics(
        req.user.condominiumId,
        this.buildFilters(req)
      );
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async occupancy(req, res, next) {
    try {
      const data = await AnalyticsService.getOccupancyAnalytics(
        req.user.condominiumId
      );
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async full(req, res, next) {
    try {
      const data = await AnalyticsService.getFullAnalytics(
        req.user.condominiumId,
        this.buildFilters(req)
      );
      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }
}

export default new AnalyticsController();
