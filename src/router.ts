import Handlebars from "handlebars";
import "./templates/partials/index";

import homeData from "./data/home.json";
import aboutData from "./data/about.json";
import siteData from "./data/site.json";

const modules = import.meta.glob("./templates/pages/*.hbs", {
  eager: true,
  query: "?raw",
  import: "default",
});

const templates: Record<string, Handlebars.TemplateDelegate> = {};
for (const path in modules) {
  const name = path.replace("./templates/pages/", "").replace(".hbs", "");
  templates[name] = Handlebars.compile(modules[path] as string);
}

const routes: Record<string, { key: string; data: unknown }> = {
  "/":      { key: "home",  data: homeData },
  "/about": { key: "about", data: aboutData },
};

export function renderNav() {
  const navTemplate = Handlebars.compile(Handlebars.partials["nav"] as string);
  const mobileTemplate = Handlebars.compile(Handlebars.partials["mobile-nav"] as string);
  document.getElementById("nav")!.innerHTML = navTemplate(siteData);
  document.getElementById("mobile-nav")!.innerHTML = mobileTemplate(siteData);
}

export function renderRoute(path: string) {
  const route = routes[path] ?? routes["/"];
  const template = templates[route.key] ?? templates["home"];
  document.getElementById("app")!.innerHTML = template(route.data);
}