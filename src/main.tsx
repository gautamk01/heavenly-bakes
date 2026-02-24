import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@/styles/index.css";
import "@/lib/gsap"; // Register GSAP plugins once
import { LenisProvider } from "@/context/LenisContext";
import { PreloaderProvider } from "@/context/PreloaderContext";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <PreloaderProvider>
        <LenisProvider>
          <App />
        </LenisProvider>
      </PreloaderProvider>
    </BrowserRouter>
  </StrictMode>
);
