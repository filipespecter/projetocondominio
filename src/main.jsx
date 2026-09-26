import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import GlobalDialogs from "./components/GlobalDialogs.jsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <App />
    <GlobalDialogs />
  </>
);
