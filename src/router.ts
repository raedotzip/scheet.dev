import Handlebars from "handlebars";
import home from "./templates/pages/home.hbs?raw";
// import about from "./templates/about.hbs?raw";

const routes: Record<string, string> = {
  "/": home,
  // "/about": about
};

export function renderRoute(path: string) {
  const template = routes[path] || home;
  const compiled = Handlebars.compile(template);

  document.getElementById("app")!.innerHTML = compiled({});
}