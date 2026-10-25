import { useId } from "react";
export default function ContextHelp({
  label = "Ajuda",
  children
}) {
  const id = useId();
  return <details className="ic-context-help"><summary aria-controls={id}>{label} ⓘ</summary><div id={id}>{children}</div></details>;
}
