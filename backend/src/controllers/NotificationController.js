import NotificationService from "../services/NotificationService.js";

class NotificationController {
  async unreadCount(req, res, next) {
    try {
      const data = await NotificationService.countUnread(req.user.id, req.user.condominiumId);
      return res.json({ success: true, data });
    } catch (error) { return next(error); }
  }

  async myUnread(req, res, next) {
    try {
      const data = await NotificationService.findUnreadByUser(req.user.id, req.user.condominiumId);
      return res.json({ success: true, data });
    } catch (error) { return next(error); }
  }

  async myNotifications(req, res, next) {
    try {
      const data = await NotificationService.findByUser(req.user.id, req.user.condominiumId);
      return res.json({ success: true, data });
    } catch (error) { return next(error); }
  }

  async markAllAsRead(req, res, next) {
    try {
      const data = await NotificationService.markAllAsRead(req.user.id, req.user.condominiumId);
      return res.json({ success: true, ...data });
    } catch (error) { return next(error); }
  }

  async removeRead(req, res, next) {
    try {
      const data = await NotificationService.removeReadByUser(req.user.id, req.user.condominiumId);
      return res.json({ success: true, ...data });
    } catch (error) { return next(error); }
  }

  async index(req, res, next) {
    try {
      const condominiumId = req.user.condominiumId;
      const { recipientUserId, targetRole, type, module, unreadOnly } = req.query;
      let data;
      if (unreadOnly === true && recipientUserId) data = await NotificationService.findUnreadByUser(recipientUserId, condominiumId);
      else if (recipientUserId) data = await NotificationService.findByUser(recipientUserId, condominiumId);
      else if (targetRole) data = await NotificationService.findByTargetRole(condominiumId, targetRole);
      else if (type) data = await NotificationService.findByType(condominiumId, type);
      else if (module) data = await NotificationService.findByModule(condominiumId, module);
      else data = await NotificationService.findByCondominium(condominiumId);
      return res.json({ success: true, data });
    } catch (error) { return next(error); }
  }

  async create(req, res, next) {
    try {
      const condominiumId = req.user.condominiumId;
      const { recipientUserId, targetRole, ...data } = req.body;
      const notification = recipientUserId
        ? await NotificationService.createForUser(condominiumId, recipientUserId, data)
        : await NotificationService.createForRole(condominiumId, targetRole, data);
      return res.status(201).json({ success: true, message: "Notificação criada com sucesso.", data: notification });
    } catch (error) { return next(error); }
  }

  async show(req, res, next) {
    try {
      const data = await NotificationService.findById(req.params.id, req.user.condominiumId);
      return res.json({ success: true, data });
    } catch (error) { return next(error); }
  }

  async markAsRead(req, res, next) {
    try {
      const data = await NotificationService.markAsRead(req.params.id, req.user.id, req.user.condominiumId);
      return res.json({ success: true, message: "Notificação marcada como lida.", data });
    } catch (error) { return next(error); }
  }

  async remove(req, res, next) {
    try {
      const data = await NotificationService.remove(req.params.id, req.user.id, req.user.condominiumId);
      return res.json({ success: true, ...data });
    } catch (error) { return next(error); }
  }
}

export default new NotificationController();
