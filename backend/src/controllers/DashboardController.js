import DashboardService from "../services/DashboardService.js";
import ResidentService from "../services/ResidentService.js";

class DashboardController {
  async manager(req, res, next) {
    try {
      const data = await DashboardService.getManagerDashboard(
        req.user.condominiumId
      );

      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async doorman(req, res, next) {
    try {
      const data = await DashboardService.getDoormanDashboard(
        req.user.condominiumId
      );

      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async resident(req, res, next) {
    try {
      const resident = await ResidentService.findByUserId(
        req.user.id,
        req.user.condominiumId
      );

      const data = await DashboardService.getResidentDashboard({
        condominiumId: req.user.condominiumId,
        apartmentId: resident.apartmentId,
        userId: req.user.id,
      });

      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  async summary(req, res, next) {
    try {
      const data = await DashboardService.getSummary(
        req.user.condominiumId
      );

      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }
}

export default new DashboardController();
