import { cloneElement, useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export default function ResponsiveNavigation({ children }) {
  const { pathname } = useLocation();
  const [navigation, setNavigation] = useState({ open: false, pathname });
  const open = navigation.open && navigation.pathname === pathname;
  const id = useId();
  const button = useRef(null);
  const close = () => {
    setNavigation({ open: false, pathname });
    button.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const onKey = event => {
      if (event.key === "Escape") {
        setNavigation({ open: false, pathname });
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pathname]);
  return (
    <div className="ic-navigation">
      <div className="ic-mobile-bar">
        <button ref={button} type="button" aria-expanded={open} aria-controls={id}
          onClick={() => setNavigation({ open: !open, pathname })}>
          {open ? "Fechar menu" : "☰ Menu"}
        </button>
        <span>InfinityCondo</span>
      </div>
      {open && <button type="button" className="ic-navigation-backdrop" aria-label="Fechar menu" onClick={close} />}
      {cloneElement(children, {
        id,
        className: `${children.props.className ?? ""} ic-navigation-drawer${open ? " is-open" : ""}`,
        onClickCapture: event => {
          children.props.onClickCapture?.(event);
          if (event.target.closest("a")) setNavigation({ open: false, pathname });
        },
      })}
    </div>
  );
}
