import { Buffer } from "buffer";
globalThis.Buffer = Buffer;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { Dashboard } from "./pages/dashboard.tsx";

import { ThemeProvider } from "./components/theme-provider/theme-provider.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <div className="p-3 h-svh">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  </StrictMode>
);
