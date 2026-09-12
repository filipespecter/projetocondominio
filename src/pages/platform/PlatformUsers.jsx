import { useEffect, useMemo, useState } from "react";
import authApi from "../../Services/authApi.js";
import platformApi from "../../Services/platformApi.js";

const GOLD = "#c8a85c";
const GOLD_SOFT = "#f6eed9";
const PURPLE = "var(--ic-primary-dark)";
const DEEP = "#1b102c";

const emptyForm = {
  name: "",
  username: "",
  email: "",
  phone: "",
  document: "",
  password: "",
  role: "PLATFORM_SUPPORT",
  status: "ACTIVE",
  platformEmployeeCode: "",
  platformJobTitle: "",
  platformDepartment: "",
  platformEmploymentType: "CLT",
  platformStartDate: "",
  platformNotes: "",
};

const roleLabels = {
  PLATFORM_OWNER: "Proprietário da plataforma",
  PLATFORM_ADMIN: "Administrador da plataforma",
  PLATFORM_SUPPORT: "Suporte da plataforma",
};

const statusLabels = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  BLOCKED: "Bloqueado",
  PENDING: "Pendente",
};

const employmentLabels = {
  CLT: "CLT",
  PJ: "Pessoa jurídica",
  ESTAGIO: "Estágio",
  SOCIO: "Sócio",
  OUTRO: "Outro",
};

function normalizeItems(data) {
  if (Array.isArray(data)) return data;
  return data?.items ?? data?.data ?? [];
}

function digits(value, max = 99) {
  return String(value ?? "").replace(/\D/g, "").slice(0, max);
}

function maskPhone(value) {
  const v = digits(value, 13);
  const local = v.startsWith("55") ? v.slice(2) : v;
  const ddd = local.slice(0, 2);
  const first = local.slice(2, local.length > 10 ? 7 : 6);
  const last = local.slice(local.length > 10 ? 7 : 6, 11);
  if (!ddd) return "";
  if (local.length <= 2) return `(${ddd}`;
  if (!first) return `(${ddd}) `;
  return `(${ddd}) ${first}${last ? `-${last}` : ""}`;
}

function maskDocument(value) {
  const v = digits(value, 14);
  if (v.length <= 11) {
    return v
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }
  return v
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", withTime
    ? { dateStyle: "short", timeStyle: "short" }
    : { dateStyle: "medium" });
}

function companyTime(days = 0) {
  if (days < 30) return `${days} dia${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return `${years} ${years === 1 ? "ano" : "anos"}${rest ? ` e ${rest} ${rest === 1 ? "mês" : "meses"}` : ""}`;
}

function initials(name) {
  return String(name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "SI";
}

function PlatformUsers() {
  const [currentUser, setCurrentUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileTab, setProfileTab] = useState("file");

  const [passwordTarget, setPasswordTarget] = useState(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [me, response] = await Promise.all([
        authApi.me(),
        platformApi.users.list("?limit=100&sortBy=name&sortOrder=asc"),
      ]);
      setCurrentUser(me);
      setItems(normalizeItems(response));
    } catch (err) {
      setError(err?.message ?? "Falha ao carregar a equipe da Central Star.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const team = useMemo(
    () => items.filter((item) =>
      ["PLATFORM_OWNER", "PLATFORM_ADMIN", "PLATFORM_SUPPORT"].includes(item.role)
    ),
    [items]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return team.filter((item) => {
      const matchesSearch =
        !term ||
        [
          item.name,
          item.username,
          item.email,
          item.platformEmployeeCode,
          item.platformJobTitle,
          item.platformDepartment,
        ].some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesRole = roleFilter === "ALL" || item.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [team, search, roleFilter, statusFilter]);

  function canManage(item) {
    if (item.role === "PLATFORM_OWNER") return false;
    if (currentUser?.role === "PLATFORM_OWNER") return true;
    return (
      currentUser?.role === "PLATFORM_ADMIN" &&
      item.role === "PLATFORM_SUPPORT"
    );
  }

  const stats = useMemo(() => ({
    total: team.length,
    active: team.filter((i) => i.status === "ACTIVE").length,
    admins: team.filter((i) => i.role === "PLATFORM_ADMIN").length,
    support: team.filter((i) => i.role === "PLATFORM_SUPPORT").length,
  }), [team]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      role: currentUser?.role === "PLATFORM_OWNER"
        ? "PLATFORM_SUPPORT"
        : "PLATFORM_SUPPORT",
      platformStartDate: new Date().toISOString().slice(0, 10),
    });
    setFormOpen(true);
    setError("");
  }

  function openEdit(item) {
    if (item.role === "PLATFORM_OWNER") {
      openProfile(item);
      return;
    }
    setEditing(item);
    setForm({
      name: item.name ?? "",
      username: item.username ?? "",
      email: item.email ?? "",
      phone: item.phone ?? "",
      document: item.document ?? "",
      password: "",
      role: item.role ?? "PLATFORM_SUPPORT",
      status: item.status ?? "ACTIVE",
      platformEmployeeCode: item.platformEmployeeCode ?? "",
      platformJobTitle: item.platformJobTitle ?? "",
      platformDepartment: item.platformDepartment ?? "",
      platformEmploymentType: item.platformEmploymentType ?? "CLT",
      platformStartDate: item.platformStartDate
        ? new Date(item.platformStartDate).toISOString().slice(0, 10)
        : "",
      platformNotes: item.platformNotes ?? "",
    });
    setFormOpen(true);
    setError("");
  }

  function change(field, value) {
    let next = value;
    if (field === "username") {
      next = String(value).toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 50);
    }
    if (field === "phone") next = digits(value, 13);
    if (field === "document") next = digits(value, 14);
    if (field === "platformEmployeeCode") {
      next = String(value).toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 30);
    }
    setForm((prev) => ({ ...prev, [field]: next }));
  }

  function validateForm() {
    if (form.name.trim().length < 2) return "Informe o nome completo.";
    if (!/^[a-z0-9._-]{3,50}$/.test(form.username)) return "Username inválido.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "E-mail inválido.";
    const phone = digits(form.phone, 13);
    if (phone && (phone.length < 10 || phone.length > 13)) return "Telefone inválido.";
    const doc = digits(form.document, 14);
    if (doc && ![11, 14].includes(doc.length)) return "Informe CPF com 11 ou CNPJ com 14 dígitos.";
    if (!editing && form.password.length < 8) return "A senha temporária precisa ter no mínimo 8 caracteres.";
    if (!form.platformJobTitle.trim()) return "Informe o cargo do colaborador.";
    if (!form.platformDepartment.trim()) return "Informe o departamento.";
    if (!form.platformStartDate) return "Informe a data de entrada na empresa.";
    return "";
  }

  function buildPayload() {
    return {
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim() || null,
      phone: digits(form.phone, 13) || null,
      document: digits(form.document, 14) || null,
      role: form.role,
      platformEmployeeCode: form.platformEmployeeCode.trim() || null,
      platformJobTitle: form.platformJobTitle.trim() || null,
      platformDepartment: form.platformDepartment.trim() || null,
      platformEmploymentType: form.platformEmploymentType || null,
      platformStartDate: form.platformStartDate
        ? new Date(`${form.platformStartDate}T12:00:00-03:00`).toISOString()
        : null,
      platformNotes: form.platformNotes.trim() || null,
    };
  }

  async function saveUser(event) {
    event.preventDefault();
    const validation = validateForm();
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editing) {
        await platformApi.users.update(editing.id, buildPayload());
      } else {
        await platformApi.users.create({
          ...buildPayload(),
          password: form.password,
          status: form.status,
          mustChangePassword: true,
        });
      }
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err?.message ?? "Não foi possível salvar o colaborador.");
    } finally {
      setSaving(false);
    }
  }

  async function openProfile(item) {
    setProfileOpen(true);
    setProfileLoading(true);
    setProfile(null);
    setProfileTab("file");
    setError("");
    try {
      const data = await platformApi.users.profile(item.id);
      setProfile(data);
    } catch (err) {
      setError(err?.message ?? "Não foi possível carregar a ficha do colaborador.");
      setProfileOpen(false);
    } finally {
      setProfileLoading(false);
    }
  }

  function requestStatusChange(item) {
    if (item.role === "PLATFORM_OWNER") return;
    const next = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setConfirmAction({
      title: next === "ACTIVE" ? "Ativar acesso" : "Desativar acesso",
      message: `${next === "ACTIVE" ? "Ativar" : "Desativar"} o acesso de ${item.name}?`,
      async run() {
        try {
          await platformApi.users.changeStatus(item.id, { status: next });
          setSuccess(`Acesso de ${item.name} atualizado com sucesso.`);
          setConfirmAction(null);
          await load();
          if (profileOpen && profile?.user?.id === item.id) {
            await openProfile({ ...item, status: next });
          }
        } catch (err) {
          setError(err?.message ?? "Não foi possível alterar o status.");
          setConfirmAction(null);
        }
      },
    });
  }

  function resetPassword(item) {
    if (item.role === "PLATFORM_OWNER") return;
    setPasswordTarget(item);
    setPasswordValue("");
    setError("");
  }

  async function submitPassword(event) {
    event.preventDefault();
    if (passwordValue.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await platformApi.users.resetPassword(
        passwordTarget.id,
        { newPassword: passwordValue }
      );
      setSuccess("Senha redefinida. A troca será obrigatória no próximo acesso.");
      setPasswordTarget(null);
      setPasswordValue("");
    } catch (err) {
      setError(err?.message ?? "Não foi possível redefinir a senha.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={styles.center}>Carregando equipe da Central Star...</div>;
  }

  return (
    <div style={styles.page}>
      <style>{responsiveCss}</style>

      <section style={styles.hero} className="platform-users-hero">
        <div>
          <div style={styles.eyebrow}>STAR INFINITY CODE • GESTÃO INTERNA</div>
          <h1 style={styles.title}>Equipe da Central</h1>
          <p style={styles.subtitle}>
            Cadastro, nível de acesso, ficha profissional e rastreabilidade operacional dos colaboradores da plataforma.
          </p>
        </div>
        <button style={styles.primaryButton} onClick={openCreate}>
          + Novo colaborador
        </button>
      </section>

      {error && <div style={styles.error}>{error}</div>}
      {success && (
        <div style={styles.success} onClick={() => setSuccess("")}>
          {success}
        </div>
      )}

      <section style={styles.stats} className="platform-users-stats">
        <Metric label="Equipe cadastrada" value={stats.total} />
        <Metric label="Ativos" value={stats.active} />
        <Metric label="Administradores" value={stats.admins} />
        <Metric label="Suporte" value={stats.support} />
      </section>

      <section style={styles.panel}>
        <div style={styles.panelTop} className="platform-users-toolbar">
          <div>
            <div style={styles.sectionEyebrow}>COLABORADORES</div>
            <h2 style={styles.sectionTitle}>Diretório interno</h2>
          </div>
          <div style={styles.filters} className="platform-users-filters">
            <input
              style={styles.input}
              placeholder="Buscar nome, cargo, código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select style={styles.select} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="ALL">Todos os níveis</option>
              <option value="PLATFORM_OWNER">Owner</option>
              <option value="PLATFORM_ADMIN">Admin</option>
              <option value="PLATFORM_SUPPORT">Suporte</option>
            </select>
            <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Todos os status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
              <option value="BLOCKED">Bloqueados</option>
              <option value="PENDING">Pendentes</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={styles.empty}>Nenhum colaborador encontrado.</div>
        ) : (
          <div style={styles.cardGrid} className="platform-users-grid">
            {filtered.map((item) => (
              <article key={item.id} style={styles.personCard}>
                <div style={styles.cardHeader}>
                  <div style={styles.avatar}>{initials(item.name)}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={styles.personName}>{item.name}</div>
                    <div style={styles.personJob}>{item.platformJobTitle || roleLabels[item.role] || item.role}</div>
                  </div>
                  <span style={{
                    ...styles.status,
                    ...(item.status === "ACTIVE" ? styles.statusActive : styles.statusInactive),
                  }}>
                    {statusLabels[item.status] ?? item.status}
                  </span>
                </div>

                <div style={styles.metaGrid}>
                  <Info label="Código" value={item.platformEmployeeCode || "—"} />
                  <Info label="Departamento" value={item.platformDepartment || "—"} />
                  <Info label="Permissão" value={roleLabels[item.role] || item.role} />
                  <Info label="Último login" value={formatDate(item.lastLoginAt, true)} />
                </div>

                <div style={styles.actions}>
                  <button style={styles.secondaryButton} onClick={() => openProfile(item)}>
                    Abrir ficha
                  </button>
                  {canManage(item) && (
                    <button style={styles.ghostButton} onClick={() => openEdit(item)}>
                      Editar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {formOpen && (
        <Modal onClose={() => !saving && setFormOpen(false)} wide>
          <form onSubmit={saveUser}>
            <ModalHeader
              eyebrow={editing ? "EDIÇÃO DE COLABORADOR" : "NOVO COLABORADOR"}
              title={editing ? "Atualizar ficha e acesso" : "Cadastrar colaborador"}
              subtitle="Cargo profissional e nível de acesso são informações diferentes."
              onClose={() => !saving && setFormOpen(false)}
            />

            <div style={styles.formBody}>
              <FormSection title="Identificação">
                <Field label="Nome completo *">
                  <input style={styles.input} value={form.name} onChange={(e) => change("name", e.target.value)} maxLength={150} required />
                </Field>
                <Field label="Código do colaborador">
                  <input style={styles.input} value={form.platformEmployeeCode} onChange={(e) => change("platformEmployeeCode", e.target.value)} placeholder="EX: SIC-001" />
                </Field>
                <Field label="CPF / CNPJ">
                  <input style={styles.input} inputMode="numeric" value={maskDocument(form.document)} onChange={(e) => change("document", e.target.value)} placeholder="Somente números" />
                </Field>
                <Field label="Telefone">
                  <input style={styles.input} inputMode="tel" value={maskPhone(form.phone)} onChange={(e) => change("phone", e.target.value)} placeholder="(81) 99999-9999" />
                </Field>
                <Field label="E-mail">
                  <input style={styles.input} type="email" value={form.email} onChange={(e) => change("email", e.target.value)} maxLength={254} />
                </Field>
              </FormSection>

              <FormSection title="Vínculo profissional">
                <Field label="Cargo *">
                  <input style={styles.input} value={form.platformJobTitle} onChange={(e) => change("platformJobTitle", e.target.value)} placeholder="Ex.: Analista de Suporte N2" required />
                </Field>
                <Field label="Departamento *">
                  <input style={styles.input} value={form.platformDepartment} onChange={(e) => change("platformDepartment", e.target.value)} placeholder="Ex.: Operações" required />
                </Field>
                <Field label="Tipo de vínculo">
                  <select style={styles.select} value={form.platformEmploymentType} onChange={(e) => change("platformEmploymentType", e.target.value)}>
                    {Object.entries(employmentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
                <Field label="Data de entrada *">
                  <input style={styles.input} type="date" value={form.platformStartDate} onChange={(e) => change("platformStartDate", e.target.value)} required />
                </Field>
              </FormSection>

              <FormSection title="Acesso à Central">
                <Field label="Username *">
                  <input style={styles.input} value={form.username} onChange={(e) => change("username", e.target.value)} placeholder="nome.sobrenome" required />
                </Field>
                <Field label="Nível de permissão *">
                  <select
                    style={styles.select}
                    value={form.role}
                    disabled={currentUser?.role !== "PLATFORM_OWNER"}
                    onChange={(e) => change("role", e.target.value)}
                  >
                    <option value="PLATFORM_SUPPORT">PLATFORM_SUPPORT — suporte</option>
                    <option value="PLATFORM_ADMIN">PLATFORM_ADMIN — administração</option>
                  </select>
                </Field>
                {!editing && (
                  <Field label="Senha temporária *">
                    <input style={styles.input} type="password" value={form.password} onChange={(e) => change("password", e.target.value)} minLength={8} maxLength={128} required />
                  </Field>
                )}
              </FormSection>

              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Observações administrativas">
                  <textarea
                    style={{ ...styles.input, minHeight: 92, resize: "vertical" }}
                    value={form.platformNotes}
                    onChange={(e) => change("platformNotes", e.target.value)}
                    maxLength={2000}
                    placeholder="Responsabilidades, observações internas ou informações relevantes para a gestão."
                  />
                </Field>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button type="button" style={styles.ghostButton} onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</button>
              <button type="submit" style={styles.primaryButton} disabled={saving}>
                {saving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar colaborador"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {profileOpen && (
        <Modal onClose={() => setProfileOpen(false)} wide>
          <ModalHeader
            eyebrow="FICHA DO COLABORADOR"
            title={profile?.user?.name ?? "Carregando ficha..."}
            subtitle={profile?.user?.platformJobTitle ?? roleLabels[profile?.user?.role] ?? ""}
            onClose={() => setProfileOpen(false)}
          />

          {profileLoading ? (
            <div style={styles.center}>Carregando histórico e ficha...</div>
          ) : profile?.user ? (
            <>
              <div style={styles.profileHero}>
                <div style={styles.profileAvatar}>{initials(profile.user.name)}</div>
                <div>
                  <div style={styles.profileName}>{profile.user.name}</div>
                  <div style={styles.profileRole}>{profile.user.platformJobTitle || "Cargo não informado"}</div>
                  <div style={styles.profileCode}>
                    {profile.user.platformEmployeeCode || "Sem código interno"} • {roleLabels[profile.user.role] || profile.user.role}
                  </div>
                </div>
                <div style={styles.profileMetrics}>
                  <MiniMetric label="Tempo de empresa" value={companyTime(profile.summary?.companyDays ?? 0)} />
                  <MiniMetric label="Ações auditadas" value={profile.summary?.auditCount ?? 0} />
                  <MiniMetric label="Atendimentos" value={profile.summary?.supportCount ?? 0} />
                </div>
              </div>

              <div style={styles.tabs}>
                <Tab active={profileTab === "file"} onClick={() => setProfileTab("file")}>Ficha</Tab>
                <Tab active={profileTab === "activity"} onClick={() => setProfileTab("activity")}>Atividade</Tab>
                <Tab active={profileTab === "support"} onClick={() => setProfileTab("support")}>Atendimentos</Tab>
              </div>

              <div style={styles.profileBody}>
                {profileTab === "file" && (
                  <>
                    <div style={styles.profileGrid} className="profile-grid">
                      <ProfileBlock title="Profissional">
                        <Info label="Cargo" value={profile.user.platformJobTitle || "—"} />
                        <Info label="Departamento" value={profile.user.platformDepartment || "—"} />
                        <Info label="Vínculo" value={employmentLabels[profile.user.platformEmploymentType] || profile.user.platformEmploymentType || "—"} />
                        <Info label="Data de entrada" value={formatDate(profile.user.platformStartDate)} />
                      </ProfileBlock>
                      <ProfileBlock title="Acesso">
                        <Info label="Username" value={profile.user.username || "—"} />
                        <Info label="Nível de permissão" value={roleLabels[profile.user.role] || profile.user.role} />
                        <Info label="Status" value={statusLabels[profile.user.status] || profile.user.status} />
                        <Info label="Troca de senha obrigatória" value={profile.user.mustChangePassword ? "Sim" : "Não"} />
                      </ProfileBlock>
                      <ProfileBlock title="Contato">
                        <Info label="E-mail" value={profile.user.email || "—"} />
                        <Info label="Telefone" value={maskPhone(profile.user.phone) || "—"} />
                        <Info label="Documento" value={maskDocument(profile.user.document) || "—"} />
                        <Info label="Código interno" value={profile.user.platformEmployeeCode || "—"} />
                      </ProfileBlock>
                      <ProfileBlock title="Segurança e presença">
                        <Info label="Último login" value={formatDate(profile.user.lastLoginAt, true)} />
                        <Info label="Último logout" value={formatDate(profile.user.lastLogoutAt, true)} />
                        <Info label="Senha alterada" value={formatDate(profile.user.passwordChangedAt, true)} />
                        <Info label="Conta criada" value={formatDate(profile.user.createdAt, true)} />
                      </ProfileBlock>
                    </div>

                    {profile.user.platformNotes && (
                      <div style={styles.notes}>
                        <div style={styles.infoLabel}>OBSERVAÇÕES ADMINISTRATIVAS</div>
                        <div>{profile.user.platformNotes}</div>
                      </div>
                    )}

                    {canManage(profile.user) && (
                      <div style={styles.profileActions}>
                        <button style={styles.secondaryButton} onClick={() => { setProfileOpen(false); openEdit(profile.user); }}>Editar ficha</button>
                        <button style={styles.ghostButton} onClick={() => requestStatusChange(profile.user)}>
                          {profile.user.status === "ACTIVE" ? "Desativar acesso" : "Ativar acesso"}
                        </button>
                        <button style={styles.ghostButton} onClick={() => resetPassword(profile.user)}>Redefinir senha</button>
                      </div>
                    )}
                  </>
                )}

                {profileTab === "activity" && (
                  <Timeline
                    items={profile.auditLogs ?? []}
                    empty="Nenhuma ação auditada para este colaborador."
                    render={(item) => ({
                      title: `${item.module || "SISTEMA"} • ${item.action || "AÇÃO"}`,
                      subtitle: item.details || "Ação registrada pela auditoria.",
                      meta: `${formatDate(item.createdAt, true)}${item.condominium?.name ? ` • ${item.condominium.name}` : ""}`,
                    })}
                  />
                )}

                {profileTab === "support" && (
                  <Timeline
                    items={profile.supportSessions ?? []}
                    empty="Nenhuma sessão de atendimento registrada para este colaborador."
                    render={(item) => ({
                      title: item.condominium?.name || item.condominium?.code || "Condomínio",
                      subtitle: item.reason || "Atendimento sem descrição.",
                      meta: `${formatDate(item.startedAt, true)} • ${item.status}${item.endedAt ? ` • encerrado ${formatDate(item.endedAt, true)}` : ""}`,
                    })}
                  />
                )}
              </div>
            </>
          ) : null}
        </Modal>
      )}

      {passwordTarget && (
        <Modal onClose={() => !saving && setPasswordTarget(null)}>
          <form onSubmit={submitPassword}>
            <ModalHeader
              eyebrow="SEGURANÇA"
              title="Redefinir senha"
              subtitle={`Nova senha temporária para ${passwordTarget.name}.`}
              onClose={() => !saving && setPasswordTarget(null)}
            />
            <div style={{ padding: 22 }}>
              <Field label="Nova senha temporária *">
                <input
                  autoFocus
                  style={styles.input}
                  type="password"
                  minLength={8}
                  maxLength={128}
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  required
                />
              </Field>
              <p style={{ color: "#7b6d82", fontSize: 12, lineHeight: 1.5 }}>
                O colaborador será obrigado a alterar esta senha no próximo acesso.
              </p>
            </div>
            <div style={styles.modalFooter}>
              <button type="button" style={styles.ghostButton} onClick={() => setPasswordTarget(null)}>Cancelar</button>
              <button type="submit" style={styles.primaryButton} disabled={saving}>
                {saving ? "Salvando..." : "Redefinir senha"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmAction && (
        <Modal onClose={() => setConfirmAction(null)}>
          <ModalHeader
            eyebrow="CONFIRMAÇÃO"
            title={confirmAction.title}
            subtitle={confirmAction.message}
            onClose={() => setConfirmAction(null)}
          />
          <div style={styles.modalFooter}>
            <button style={styles.ghostButton} onClick={() => setConfirmAction(null)}>Cancelar</button>
            <button style={styles.primaryButton} onClick={confirmAction.run}>Confirmar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={styles.metric}>
      <div style={styles.metricAccent} />
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return <div style={styles.miniMetric}><span>{label}</span><strong>{value}</strong></div>;
}

function Info({ label, value }) {
  return <div style={styles.info}><span style={styles.infoLabel}>{label}</span><strong style={styles.infoValue}>{value}</strong></div>;
}

function Field({ label, children }) {
  return <label style={styles.field}><span style={styles.fieldLabel}>{label}</span>{children}</label>;
}

function FormSection({ title, children }) {
  return (
    <div style={styles.formSection}>
      <div style={styles.formSectionTitle}>{title}</div>
      <div style={styles.formGrid} className="form-grid">{children}</div>
    </div>
  );
}

function ProfileBlock({ title, children }) {
  return <div style={styles.profileBlock}><h3 style={styles.blockTitle}>{title}</h3><div style={styles.blockContent}>{children}</div></div>;
}

function Tab({ active, onClick, children }) {
  return <button onClick={onClick} style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}>{children}</button>;
}

function Timeline({ items, empty, render }) {
  if (!items.length) return <div style={styles.empty}>{empty}</div>;
  return (
    <div style={styles.timeline}>
      {items.map((item) => {
        const row = render(item);
        return (
          <div key={item.id} style={styles.timelineRow}>
            <div style={styles.timelineDot} />
            <div>
              <div style={styles.timelineTitle}>{row.title}</div>
              <div style={styles.timelineSubtitle}>{row.subtitle}</div>
              <div style={styles.timelineMeta}>{row.meta}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Modal({ children, onClose, wide = false }) {
  return (
    <div style={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...styles.modal, ...(wide ? styles.modalWide : {}) }}>{children}</div>
    </div>
  );
}

function ModalHeader({ eyebrow, title, subtitle, onClose }) {
  return (
    <div style={styles.modalHeader}>
      <div>
        <div style={styles.sectionEyebrow}>{eyebrow}</div>
        <h2 style={styles.modalTitle}>{title}</h2>
        <p style={styles.modalSubtitle}>{subtitle}</p>
      </div>
      <button style={styles.closeButton} onClick={onClose} type="button">×</button>
    </div>
  );
}

const responsiveCss = `
  @media (max-width: 960px) {
    .platform-users-hero { align-items: flex-start !important; }
    .platform-users-stats { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
    .platform-users-toolbar { align-items: stretch !important; }
    .platform-users-filters { width: 100% !important; }
    .profile-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 680px) {
    .platform-users-hero { padding: 24px !important; border-radius: 22px !important; }
    .platform-users-stats { grid-template-columns: 1fr !important; }
    .platform-users-grid { grid-template-columns: 1fr !important; }
    .platform-users-filters { grid-template-columns: 1fr !important; }
    .form-grid { grid-template-columns: 1fr !important; }
  }
`;

const styles = {
  page: { width: "100%", color: DEEP, fontFamily: "Inter, Arial, sans-serif" },
  center: { minHeight: 240, display: "grid", placeItems: "center", color: "#746b7f", fontWeight: 700 },
  hero: {
    background: "linear-gradient(135deg,#24103f 0%,var(--ic-primary-dark) 68%,#7240d4 100%)",
    borderRadius: 30, padding: "34px 36px", color: "white", display: "flex",
    justifyContent: "space-between", alignItems: "center", gap: 24,
    boxShadow: "0 24px 60px rgba(44,18,78,.18)", border: "1px solid rgba(200,168,92,.35)"
  },
  eyebrow: { fontSize: 12, fontWeight: 900, letterSpacing: 1.8, color: "#e8cf8a", marginBottom: 10 },
  title: { fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.05, margin: 0, letterSpacing: -1.1 },
  subtitle: { maxWidth: 760, margin: "12px 0 0", lineHeight: 1.65, color: "rgba(255,255,255,.78)", fontSize: 15 },
  primaryButton: { border: "1px solid #dfc678", background: "linear-gradient(135deg,#d7bd70,#b78f37)", color: "#221632", borderRadius: 14, padding: "13px 18px", fontWeight: 900, cursor: "pointer", boxShadow: "0 10px 24px rgba(200,168,92,.22)" },
  secondaryButton: { border: `1px solid ${GOLD}`, background: GOLD_SOFT, color: "#634d18", borderRadius: 12, padding: "10px 13px", fontWeight: 800, cursor: "pointer" },
  ghostButton: { border: "1px solid #ddd5e7", background: "white", color: "#554761", borderRadius: 12, padding: "10px 13px", fontWeight: 800, cursor: "pointer" },
  error: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", borderRadius: 14, padding: "13px 15px", marginTop: 16, fontWeight: 700 },
  success: { background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", borderRadius: 14, padding: "13px 15px", marginTop: 16, fontWeight: 800, cursor: "pointer" },
  stats: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, margin: "18px 0" },
  metric: { position: "relative", overflow: "hidden", background: "white", border: "1px solid #ebe5f0", borderRadius: 18, padding: "19px 20px", boxShadow: "0 10px 30px rgba(38,22,49,.055)" },
  metricAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(${GOLD},${PURPLE})` },
  metricLabel: { color: "#766c80", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: .7 },
  metricValue: { fontSize: 30, fontWeight: 900, marginTop: 7, color: DEEP },
  panel: { background: "white", border: "1px solid #e9e2ef", borderRadius: 24, padding: 22, boxShadow: "0 16px 44px rgba(45,26,58,.06)" },
  panelTop: { display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 18, marginBottom: 18 },
  sectionEyebrow: { color: "#9a7728", fontSize: 11, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase" },
  sectionTitle: { margin: "5px 0 0", fontSize: 24, letterSpacing: -.4 },
  filters: { display: "grid", gridTemplateColumns: "minmax(220px,1.8fr) minmax(160px,1fr) minmax(145px,1fr)", gap: 10 },
  input: { width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 12, border: "1px solid #dcd3e5", background: "#fdfcfe", color: DEEP, outline: "none", fontSize: 14 },
  select: { width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 12, border: "1px solid #dcd3e5", background: "#fdfcfe", color: DEEP, outline: "none", fontSize: 14 },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(315px,1fr))", gap: 14 },
  personCard: { border: "1px solid #e9e2ef", borderRadius: 18, padding: 18, background: "linear-gradient(180deg,#fff,#fdfbff)", boxShadow: "0 8px 22px rgba(45,26,58,.04)" },
  cardHeader: { display: "flex", gap: 12, alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 15, display: "grid", placeItems: "center", flexShrink: 0, fontWeight: 900, color: "#2b173f", background: "linear-gradient(135deg,#f3e6bd,#d8bd70)", border: "1px solid #e0c36f" },
  personName: { fontSize: 17, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  personJob: { fontSize: 12.5, color: "#7a6d83", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  status: { fontSize: 10, fontWeight: 900, borderRadius: 999, padding: "6px 8px", textTransform: "uppercase", letterSpacing: .4 },
  statusActive: { background: "#ecfdf5", color: "#047857" },
  statusInactive: { background: "#f3f4f6", color: "#6b7280" },
  metaGrid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, padding: "15px 0", marginTop: 10, borderTop: "1px solid #f0ebf4", borderBottom: "1px solid #f0ebf4" },
  info: { minWidth: 0 },
  infoLabel: { display: "block", fontSize: 10.5, fontWeight: 900, color: "#918498", textTransform: "uppercase", letterSpacing: .55, marginBottom: 4 },
  infoValue: { display: "block", fontSize: 13, color: "#33283a", overflowWrap: "anywhere" },
  actions: { display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" },
  empty: { padding: 34, textAlign: "center", color: "#8b7e92", background: "#fbf9fc", borderRadius: 15, border: "1px dashed #ded4e7" },
  overlay: { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(20,11,29,.62)", backdropFilter: "blur(5px)", display: "grid", placeItems: "center", padding: 16 },
  modal: { width: "min(620px,96vw)", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 24, boxShadow: "0 32px 100px rgba(15,8,22,.35)", border: "1px solid rgba(200,168,92,.55)" },
  modalWide: { width: "min(1040px,96vw)" },
  modalHeader: { position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,.97)", backdropFilter: "blur(10px)", display: "flex", justifyContent: "space-between", gap: 20, padding: "22px 24px 18px", borderBottom: "1px solid #eee8f2" },
  modalTitle: { margin: "5px 0 0", fontSize: 27, color: DEEP },
  modalSubtitle: { margin: "6px 0 0", color: "#786c81", lineHeight: 1.5, fontSize: 13 },
  closeButton: { width: 38, height: 38, borderRadius: 12, border: "1px solid #e5dce9", background: "white", fontSize: 25, cursor: "pointer", color: "#604e69" },
  formBody: { padding: 22, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 18 },
  formSection: { border: "1px solid #ece5f0", borderRadius: 17, padding: 16, background: "#fefcff" },
  formSectionTitle: { fontSize: 14, fontWeight: 900, color: PURPLE, marginBottom: 13 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 },
  field: { display: "grid", gap: 6 },
  fieldLabel: { fontSize: 11.5, fontWeight: 850, color: "#61556a" },
  modalFooter: { position: "sticky", bottom: 0, background: "rgba(255,255,255,.97)", backdropFilter: "blur(10px)", display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 22px", borderTop: "1px solid #eee8f2" },
  profileHero: { display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", padding: 22, background: "linear-gradient(135deg,#24103f,#552095)", color: "white" },
  profileAvatar: { width: 72, height: 72, display: "grid", placeItems: "center", borderRadius: 22, background: "linear-gradient(135deg,#f2ddb1,#c9a553)", color: "#2d183e", fontSize: 22, fontWeight: 950, border: "1px solid #e7ca7e" },
  profileName: { fontSize: 24, fontWeight: 950 },
  profileRole: { marginTop: 4, color: "#f0dfad", fontWeight: 800 },
  profileCode: { marginTop: 5, color: "rgba(255,255,255,.67)", fontSize: 12 },
  profileMetrics: { marginLeft: "auto", display: "flex", flexWrap: "wrap", gap: 8 },
  miniMetric: { minWidth: 105, padding: "10px 12px", borderRadius: 13, background: "rgba(255,255,255,.09)", border: "1px solid rgba(231,202,126,.28)", display: "grid", gap: 3 },
  tabs: { display: "flex", gap: 6, padding: "13px 20px 0", borderBottom: "1px solid #eee8f2", overflowX: "auto" },
  tab: { border: 0, background: "transparent", padding: "11px 15px", color: "#76697f", fontWeight: 850, cursor: "pointer", borderBottom: "3px solid transparent" },
  tabActive: { color: PURPLE, borderBottomColor: GOLD },
  profileBody: { padding: 22 },
  profileGrid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 14 },
  profileBlock: { border: "1px solid #eae3ee", borderRadius: 17, padding: 16, background: "#fefcff" },
  blockTitle: { margin: "0 0 13px", fontSize: 15, color: PURPLE },
  blockContent: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 13 },
  notes: { marginTop: 14, borderRadius: 15, background: GOLD_SOFT, border: "1px solid #ead79e", padding: 15, color: "#51411e", lineHeight: 1.55 },
  profileActions: { display: "flex", gap: 9, flexWrap: "wrap", marginTop: 17 },
  timeline: { display: "grid", gap: 0 },
  timelineRow: { position: "relative", display: "grid", gridTemplateColumns: "22px 1fr", gap: 10, padding: "12px 0", borderBottom: "1px solid #f0ebf3" },
  timelineDot: { width: 9, height: 9, borderRadius: 99, background: GOLD, boxShadow: `0 0 0 5px ${GOLD_SOFT}`, marginTop: 5 },
  timelineTitle: { fontWeight: 900, fontSize: 13.5, color: "#31253a" },
  timelineSubtitle: { marginTop: 4, color: "#706479", lineHeight: 1.5, fontSize: 13 },
  timelineMeta: { marginTop: 6, color: "#9b8fa2", fontSize: 11.5 },
};

export default PlatformUsers;
