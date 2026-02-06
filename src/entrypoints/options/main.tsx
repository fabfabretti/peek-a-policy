import React from "react";
import ReactDOM from "react-dom/client";

import "../popup/style.css";
import "./style.css";
import { HeroUIProvider } from "@heroui/system";
import { HashRouter, Route, Routes, Navigate } from "react-router";

import SettingsPage from "./SettingsPage.tsx";
import { initDefaultSettingsIfNeeded } from "@/utils/initDefaultSettings";

await initDefaultSettingsIfNeeded();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <HeroUIProvider>
        <Routes>
          {/* options: pagina principale */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* default + catch-all -> settings */}
          <Route path="/" element={<Navigate to="/settings" replace />} />
          <Route path="*" element={<Navigate to="/settings" replace />} />
        </Routes>
      </HeroUIProvider>
    </HashRouter>
  </React.StrictMode>,
);
