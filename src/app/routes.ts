import { createBrowserRouter } from "react-router";
import { Login } from "./components/Login";
import { ModuleSelection } from "./components/ModuleSelection";
import { Catalog } from "./components/Catalog";
import { WaiterMap } from "./components/WaiterMap";
import { WaiterMapFinal } from "./components/WaiterMapFinal";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/modules",
    Component: ModuleSelection,
  },
  {
    path: "/catalog",
    Component: Catalog,
  },
  {
    path: "/waiter-map",
    Component: WaiterMap,
  },
  {
    path: "/waiter-map-final",
    Component: WaiterMapFinal,
  }
]);
