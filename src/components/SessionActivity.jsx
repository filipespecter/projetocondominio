import SearchRecord from "./SearchRecord.jsx";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api, { clearTokens } from "../Services/api.js";
export default function SessionActivity() {
  const {
    pathname
  } = useLocation();
  const active = /^\/(dashboard|platform)(\/|$)/.test(pathname);
  const [minutes, setMinutes] = useState(30);
  useEffect(() => {
    if (!active) return;
    let mounted = true,
      deadline = Infinity,
      deadlineReason="inatividade",lastSent = 0,
      busy = false;
    const expired = (reason=deadlineReason) => {
      clearTokens();
      const portal = pathname.startsWith("/platform") ? "platform" : pathname.includes("/porteiro") ? "porteiro" : pathname.includes("/morador") ? "morador" : "sindico";
      window.location.assign(`/login/${portal}?motivo=${reason}`);
    };
    const accept = r => {
      if (mounted) {
        setMinutes(r.data.minutes);
        deadline = Date.parse(r.data.expiresAt);deadlineReason=r.data.expirationReason||"inatividade";
      }
    };
    api.get("/v1/session").then(accept).catch(e => {
      if (e.status === 401) expired(e.details?.code==="IDLE_TIMEOUT"?"inatividade":e.details?.code==="ABSOLUTE_EXPIRY"?"expiracao":"encerrada");
    });
    const interact = async e => {
      if (!e.isTrusted || document.visibilityState !== "visible" || busy) return;
      if (Date.now() >= deadline) return expired();
      if (Date.now() - lastSent < 30000) return;
      busy = true;
      lastSent = Date.now();
      try {
        accept(await api.post("/v1/session/activity", {}));
      } catch (e) {
        if (e.status === 401) expired(e.details?.code==="IDLE_TIMEOUT"?"inatividade":e.details?.code==="ABSOLUTE_EXPIRY"?"expiracao":"encerrada");
      } finally {
        busy = false;
      }
    };
    for (const event of ["pointerdown", "keydown", "touchstart"]) window.addEventListener(event, interact, {
      passive: true
    });
    const timer = setInterval(() => {
      if (Date.now() >= deadline) expired();
    }, 1000);
    return () => {
      mounted = false;
      clearInterval(timer);
      for (const event of ["pointerdown", "keydown", "touchstart"]) window.removeEventListener(event, interact);
    };
  }, [active, pathname, minutes]);
  return active ? <SearchRecord /> : null;
}
