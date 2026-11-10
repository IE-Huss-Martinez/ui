import "@hussmartinez/ui/styles.css";
import { hydrateRoot } from "react-dom/client";
import { App } from "./App.js";

const root = document.getElementById("root");
if (!root) {
  throw new Error("The page has no #root element.");
}
hydrateRoot(root, <App />);
