import CondominiumService from "./CondominiumService.js";
import UserService from "./UserService.js";
import AuditLogService from "./AuditLogService.js";
import { ApiError } from "../utils/ApiError.js";

class ConfigurationService {
  normalizeSettings(settings) {
    const value = settings && typeof settings === "object" && !Array.isArray(settings) ? settings : {};
    return {
      preferences: value.preferences || {},
      whatsapp: value.whatsapp || {},
      bi: value.bi || {},
      security: value.security || {},
      theme: value.theme || {},
      commercial: value.commercial || {},
    };
  }

  mapUser(user) {
    return {
      id: user.id,
      nome: user.name,
      usuario: user.username,
      email: user.email || "",
      telefone: user.phone || "",
      perfil: user.role === "CONDOMINIUM_ADMIN" ? "mestre" : "sub",
      role: user.role,
      status: user.status === "ACTIVE" ? "Ativo" : "Inativo",
      criadoEm: user.createdAt,
      ultimaAlteracao: user.updatedAt,
    };
  }

  async getAll(authenticatedUser) {
    const condominiumId = authenticatedUser?.condominiumId;
    if (!condominiumId) throw new ApiError("Condomínio não identificado.", 400);

    const [condominium, users] = await Promise.all([
      CondominiumService.findById(condominiumId),
      UserService.findAll(condominiumId),
    ]);

    const adminUsers = users
      .filter((user) => ["CONDOMINIUM_ADMIN", "MANAGER"].includes(user.role))
      .map((user) => this.mapUser(user));

    const settings = this.normalizeSettings(condominium.settings);

    return {
      condominium: {
        id: condominium.id,
        nomeCondominio: condominium.name || "",
        cnpj: condominium.document || "",
        endereco: [condominium.addressLine, condominium.addressNumber, condominium.addressExtra]
          .filter(Boolean)
          .join(", "),
        telefone: condominium.phone || "",
        sindico: condominium.contactName || "",
        email: condominium.email || "",
        logoUrl: condominium.logoUrl || "",
        corTema: settings.theme?.corPrincipal || "#8b5cf6",
        tema: {
          corPrincipal: settings.theme?.corPrincipal || "#8b5cf6",
          corSecundaria: settings.theme?.corSecundaria || "#5b21b6",
          aplicarTemaPersonalizado: Boolean(settings.theme?.aplicarTemaPersonalizado),
          logoUrl: condominium.logoUrl || settings.theme?.logoUrl || "",
          atualizadoEm: settings.theme?.atualizadoEm || "",
        },
        plano: settings.commercial?.plano || "Completo",
        statusComercial: condominium.status || "ACTIVE",
        quantidadeUnidades: settings.commercial?.quantidadeUnidades || "",
        responsavelTecnico: settings.commercial?.responsavelTecnico || "",
        observacoesComerciais: settings.commercial?.observacoesComerciais || "",
      },
      preferences: settings.preferences,
      whatsapp: settings.whatsapp,
      bi: settings.bi,
      security: {
        jwtAtivo: true,
        refreshToken: true,
        loginPorPerfil: true,
        tempoSessao: settings.security?.tempoSessao || 60,
      },
      users: adminUsers,
      currentUser: this.mapUser(await UserService.findById(authenticatedUser.id, condominiumId)),
    };
  }

  async updateCondominium(authenticatedUser, payload) {
    if (authenticatedUser.role !== "CONDOMINIUM_ADMIN") {
      throw new ApiError("Apenas o administrador do condomínio pode alterar estes dados.", 403);
    }

    const condominiumId = authenticatedUser.condominiumId;
    const current = await CondominiumService.findById(condominiumId);
    const currentSettings = this.normalizeSettings(current.settings);
    const theme = payload.tema || {};

    const settings = {
      ...currentSettings,
      theme: {
        ...currentSettings.theme,
        ...theme,
        corPrincipal: payload.corTema || theme.corPrincipal || currentSettings.theme?.corPrincipal || "#8b5cf6",
        aplicarTemaPersonalizado: typeof theme.aplicarTemaPersonalizado === "boolean"
          ? theme.aplicarTemaPersonalizado
          : Boolean(currentSettings.theme?.aplicarTemaPersonalizado),
        logoUrl: payload.logoUrl || theme.logoUrl || current.logoUrl || "",
        atualizadoEm: new Date().toISOString(),
      },
      commercial: {
        ...(current.settings?.commercial || {}),
        plano: payload.plano,
        quantidadeUnidades: payload.quantidadeUnidades,
        responsavelTecnico: payload.responsavelTecnico,
        observacoesComerciais: payload.observacoesComerciais,
      },
    };

    return CondominiumService.update(condominiumId, {
      name: payload.nomeCondominio,
      document: payload.cnpj,
      email: payload.email,
      phone: payload.telefone,
      contactName: payload.sindico,
      addressLine: payload.endereco,
      logoUrl: payload.logoUrl,
      settings,
    }, authenticatedUser);
  }

  async updateSettingsGroup(authenticatedUser, group, payload) {
    if (!authenticatedUser?.condominiumId) throw new ApiError("Condomínio não identificado.", 400);
    const allowed = ["preferences", "whatsapp", "bi", "security"];
    if (!allowed.includes(group)) throw new ApiError("Grupo de configuração inválido.", 400);

    if (group === "security" && authenticatedUser.role !== "CONDOMINIUM_ADMIN") {
      throw new ApiError("Apenas o administrador do condomínio pode alterar segurança.", 403);
    }

    const current = await CondominiumService.findById(authenticatedUser.condominiumId);
    const settings = this.normalizeSettings(current.settings);

    const safePayload = group === "security"
      ? { tempoSessao: Number(payload?.tempoSessao) || 60 }
      : payload;

    const updatedSettings = {
      ...(current.settings || {}),
      ...settings,
      [group]: { ...(settings[group] || {}), ...(safePayload || {}) },
    };

    const updated = await CondominiumService.update(
      authenticatedUser.condominiumId,
      { settings: updatedSettings },
      authenticatedUser
    );

    return updated.settings?.[group] || {};
  }

  async createManager(authenticatedUser, payload) {
    this.requireMaster(authenticatedUser);
    const user = await UserService.createForCondominium(authenticatedUser.condominiumId, {
      name: payload.nome,
      username: payload.usuario,
      email: payload.email || null,
      phone: payload.telefone || null,
      password: payload.senha,
      role: "MANAGER",
      status: payload.status === "Inativo" ? "INACTIVE" : "ACTIVE",
      mustChangePassword: true,
    });
    await AuditLogService.logCreate({ condominiumId: authenticatedUser.condominiumId, user: authenticatedUser, module: "CONFIGURATION_USER", referenceId: user.id, afterData: user, details: "Usuário administrativo criado." });
    return this.mapUser(user);
  }

  async updateManager(authenticatedUser, id, payload) {
    this.requireMaster(authenticatedUser);
    const existing = await UserService.findById(id, authenticatedUser.condominiumId);
    if (existing.role === "CONDOMINIUM_ADMIN") throw new ApiError("O usuário mestre deve ser alterado na área de segurança.", 400);
    const updated = await UserService.update(id, authenticatedUser.condominiumId, {
      name: payload.nome,
      username: payload.usuario,
      email: payload.email,
      phone: payload.telefone,
      status: payload.status === "Inativo" ? "INACTIVE" : "ACTIVE",
    });
    if (payload.senha) await UserService.resetPassword(id, authenticatedUser.condominiumId, payload.senha);
    await AuditLogService.logUpdate({ condominiumId: authenticatedUser.condominiumId, user: authenticatedUser, module: "CONFIGURATION_USER", referenceId: id, beforeData: existing, afterData: updated, details: "Usuário administrativo atualizado." });
    return this.mapUser(updated);
  }

  async toggleManager(authenticatedUser, id) {
    this.requireMaster(authenticatedUser);
    const existing = await UserService.findById(id, authenticatedUser.condominiumId);
    if (existing.role === "CONDOMINIUM_ADMIN") throw new ApiError("O usuário mestre não pode ser inativado por esta tela.", 400);
    const updated = existing.status === "ACTIVE"
      ? await UserService.deactivate(id, authenticatedUser.condominiumId)
      : await UserService.activate(id, authenticatedUser.condominiumId);
    await AuditLogService.logStatusChange({ condominiumId: authenticatedUser.condominiumId, user: authenticatedUser, module: "CONFIGURATION_USER", referenceId: id, previousStatus: existing.status, newStatus: updated.status });
    return this.mapUser(updated);
  }

  async removeManager(authenticatedUser, id) {
    this.requireMaster(authenticatedUser);
    const existing = await UserService.findById(id, authenticatedUser.condominiumId);
    if (existing.role === "CONDOMINIUM_ADMIN") throw new ApiError("O usuário mestre não pode ser excluído.", 400);
    await UserService.remove(id, authenticatedUser.condominiumId);
    await AuditLogService.logDelete({ condominiumId: authenticatedUser.condominiumId, user: authenticatedUser, module: "CONFIGURATION_USER", referenceId: id, beforeData: existing, details: "Usuário administrativo removido." });
    return { message: "Usuário removido com sucesso." };
  }

  async updateMasterCredentials(authenticatedUser, payload) {
    this.requireMaster(authenticatedUser);
    const updated = await UserService.update(authenticatedUser.id, authenticatedUser.condominiumId, {
      username: payload.usuario,
    });
    if (payload.senha) await UserService.resetPassword(authenticatedUser.id, authenticatedUser.condominiumId, payload.senha);
    await AuditLogService.logUpdate({ condominiumId: authenticatedUser.condominiumId, user: authenticatedUser, module: "CONFIGURATION_SECURITY", referenceId: authenticatedUser.id, beforeData: null, afterData: { username: updated.username, passwordChanged: Boolean(payload.senha) }, details: "Credenciais do administrador do condomínio atualizadas." });
    return this.mapUser(updated);
  }

  requireMaster(user) {
    if (user?.role !== "CONDOMINIUM_ADMIN") {
      throw new ApiError("Apenas o administrador do condomínio pode executar esta ação.", 403);
    }
  }
}

export default new ConfigurationService();
