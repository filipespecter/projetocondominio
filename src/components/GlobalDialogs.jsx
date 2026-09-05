import { useEffect, useState } from "react";

let confirmResolver = null;
let promptResolver = null;

export function notify(message, type = "info") {
  window.dispatchEvent(new CustomEvent("infinity:notify", { detail: { message: String(message ?? ""), type } }));
}

export function confirmDialog(message, options = {}) {
  return new Promise((resolve) => {
    confirmResolver = resolve;
    window.dispatchEvent(new CustomEvent("infinity:confirm", { detail: { message: String(message ?? ""), title: options.title ?? "Confirmação", danger: Boolean(options.danger) } }));
  });
}

export function promptDialog(message, options = {}) {
  return new Promise((resolve) => {
    promptResolver = resolve;
    window.dispatchEvent(new CustomEvent("infinity:prompt", { detail: { message: String(message ?? ""), title: options.title ?? "Informe os dados", placeholder: options.placeholder ?? "", initialValue: options.initialValue ?? "" } }));
  });
}

export default function GlobalDialogs() {
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [promptState, setPromptState] = useState(null);
  const [promptValue, setPromptValue] = useState("");

  useEffect(() => {
    const onNotify = (e) => {
      setToast(e.detail);
      window.clearTimeout(window.__infinityToastTimer);
      window.__infinityToastTimer = window.setTimeout(() => setToast(null), 3500);
    };
    const onConfirm = (e) => setConfirmState(e.detail);
    const onPrompt = (e) => { setPromptState(e.detail); setPromptValue(e.detail?.initialValue ?? ""); };
    window.addEventListener("infinity:notify", onNotify);
    window.addEventListener("infinity:confirm", onConfirm);
    window.addEventListener("infinity:prompt", onPrompt);

    const originalAlert = window.alert;
    window.alert = (message) => notify(message, "info");

    return () => {
      window.removeEventListener("infinity:notify", onNotify);
      window.removeEventListener("infinity:confirm", onConfirm);
      window.removeEventListener("infinity:prompt", onPrompt);
      window.alert = originalAlert;
    };
  }, []);

  function answerConfirm(value) {
    const resolver = confirmResolver; confirmResolver = null; setConfirmState(null); resolver?.(value);
  }
  function answerPrompt(value) {
    const resolver = promptResolver; promptResolver = null; setPromptState(null); resolver?.(value);
  }

  return <>
    {toast && <div style={{...styles.toast, ...(toast.type === "error" ? styles.toastError : toast.type === "success" ? styles.toastSuccess : {})}}>{toast.message}</div>}
    {confirmState && <div style={styles.overlay} onMouseDown={(e)=>e.target===e.currentTarget&&answerConfirm(false)}><div style={styles.modal}><div style={styles.icon}>{confirmState.danger?"!":"?"}</div><h2 style={styles.title}>{confirmState.title}</h2><p style={styles.text}>{confirmState.message}</p><div style={styles.actions}><button style={styles.cancel} onClick={()=>answerConfirm(false)}>Cancelar</button><button style={confirmState.danger?styles.danger:styles.primary} onClick={()=>answerConfirm(true)}>Confirmar</button></div></div></div>}
    {promptState && <div style={styles.overlay} onMouseDown={(e)=>e.target===e.currentTarget&&answerPrompt(null)}><div style={styles.modal}><h2 style={styles.title}>{promptState.title}</h2><p style={styles.text}>{promptState.message}</p><input autoFocus style={styles.input} placeholder={promptState.placeholder} value={promptValue} onChange={(e)=>setPromptValue(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter")answerPrompt(promptValue);}}/><div style={styles.actions}><button style={styles.cancel} onClick={()=>answerPrompt(null)}>Cancelar</button><button style={styles.primary} onClick={()=>answerPrompt(promptValue)}>Continuar</button></div></div></div>}
  </>;
}

const styles={overlay:{position:"fixed",inset:0,zIndex:20000,background:"rgba(31,15,43,.58)",display:"grid",placeItems:"center",padding:18,backdropFilter:"blur(4px)"},modal:{width:"min(440px,100%)",background:"#fff",borderRadius:18,padding:22,boxShadow:"0 30px 80px rgba(31,15,43,.32)",border:"1px solid #eee6f6"},icon:{width:42,height:42,borderRadius:14,display:"grid",placeItems:"center",fontWeight:900,fontSize:22,color:"#6d28d9",background:"#f3e8ff",marginBottom:12},title:{margin:"0 0 8px",color:"#2f1d3a",fontSize:20},text:{margin:"0 0 16px",color:"#695b73",lineHeight:1.55,fontSize:13},actions:{display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap"},cancel:{border:"1px solid #ded5e8",background:"#fff",color:"#5d5066",borderRadius:10,padding:"10px 14px",fontWeight:800,cursor:"pointer"},primary:{border:0,background:"linear-gradient(135deg,#5b21b6,#7c3aed)",color:"#fff",borderRadius:10,padding:"10px 14px",fontWeight:900,cursor:"pointer"},danger:{border:0,background:"linear-gradient(135deg,#b91c1c,#dc2626)",color:"#fff",borderRadius:10,padding:"10px 14px",fontWeight:900,cursor:"pointer"},input:{width:"100%",boxSizing:"border-box",border:"1px solid #dcd2e7",borderRadius:10,minHeight:42,padding:"0 11px",marginBottom:15,outline:"none"},toast:{position:"fixed",right:18,bottom:"calc(18px + env(safe-area-inset-bottom))",zIndex:21000,maxWidth:"min(420px,calc(100vw - 36px))",background:"#2f1d3a",color:"white",borderRadius:12,padding:"12px 14px",boxShadow:"0 16px 40px rgba(31,15,43,.28)",fontSize:13,fontWeight:700},toastError:{background:"#991b1b"},toastSuccess:{background:"#166534"}};
