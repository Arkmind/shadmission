import { Buffer } from "buffer";
(globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { Dashboard } from "./pages/dashboard.tsx";
import { GraphPage } from "./pages/graph.tsx";
import { Settings } from "./pages/settings.tsx";

import { Navbar } from "./components/navbar";
import { withMeta } from "./components/route.tsx";
import { ThemeProvider } from "./components/theme-provider/theme-provider.tsx";
import { Card, CardContent } from "./components/ui/card.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/transmission/web">
      <ThemeProvider>
        <div className="p-3 flex w-full xl:h-svh space-x-3 relative">
          <Card className="rounded-xl p-0 overflow-hidden py-0 sticky top-3 h-[calc(100svh-24px)]">
            <CardContent className="h-full p-1">
              <Navbar />
            </CardContent>
          </Card>
          <div className="flex-1">
            <Routes>
              <Route
                path="/"
                element={withMeta(<Dashboard />, {
                  title: "Shadmission - Dashboard",
                  description:
                    "Overview your transmission client, torrents, stats and more.",
                })}
              />
              <Route
                path="/graph"
                element={withMeta(<GraphPage />, {
                  title: "Shadmission - Graphs",
                  description:
                    "View detailed upload and download graphs over time.",
                })}
              />
              <Route
                path="/settings"
                element={withMeta(<Settings />, {
                  title: "Shadmission - Settings",
                  description:
                    "Configure your transmission client and application settings.",
                })}
              />
            </Routes>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
