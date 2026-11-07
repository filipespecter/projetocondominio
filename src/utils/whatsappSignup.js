const origins = new Set(["https://www.facebook.com", "https://web.facebook.com"]);
const validId = value => /^[0-9]{1,30}$/.test(String(value || ""));
let sdkPromise;
let sdkIdentity;
let authorizationInProgress = false;

function validateConfig(config) {
  if (window.location.protocol !== "https:") {
    throw new Error("Abra o InfinityCondo pelo endereço HTTPS para conectar o WhatsApp.");
  }
  if (!validId(config?.appId) || !validId(config?.configId) || !/^v\d{1,3}\.0$/.test(config?.version || "")) {
    throw new Error("A conexão do WhatsApp precisa ser configurada pela plataforma.");
  }
}

export function loadMetaSDK(config) {
  try { validateConfig(config); } catch (error) { return Promise.reject(error); }
  const identity = `${config.appId}:${config.version}`;
  if (sdkPromise && sdkIdentity !== identity) {
    return Promise.reject(new Error("A configuração mudou. Atualize a página antes de conectar."));
  }
  if (!sdkPromise) {
    sdkIdentity = identity;
    sdkPromise = new Promise((resolve, reject) => {
      const init = () => {
        try {
          window.FB.init({ appId: config.appId, version: config.version, xfbml: false, cookie: false });
          resolve();
        } catch { reject(new Error("Não foi possível iniciar a autorização da Meta.")); }
      };
      if (window.FB) { init(); return; }
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/pt_BR/sdk.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error("A Meta não carregou. Verifique a conexão ou bloqueadores do navegador."));
      }, 20000);
      script.onload = () => {
        clearTimeout(timeout);
        if (window.FB) init();
        else { script.remove(); reject(new Error("SDK da Meta indisponível.")); }
      };
      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        reject(new Error("Não foi possível carregar a Meta."));
      };
      document.head.append(script);
    }).catch(error => { sdkPromise = null; sdkIdentity = null; throw error; });
  }
  return sdkPromise;
}

// Continua síncrono no clique: não mover FB.login para depois de um await.
export function authorizeMeta(config) {
  return new Promise((resolve, reject) => {
    try { validateConfig(config); } catch (error) { reject(error); return; }
    if (!/^[a-f0-9]{64}$/.test(config?.state || "") || !window.FB?.login) {
      reject(new Error("Prepare uma nova conexão antes de autorizar na Meta."));
      return;
    }
    if (authorizationInProgress) {
      reject(new Error("Já existe uma autorização em andamento. Conclua ou aguarde o encerramento."));
      return;
    }
    authorizationInProgress = true;
    let code, session, settled = false;
    const cleanup = () => {
      clearTimeout(timeout);
      window.removeEventListener("message", listener);
      authorizationInProgress = false;
    };
    const fail = message => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(message));
    };
    const finish = () => {
      if (settled || !code || !session) return;
      settled = true;
      cleanup();
      resolve({ code, state: config.state, wabaId: session.waba_id,
        ...(session.phone_number_id ? { phoneNumberId: session.phone_number_id } : {}), event: session.event });
    };
    function listener(event) {
      if (settled || !origins.has(event.origin)) return;
      let data;
      try { data = typeof event.data === "string" ? JSON.parse(event.data) : event.data; } catch { return; }
      if (data?.type !== "WA_EMBEDDED_SIGNUP") return;
      if (["CANCEL", "ERROR"].includes(data.event)) {
        fail("A autorização não foi concluída na Meta. Prepare uma nova conexão para tentar novamente.");
        return;
      }
      if (data.event === "FINISH_ONLY_WABA") {
        fail("A conta foi autorizada sem um número. Refaça a conexão e conclua a seleção do número comercial.");
        return;
      }
      if (["FINISH", "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING"].includes(data.event)) {
        const details = data.data;
        if (!validId(details?.waba_id) ||
            (details?.phone_number_id != null && !validId(details.phone_number_id))) {
          fail("A Meta não retornou uma conta e um número válidos. Refaça a autorização.");
          return;
        }
        session = { waba_id: String(details.waba_id),
          ...(details.phone_number_id != null ? { phone_number_id: String(details.phone_number_id) } : {}), event: data.event };
        finish();
      }
    }
    const timeout = setTimeout(() => fail("A conexão expirou. Prepare uma nova conexão e tente novamente."), 180000);
    window.addEventListener("message", listener);
    try {
      window.FB.login(response => {
        if (settled) return;
        code = response?.authResponse?.code;
        if (typeof code !== "string" || code.length < 5 || code.length > 4096) {
          fail("Autorização cancelada ou popup bloqueado. Permita a abertura da Meta e tente novamente.");
          return;
        }
        finish();
      }, {
        config_id: config.configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "whatsapp_business_app_onboarding",
          sessionInfoVersion: "3",
        },
      });
    } catch { fail("Não foi possível abrir a autorização da Meta."); }
  });
}
