import { Buffer } from "buffer";
(globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { Dashboard } from "./pages/dashboard.tsx";
import { GraphPage } from "./pages/graph.tsx";
import { Settings } from "./pages/settings.tsx";

import { Navbar } from "./components/navbar";
import { ThemeProvider } from "./components/theme-provider/theme-provider.tsx";
import { Card, CardContent } from "./components/ui/card.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/transmission/web">
      <ThemeProvider>
        <div className="p-3 flex w-full h-svh space-x-3">
          <Card className="rounded-xl p-0 overflow-hidden py-0">
            <CardContent className="h-full p-1">
              <Navbar />
            </CardContent>
          </Card>
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
