import store from "store";
import polygonWidget from "./polygon-widget";
import "./index.scss";

const { getVertexes, setVertexes } = polygonWidget({
  initVertexes: store.get("polygon-vertexes"),
  onChanged: type => {
    if (type === "set") return;
    const vertexes = getVertexes();
    store.set("polygon-vertexes", vertexes);
    if (type !== "drag") {
      window.history.pushState({ vertexes }, null, null);
    }
  }
});

document.querySelector(".clear").addEventListener("click", () => {
  setVertexes([]);
  store.clear();
  window.history.pushState(null, null, null);
});

window.addEventListener("popstate", e => {
  setVertexes((e.state && e.state.vertexes) || []);
});

window.addEventListener("keydown", e => {
  if (e.key === "z") {
    if (
      ((e.metaKey && !e.ctrlKey && navigator.platform === "MacIntel") ||
        (e.ctrlKey &&
          !e.metaKey &&
          !e.altKey &&
          navigator.platform !== "MacIntel")) &&
      !e.altKey
    ) {
      if (e.shiftKey) {
        window.history.forward();
      } else {
        window.history.back();
      }
      e.preventDefault();
    }
  }
});
