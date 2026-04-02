import Handlebars from "handlebars";

const modules = import.meta.glob("./pages/*.hbs", {
  eager: true,
  query: '?raw',
  import: 'default',
});

const templates: Record<string, Handlebars.TemplateDelegate> = {};

for (const path in modules) {
  const name = path.replace("./pages/", "").replace(".hbs", "");
  templates[name] = Handlebars.compile(modules[path] as string);
}

export { templates };