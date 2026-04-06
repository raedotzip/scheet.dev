import Handlebars from "handlebars";

import siteData   from "./data/site.json";
import homeData   from "./data/pages/home.json";

const partialModules = import.meta.glob("./views/partials/**/*.hbs", {
  eager: true,
  query: "?raw",
  import: "default",
});

for (const path in partialModules) {
  const name = path.replace("./views/partials/", "").replace(".hbs", "");
  Handlebars.registerPartial(name, partialModules[path] as string);
}

const templateModules = import.meta.glob("./views/templates/*.hbs", {
  eager: true,
  query: "?raw",
  import: "default",
});

const templates: Record<string, Handlebars.TemplateDelegate> = {};
for (const path in templateModules) {
  const name = path.replace("./views/templates/", "").replace(".hbs", "");
  templates[name] = Handlebars.compile(templateModules[path] as string);
}

const routes: Record<string, { key: string; data: unknown }> = {
  "/":       { key: "home",   data: homeData   },
};

export function renderNav() {
  const navTemplate = Handlebars.compile(Handlebars.partials["nav/nav"] as string);
  const mobileTemplate = Handlebars.compile(Handlebars.partials["nav/mobile-nav"] as string);
  document.getElementById("nav")!.innerHTML = navTemplate(siteData);
  document.getElementById("mobile-nav")!.innerHTML = mobileTemplate(siteData);
}

export function renderRoute(path: string) {
  if (path === "/resume") { window.location.href = "/RaeganScheetResume.pdf"; return; }
  const route = routes[path] ?? routes["/"];
  const template = templates[route.key] ?? templates["home"];
  document.getElementById("app")!.innerHTML = template(route.data);
}