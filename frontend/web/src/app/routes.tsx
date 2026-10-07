/* eslint-disable react-refresh/only-export-components -- router factory file mixes components and a factory by design */
import { createHashRouter, Outlet, useNavigate, useLocation } from "react-router";
import { useEffect } from "react";
import type { ComponentType } from "react";
import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { AvailableTools } from "./pages/AvailableTools";
import { TaskManager } from "./pages/TaskManager";
import { ServerDashboard } from "./pages/ServerDashboard";
import { Settings } from "./pages/Settings";
import { DesignSystem } from "./pages/DesignSystem";
import { Login } from "./pages/Login";
import devToolManager from "./core/DevToolManager";
import { api } from "./core/api";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { markToolUsed } from "./core/recentTools";

/** Wraps a tool route: records usage and isolates render errors to this route. */
function ToolRoute({ Component, toolId }: { Component: ComponentType; toolId: string }) {
  useEffect(() => { markToolUsed(toolId); }, [toolId]);
  return (
    <ErrorBoundary resetKey={toolId}>
      <Component />
    </ErrorBoundary>
  );
}

function generateToolRoutes() {
  const devTools = devToolManager.getAllTools();
  return devTools.map((it) => ({
    path: "tool/" + it.id,
    Component: () => <ToolRoute Component={it.tool} toolId={it.id} />,
  }));
}

function AuthWrapper() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && location.pathname !== "/login") {
          navigate("/login");
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [navigate, location.pathname]);

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Outlet />
    </ErrorBoundary>
  );
}

export function generateRouter() {
  const toolRoutes = generateToolRoutes();
  return createHashRouter([
    {
      path: "/login",
      Component: Login,
    },
    {
      path: "/",
      Component: AuthWrapper,
      children: [
        {
          path: "/",
          Component: RootLayout,
          children: [
            { index: true, Component: HomePage },
            { path: "available-tools", Component: AvailableTools },
            { path: "available-tools/:categoryName", Component: AvailableTools },
            { path: "tasks", Component: TaskManager },
            { path: "server", Component: ServerDashboard },
            { path: "settings", Component: Settings },
            { path: "design-system", Component: DesignSystem },
            ...toolRoutes
          ],
        }
      ]
    },
  ]);
}