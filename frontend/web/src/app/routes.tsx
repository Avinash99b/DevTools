import { createHashRouter, Outlet, useNavigate, useLocation } from "react-router";
import { useEffect } from "react";
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

function generateToolRoutes() {
  const devTools = devToolManager.getAllTools();
  return devTools.map((it) => ({ path: "tool/" + it.id, Component: it.tool }))
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

  return <Outlet />;
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
