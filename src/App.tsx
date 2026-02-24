import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Home from "@/pages/Home";

const Portfolio = lazy(() => import("@/pages/Portfolio"));
const Admin = lazy(() => import("@/pages/Admin"));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/portfolio"
        element={
          <Suspense fallback={<div className="min-h-screen" />}>
            <Portfolio />
          </Suspense>
        }
      />
      <Route
        path="/admin"
        element={
          <Suspense fallback={<div className="min-h-screen" />}>
            <Admin />
          </Suspense>
        }
      />
    </Routes>
  );
}
