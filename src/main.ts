import "./styles/global.css";
import "./styles/nav.css";
import "./styles/card.css";
import { initBackground } from "./webgl/background.ts";
import { renderNav, renderRoute } from "./router";

initBackground();
renderNav();

function router() {
  renderRoute(window.location.pathname);
}

window.addEventListener("popstate", router);

document.addEventListener("click", (e) => {
  const target = e.target as HTMLAnchorElement;
  if (target.matches("[data-link]")) {
    e.preventDefault();
    history.pushState(null, "", target.href);
    router();
  }
});

router();