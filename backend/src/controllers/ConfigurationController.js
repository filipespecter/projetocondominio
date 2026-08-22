import ConfigurationService from "../services/ConfigurationService.js";

class ConfigurationController {
  async show(req, res, next) { try { return res.json({ success: true, data: await ConfigurationService.getAll(req.user) }); } catch (e) { return next(e); } }
  async updateCondominium(req, res, next) { try { return res.json({ success: true, data: await ConfigurationService.updateCondominium(req.user, req.body) }); } catch (e) { return next(e); } }
  async updateGroup(req, res, next) { try { return res.json({ success: true, data: await ConfigurationService.updateSettingsGroup(req.user, req.params.group, req.body) }); } catch (e) { return next(e); } }
  async createUser(req, res, next) { try { return res.status(201).json({ success: true, data: await ConfigurationService.createManager(req.user, req.body) }); } catch (e) { return next(e); } }
  async updateUser(req, res, next) { try { return res.json({ success: true, data: await ConfigurationService.updateManager(req.user, req.params.id, req.body) }); } catch (e) { return next(e); } }
  async toggleUser(req, res, next) { try { return res.json({ success: true, data: await ConfigurationService.toggleManager(req.user, req.params.id) }); } catch (e) { return next(e); } }
  async removeUser(req, res, next) { try { return res.json({ success: true, data: await ConfigurationService.removeManager(req.user, req.params.id) }); } catch (e) { return next(e); } }
  async masterCredentials(req, res, next) { try { return res.json({ success: true, data: await ConfigurationService.updateMasterCredentials(req.user, req.body) }); } catch (e) { return next(e); } }
}
export default new ConfigurationController();