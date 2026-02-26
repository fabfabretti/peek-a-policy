import React from "react";
import ReactDOM from "react-dom/client";
import HomePage from "./pages/home/HomePage.tsx";
import ResultPage from "./pages/results/ResultPage.tsx";
import SettingsPage from "./pages/settings/SettingsPage.tsx";

import "./style.css";
import { HeroUIProvider } from "@heroui/system";
import { HashRouter, Route, Routes } from "react-router";
import { initDefaultSettingsIfNeeded } from "@/utils/initDefaultSettings";

async function bootstrap() {
  await initDefaultSettingsIfNeeded();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <HashRouter>
        <HeroUIProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/results" element={<ResultPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </HeroUIProvider>
      </HashRouter>
    </React.StrictMode>,
  );
}

bootstrap();
