import Handlebars from "handlebars";

const modules = import.meta.glob("./*.hbs", {
  eager: true,
  query: "?raw",
  import: "default",
});

for (const path in modules) {
  const name = path.replace("./", "").replace(".hbs", "");
  Handlebars.registerPartial(name, modules[path] as string);
}