import { createBrowserRouter, type RouteObject } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { AvailableTools } from "./pages/AvailableTools";
import { TaskManager } from "./pages/TaskManager";
import { ServerDashboard } from "./pages/ServerDashboard";
import { Settings } from "./pages/Settings";
import { DesignSystem } from "./pages/DesignSystem";
import devToolManager from "./core/DevToolManager";


function generateToolRoutes() {
  const devTools = devToolManager.getAllTools();
  console.log("Generating routes for tools",devTools.length)
  return devTools.map((it) => ({ path: "tool/" + it.id, Component: it.tool }))
}

export function generateRouter() {
  const toolRoutes = generateToolRoutes();
  return createBrowserRouter([
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

}