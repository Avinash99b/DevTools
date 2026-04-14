import { createBrowserRouter, type RouteObject } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { AvailableTools } from "./pages/AvailableTools";
import { TaskManager } from "./pages/TaskManager";
import { ServerDashboard } from "./pages/ServerDashboard";
import { Settings } from "./pages/Settings";
import { DesignSystem } from "./pages/DesignSystem";
import devToolManager from "./core/DevToolManager";

const devTools = devToolManager.getAllTools();

const toolRoutes:RouteObject[] = devTools.map((it)=>({path:"tool/"+it.id, Component: it.tool}))

export const router = createBrowserRouter([
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
  },
]);
