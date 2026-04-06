import Handlebars from "handlebars";

const modules = import.meta.glob("./**/*.hbs", {
  eager: true,
  query: "?raw",
  import: "default",
});

const templates: Record<string, Handlebars.TemplateDelegate> = {};

for (const path in modules) {
  if (path.includes("/partials/")) {
    const name = path.replace(/.*\/partials\//, "").replace(".hbs", "");
    Handlebars.registerPartial(name, modules[path] as string);
  } else {
    const name = path.replace("./", "").replace(".hbs", "").replace(/\//g, "-");
    templates[name] = Handlebars.compile(modules[path] as string);
  }
}

export { templates };