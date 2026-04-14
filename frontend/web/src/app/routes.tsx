import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { PluginMarketplace } from "./pages/PluginMarketplace";
import { PluginDetails } from "./pages/PluginDetails";
import { ToolExecution } from "./pages/ToolExecution";
import { TaskManager } from "./pages/TaskManager";
import { ServerDashboard } from "./pages/ServerDashboard";
import { Settings } from "./pages/Settings";
import { DesignSystem } from "./pages/DesignSystem";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "marketplace", Component: PluginMarketplace },
      { path: "plugin/:id", Component: PluginDetails },
      { path: "tool/:toolId", Component: ToolExecution },
      { path: "tasks", Component: TaskManager },
      { path: "server", Component: ServerDashboard },
      { path: "settings", Component: Settings },
      { path: "design-system", Component: DesignSystem },
    ],
  },
]);
