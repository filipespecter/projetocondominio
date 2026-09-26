import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaArrowLeft,
  FaBuilding,
  FaUserShield,
  FaCheckCircle,
  FaShieldAlt,
} from "react-icons/fa";

import logoStar from "../assets/images/logo-star-infinity.png";
import onboardingApi from "../Services/onboardingApi.js";

/**
 * =====================================================
 * CADASTRO DE CONDOMÍNIO - INFINITYCONDO
 * =====================================================
 *
 * Tela pública responsável pelo onboarding inicial.
 *
 * REGRAS DESTA IMPLEMENTAÇÃO:
 *
 * - preservar a identidade visual atual;
 * - manter responsividade;
 * - não utilizar dados fictícios;
 * - enviar dados diretamente ao backend real;
 * - exibir o código gerado pelo backend após sucesso;
 * - nunca armazenar senha ou dados do cadastro no navegador.
 */
function CadastroCondominio() {
  const navigate = useNavigate();

  /**
   * =====================================================
   * ESTADO DO CONDOMÍNIO
   * =====================================================
   */
  const [condominium, setCondominium] =
    useState({
      name: "",
      legalName: "",
      document: "",
      email: "",
      phone: "",
      postalCode: "",
      addressLine: "",
      addressNumber: "",
      addressExtra: "",
      neighborhood: "",
      city: "",
      state: "",
    });

  /**
   * =====================================================
   * ESTADO DO RESPONSÁVEL PELO CADASTRO
   * =====================================================
   */
  const [contact, setContact] =
    useState({
      name: "",
      email: "",
      phone: "",
    });

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState(null);

  const [carregando, setCarregando] =
    useState(false);


  /**
   * =====================================================
   * HELPERS DE FORMULÁRIO
   * =====================================================
   */
  function updateCondominium(
    field,
    value
  ) {
    setCondominium(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function updateContact(
    field,
    value
  ) {
    setContact(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  /**
   * =====================================================
   * MÁSCARAS VISUAIS
   * =====================================================
   *
   * O backend também normaliza os valores.
   */
  function maskCNPJ(value) {
    const digits =
      value
        .replace(/\D/g, "")
        .slice(0, 14);

    return digits
      .replace(
        /^(\d{2})(\d)/,
        "$1.$2"
      )
      .replace(
        /^(\d{2})\.(\d{3})(\d)/,
        "$1.$2.$3"
      )
      .replace(
        /\.(\d{3})(\d)/,
        ".$1/$2"
      )
      .replace(
        /(\d{4})(\d)/,
        "$1-$2"
      );
  }

  function maskCEP(value) {
    const digits =
      value
        .replace(/\D/g, "")
        .slice(0, 8);

    return digits.replace(
      /^(\d{5})(\d)/,
      "$1-$2"
    );
  }

  function maskPhone(value) {
    const digits =
      value
        .replace(/\D/g, "")
        .slice(0, 11);

    if (digits.length <= 10) {
      return digits
        .replace(
          /^(\d{2})(\d)/,
          "($1) $2"
        )
        .replace(
          /(\d{4})(\d)/,
          "$1-$2"
        );
    }

    return digits
      .replace(
        /^(\d{2})(\d)/,
        "($1) $2"
      )
      .replace(
        /(\d{5})(\d)/,
        "$1-$2"
      );
  }

  /**
   * =====================================================
   * VALIDAÇÃO LOCAL MÍNIMA
   * =====================================================
   *
   * A validação definitiva continua no backend.
   */
  function validateLocalForm() {
    if (!condominium.name.trim()) {
      return "Informe o nome do condomínio.";
    }

    if (!contact.name.trim()) {
      return "Informe o nome do responsável pelo cadastro.";
    }

    if (!contact.email.trim()) {
      return "Informe o e-mail do responsável pelo cadastro.";
    }

    if (!contact.phone.trim()) {
      return "Informe o telefone do responsável pelo cadastro.";
    }

    return null;
  }

  /**
   * =====================================================
   * CADASTRO REAL
   * =====================================================
   */
  async function cadastrarCondominio() {
    if (carregando) {
      return;
    }

    setErro("");
    setSucesso(null);

    const localError =
      validateLocalForm();

    if (localError) {
      setErro(localError);
      return;
    }

    setCarregando(true);

    try {
      const result =
        await onboardingApi
          .registerCondominium({
            condominium,
            contact,
          });

      setSucesso(result);
    } catch (error) {
      /**
       * O api.js já normaliza mensagens e detalhes
       * do backend.
       */
      if (
        Array.isArray(
          error?.details
        ) &&
        error.details.length > 0
      ) {
        const firstDetail =
          error.details[0];

        setErro(
          firstDetail?.message ||
          error?.message ||
          "Não foi possível concluir o cadastro."
        );

        return;
      }

      setErro(
        error?.message ||
        "Não foi possível concluir o cadastro."
      );
    } finally {
      setCarregando(false);
    }
  }

  /**
   * =====================================================
   * SUCESSO DO ONBOARDING
   * =====================================================
   */
  if (sucesso) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-glow cadastro-glow-one"></div>
        <div className="cadastro-glow cadastro-glow-two"></div>
        <div className="cadastro-grid"></div>

        <main className="cadastro-success-card">
          <img
            src={logoStar}
            alt="Star Infinity Code"
            className="cadastro-logo"
          />

          <div className="success-icon">
            <FaCheckCircle />
          </div>

          <span className="profile-badge">
            Cadastro concluído
          </span>

          <h1>
            Solicitação enviada
          </h1>

          <p className="success-intro">
            Sua solicitação foi registrada e será analisada
            pela Star Infinity Code. Guarde o código abaixo
            apenas como referência do cadastro.
          </p>

          <div className="condominium-code-box">
            <span>
              Código da solicitação
            </span>

            <strong>
              {sucesso?.condominium?.code}
            </strong>
          </div>

          <div className="success-details">
            <div>
              <span>Condomínio</span>
              <strong>
                {sucesso?.condominium?.name}
              </strong>
            </div>

            <div>
              <span>Responsável</span>
              <strong>
                {sucesso?.condominium?.contactName ?? contact.name}
              </strong>
            </div>

            <div>
              <span>Status</span>
              <strong>
                {sucesso?.condominium?.status === "PENDING" ? "Aguardando análise" : sucesso?.condominium?.status}
              </strong>
            </div>
          </div>

          <div className="secure-note">
            <FaShieldAlt />

            <div>
              <strong>
                Cadastro protegido
              </strong>

              <p>
                Sua solicitação foi registrada. As credenciais
                de acesso serão liberadas somente após a análise
                da Star Infinity Code.
              </p>
            </div>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate("/")}
          >
            Entendi, voltar ao início →
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              navigate("/")
            }
          >
            Voltar para o início
          </button>
        </main>

        <style>
          {styles}
        </style>
      </div>
    );
  }

  /**
   * =====================================================
   * FORMULÁRIO
   * =====================================================
   */
  return (
    <div className="cadastro-page">
      <div className="cadastro-glow cadastro-glow-one"></div>
      <div className="cadastro-glow cadastro-glow-two"></div>
      <div className="cadastro-grid"></div>

      <main className="cadastro-shell">
        <section className="cadastro-form-side">
          <button
            className="back-button"
            onClick={() =>
              navigate("/")
            }
          >
            <FaArrowLeft />
            Voltar
          </button>

          <img
            src={logoStar}
            alt="Star Infinity Code"
            className="cadastro-logo"
          />

          <span className="profile-badge">
            Novo condomínio
          </span>

          <h1>
            Cadastre seu condomínio
          </h1>

          <p className="page-subtitle">
            Envie os dados do condomínio para análise da
            Star Infinity Code e liberação posterior do acesso.
          </p>

          <div className="section-heading">
            <div className="section-icon">
              <FaBuilding />
            </div>

            <div>
              <strong>
                Dados do condomínio
              </strong>

              <span>
                Informações principais da organização
              </span>
            </div>
          </div>

          <div className="form-grid">
            <Field
              label="Nome do condomínio *"
              value={condominium.name}
              onChange={(value) =>
                updateCondominium(
                  "name",
                  value
                )
              }
              placeholder="Ex.: Residencial Infinity"
              className="full"
            />

            <Field
              label="Razão social"
              value={
                condominium.legalName
              }
              onChange={(value) =>
                updateCondominium(
                  "legalName",
                  value
                )
              }
              placeholder="Razão social"
              className="full"
            />

            <Field
              label="CNPJ"
              value={
                condominium.document
              }
              onChange={(value) =>
                updateCondominium(
                  "document",
                  maskCNPJ(value)
                )
              }
              placeholder="00.000.000/0000-00"
            />

            <Field
              label="E-mail"
              type="email"
              value={condominium.email}
              onChange={(value) =>
                updateCondominium(
                  "email",
                  value
                )
              }
              placeholder="contato@condominio.com"
            />

            <Field
              label="Telefone"
              value={condominium.phone}
              onChange={(value) =>
                updateCondominium(
                  "phone",
                  maskPhone(value)
                )
              }
              placeholder="(81) 99999-9999"
            />

            <Field
              label="CEP"
              value={
                condominium.postalCode
              }
              onChange={(value) =>
                updateCondominium(
                  "postalCode",
                  maskCEP(value)
                )
              }
              placeholder="00000-000"
            />

            <Field
              label="Endereço"
              value={
                condominium.addressLine
              }
              onChange={(value) =>
                updateCondominium(
                  "addressLine",
                  value
                )
              }
              placeholder="Rua / Avenida"
              className="full"
            />

            <Field
              label="Número"
              value={
                condominium.addressNumber
              }
              onChange={(value) =>
                updateCondominium(
                  "addressNumber",
                  value
                )
              }
              placeholder="123"
            />

            <Field
              label="Complemento"
              value={
                condominium.addressExtra
              }
              onChange={(value) =>
                updateCondominium(
                  "addressExtra",
                  value
                )
              }
              placeholder="Bloco, referência..."
            />

            <Field
              label="Bairro"
              value={
                condominium.neighborhood
              }
              onChange={(value) =>
                updateCondominium(
                  "neighborhood",
                  value
                )
              }
              placeholder="Bairro"
            />

            <Field
              label="Cidade"
              value={condominium.city}
              onChange={(value) =>
                updateCondominium(
                  "city",
                  value
                )
              }
              placeholder="Cidade"
            />

            <div className="field">
              <label>
                UF
              </label>

              <select
                value={
                  condominium.state
                }
                onChange={(event) =>
                  updateCondominium(
                    "state",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Selecione
                </option>

                {BRAZILIAN_STATES.map(
                  (state) => (
                    <option
                      key={state}
                      value={state}
                    >
                      {state}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="section-heading contact-heading">
            <div className="section-icon">
              <FaUserShield />
            </div>

            <div>
              <strong>
                Responsável pelo cadastro
              </strong>

              <span>
                Contato responsável pela solicitação
              </span>
            </div>
          </div>

          <div className="form-grid">
            <Field
              label="Nome completo *"
              value={contact.name}
              onChange={(value) =>
                updateContact(
                  "name",
                  value
                )
              }
              placeholder="Nome do responsável"
              className="full"
            />


            <Field
              label="E-mail *"
              type="email"
              value={
                contact.email
              }
              onChange={(value) =>
                updateContact(
                  "email",
                  value
                )
              }
              placeholder="seu@email.com"
            />

            <Field
              label="Telefone *"
              value={
                contact.phone
              }
              onChange={(value) =>
                updateContact(
                  "phone",
                  maskPhone(value)
                )
              }
              placeholder="(81) 99999-9999"
              className="full"
            />

          </div>

          <p className="password-hint">
            As credenciais de acesso serão definidas pela Star Infinity Code após a aprovação do cadastro.
          </p>

          {erro && (
            <div
              className="error-box"
              role="alert"
            >
              {erro}
            </div>
          )}

          <button
            className="primary-button"
            onClick={
              cadastrarCondominio
            }
            disabled={carregando}
          >
            {carregando
              ? "Enviando solicitação..."
              : "Enviar solicitação →"}
          </button>

          <p className="footer-text">
            InfinityCondo • Star Infinity Code © 2026
          </p>
        </section>

        <aside className="cadastro-info-side">
          <div>
            <div className="info-logo-mark">
              ✦
            </div>

            <span className="system-badge">
              InfinityCondo
            </span>

            <h2>
              Seu condomínio começa aqui
            </h2>

            <p>
              O cadastro envia uma solicitação segura para
              análise da Star Infinity Code antes da
              liberação das credenciais de acesso.
            </p>
          </div>

          <div className="feature-list">
            <Feature text="Ambiente exclusivo por condomínio" />
            <Feature text="Responsável pelo cadastro protegido" />
            <Feature text="Solicitação acompanhada pela Central Star" />
            <Feature text="Período inicial de teste" />
            <Feature text="Dados registrados no PostgreSQL" />
          </div>

          <div className="secure-box">
            <FaShieldAlt />

            <div>
              <strong>
                Processo seguro
              </strong>

              <p>
                Condomínio, solicitação e auditoria
                são registrados juntos em uma única
                transação no backend.
              </p>
            </div>
          </div>
        </aside>
      </main>

      <style>
        {styles}
      </style>
    </div>
  );
}

/**
 * =====================================================
 * COMPONENTES AUXILIARES
 * =====================================================
 */
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}) {
  return (
    <div
      className={`field ${className}`}
    >
      <label>
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />
    </div>
  );
}

function Feature({ text }) {
  return (
    <div className="feature-item">
      <FaCheckCircle />

      <span>
        {text}
      </span>
    </div>
  );
}

const BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

/**
 * =====================================================
 * ESTILOS RESPONSIVOS
 * =====================================================
 *
 * Mantém a identidade visual branco/roxo atual.
 *
 * Breakpoints:
 * - desktop;
 * - tablet;
 * - celular.
 */
const styles = `
  * {
    box-sizing: border-box;
  }

  .cadastro-page {
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    padding: 32px;
    font-family: Arial, sans-serif;
    background:
      radial-gradient(circle at top left, rgb(var(--ic-primary-rgb) / 0.24), transparent 30%),
      radial-gradient(circle at bottom right, rgb(var(--ic-primary-bright-rgb) / 0.18), transparent 28%),
      linear-gradient(135deg, #ffffff, #f8f5ff 50%, #ffffff);
    color: #111827;
  }

  .cadastro-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(85px);
    pointer-events: none;
  }

  .cadastro-glow-one {
    width: 430px;
    height: 430px;
    top: -120px;
    left: -100px;
    background: rgb(var(--ic-primary-rgb) / 0.15);
  }

  .cadastro-glow-two {
    width: 380px;
    height: 380px;
    right: -90px;
    bottom: -110px;
    background: rgb(var(--ic-primary-bright-rgb) / 0.12);
  }

  .cadastro-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: .55;
    background-image:
      linear-gradient(rgb(var(--ic-primary-rgb) / .07) 1px, transparent 1px),
      linear-gradient(90deg, rgb(var(--ic-primary-rgb) / .07) 1px, transparent 1px);
    background-size: 44px 44px;
  }

  .cadastro-shell {
    position: relative;
    z-index: 2;
    width: min(1180px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(340px, .65fr);
    overflow: hidden;
    border: 1px solid rgb(var(--ic-primary-rgb) / .16);
    border-radius: 40px;
    background:
      radial-gradient(circle at top right, rgb(var(--ic-primary-bright-rgb) / .13), transparent 35%),
      linear-gradient(180deg, rgba(255,255,255,.96), rgba(251,250,255,.91));
    box-shadow:
      0 35px 90px rgba(88,28,135,.15),
      inset 0 0 0 1px rgba(255,255,255,.75);
    backdrop-filter: blur(22px);
  }

  .cadastro-form-side {
    position: relative;
    padding: 54px;
    background:
      radial-gradient(circle at top left, rgb(var(--ic-primary-rgb) / .07), transparent 30%),
      rgba(255,255,255,.95);
  }

  .back-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 30px;
    padding: 10px 14px;
    border: 1px solid var(--ic-primary-border-soft);
    border-radius: 14px;
    background: white;
    color: var(--ic-primary-strong);
    font-weight: 800;
    cursor: pointer;
  }

  .cadastro-logo {
    display: block;
    width: 235px;
    max-width: 72%;
    margin-bottom: 18px;
    filter: drop-shadow(0 0 24px rgb(var(--ic-primary-rgb) / .28));
  }

  .profile-badge,
  .system-badge {
    display: inline-block;
    width: fit-content;
    padding: 8px 13px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
  }

  .profile-badge {
    margin-bottom: 14px;
    border: 1px solid var(--ic-primary-border-soft);
    background: var(--ic-primary-soft);
    color: var(--ic-primary-strong);
  }

  .cadastro-form-side h1,
  .cadastro-success-card h1 {
    margin: 0;
    font-size: clamp(30px, 4vw, 40px);
    letter-spacing: -.7px;
  }

  .page-subtitle,
  .success-intro {
    margin: 10px 0 28px;
    color: #6b7280;
    line-height: 1.6;
  }

  .section-heading {
    display: flex;
    align-items: center;
    gap: 13px;
    margin: 30px 0 18px;
  }

  .contact-heading {
    margin-top: 38px;
  }

  .section-heading > div:last-child {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .section-heading strong {
    font-size: 16px;
  }

  .section-heading span {
    color: #6b7280;
    font-size: 12px;
  }

  .section-icon {
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--ic-primary-strong), var(--ic-primary-bright));
    color: white;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 15px;
  }

  .field.full {
    grid-column: 1 / -1;
  }

  .field label {
    display: block;
    margin-bottom: 8px;
    color: #374151;
    font-size: 13px;
    font-weight: 900;
  }

  .field input,
  .field select {
    width: 100%;
    min-width: 0;
    height: 52px;
    padding: 0 15px;
    border: 1px solid var(--ic-primary-border-soft);
    border-radius: 16px;
    outline: none;
    background: #fff;
    color: #111827;
    font-size: 15px;
    box-shadow: 0 10px 24px rgb(var(--ic-primary-rgb) / .05);
  }

  .field input:focus,
  .field select:focus {
    border-color: var(--ic-primary-light);
    box-shadow: 0 0 0 3px rgb(var(--ic-primary-rgb) / .10);
  }

  .password-wrap {
    width: 100%;
    min-width: 0;
    height: 52px;
    display: flex;
    overflow: hidden;
    border: 1px solid var(--ic-primary-border-soft);
    border-radius: 16px;
    background: white;
  }

  .password-wrap input {
    flex: 1;
    width: auto;
    min-width: 0;
    height: 100%;
    border: none;
    box-shadow: none;
  }

  .password-wrap button {
    width: 52px;
    flex: 0 0 52px;
    border: 0;
    background: transparent;
    color: var(--ic-primary-strong);
    cursor: pointer;
    font-size: 17px;
  }

  .password-hint {
    margin: 10px 0 18px;
    color: #6b7280;
    font-size: 12px;
  }

  .error-box {
    margin: 14px 0;
    padding: 13px;
    border: 1px solid #fecaca;
    border-radius: 14px;
    background: #fee2e2;
    color: #b91c1c;
    text-align: center;
    font-weight: 800;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
    min-height: 52px;
    border-radius: 16px;
    font-size: 15px;
    font-weight: 900;
    cursor: pointer;
  }

  .primary-button {
    margin-top: 8px;
    border: 0;
    background: linear-gradient(135deg, var(--ic-primary-strong), var(--ic-primary-bright));
    color: white;
    box-shadow: 0 18px 38px rgb(var(--ic-primary-rgb) / .27);
  }

  .primary-button:disabled {
    opacity: .68;
    cursor: wait;
  }

  .secondary-button {
    margin-top: 10px;
    border: 1px solid var(--ic-primary-border);
    background: white;
    color: var(--ic-primary-strong);
  }

  .footer-text {
    margin: 22px 0 0;
    color: var(--ic-primary);
    font-size: 12px;
    font-weight: 800;
  }

  .cadastro-info-side {
    padding: 50px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: white;
    background:
      radial-gradient(circle at top right, rgba(255,255,255,.20), transparent 34%),
      radial-gradient(circle at bottom left, rgb(var(--ic-primary-bright-rgb) / .24), transparent 38%),
      linear-gradient(145deg, var(--ic-primary-deepest), var(--ic-primary-deep), var(--ic-primary));
  }

  .info-logo-mark {
    width: 72px;
    height: 72px;
    display: grid;
    place-items: center;
    margin-bottom: 18px;
    border: 1px solid rgba(255,255,255,.20);
    border-radius: 24px;
    background: rgba(255,255,255,.12);
    font-size: 42px;
  }

  .system-badge {
    margin-bottom: 18px;
    border: 1px solid rgba(255,255,255,.18);
    background: rgba(255,255,255,.12);
    color: var(--ic-primary-soft-4);
  }

  .cadastro-info-side h2 {
    margin: 0;
    font-size: clamp(30px, 4vw, 38px);
    letter-spacing: -.8px;
  }

  .cadastro-info-side > div > p {
    color: rgba(255,255,255,.74);
    line-height: 1.6;
  }

  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 30px 0;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 13px;
    border: 1px solid rgba(255,255,255,.15);
    border-radius: 17px;
    background: rgba(255,255,255,.10);
    font-weight: 800;
  }

  .feature-item svg {
    color: #facc15;
    flex: 0 0 auto;
  }

  .secure-box,
  .secure-note {
    display: flex;
    align-items: flex-start;
    gap: 13px;
    padding: 18px;
    border-radius: 20px;
  }

  .secure-box {
    border: 1px solid rgba(255,255,255,.18);
    background: rgba(255,255,255,.11);
  }

  .secure-box p,
  .secure-note p {
    margin: 6px 0 0;
    line-height: 1.5;
    font-size: 13px;
  }

  .cadastro-success-card {
    position: relative;
    z-index: 2;
    width: min(620px, 100%);
    margin: 60px auto;
    padding: 48px;
    border: 1px solid rgb(var(--ic-primary-rgb) / .16);
    border-radius: 36px;
    background: rgba(255,255,255,.96);
    box-shadow: 0 34px 90px rgba(88,28,135,.16);
    text-align: center;
  }

  .cadastro-success-card .cadastro-logo {
    margin-left: auto;
    margin-right: auto;
  }

  .success-icon {
    width: 76px;
    height: 76px;
    display: grid;
    place-items: center;
    margin: 10px auto 18px;
    border-radius: 24px;
    background: linear-gradient(135deg, var(--ic-primary-strong), var(--ic-primary-bright));
    color: white;
    font-size: 35px;
  }

  .condominium-code-box {
    margin: 26px 0;
    padding: 22px;
    border: 1px solid var(--ic-primary-border-soft);
    border-radius: 20px;
    background: #faf7ff;
  }

  .condominium-code-box span {
    display: block;
    margin-bottom: 8px;
    color: #6b7280;
    font-size: 12px;
    font-weight: 800;
  }

  .condominium-code-box strong {
    display: block;
    color: var(--ic-primary-strong);
    font-size: clamp(26px, 6vw, 38px);
    letter-spacing: 2px;
  }

  .success-details {
    display: grid;
    grid-template-columns: repeat(3, minmax(0,1fr));
    gap: 10px;
    margin-bottom: 22px;
  }

  .success-details div {
    padding: 14px;
    border: 1px solid var(--ic-primary-soft-2);
    border-radius: 15px;
    background: #fff;
  }

  .success-details span,
  .success-details strong {
    display: block;
  }

  .success-details span {
    margin-bottom: 5px;
    color: #6b7280;
    font-size: 11px;
  }

  .success-details strong {
    font-size: 13px;
  }

  .secure-note {
    margin-bottom: 14px;
    border: 1px solid var(--ic-primary-border-soft);
    background: var(--ic-primary-soft-4);
    color: var(--ic-primary-deep);
    text-align: left;
  }

  @media (max-width: 960px) {
    .cadastro-page {
      padding: 22px;
    }

    .cadastro-shell {
      grid-template-columns: 1fr;
      border-radius: 32px;
    }

    .cadastro-info-side {
      min-height: auto;
    }

    .cadastro-form-side,
    .cadastro-info-side {
      padding: 38px;
    }
  }

  @media (max-width: 640px) {
    .cadastro-page {
      padding: 12px;
    }

    .cadastro-shell,
    .cadastro-success-card {
      border-radius: 24px;
    }

    .cadastro-form-side,
    .cadastro-info-side,
    .cadastro-success-card {
      padding: 24px;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .field.full {
      grid-column: auto;
    }

    .success-details {
      grid-template-columns: 1fr;
    }

    .back-button {
      margin-bottom: 24px;
    }

    .cadastro-logo {
      max-width: 82%;
    }
  }
`;

export default CadastroCondominio;
