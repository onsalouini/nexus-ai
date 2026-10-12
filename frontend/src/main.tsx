import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./i18n";
import App from "./App";
import { AppWrapper } from "./components/common/PageMeta";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper>
      <App />
    </AppWrapper>
  </StrictMode>
);