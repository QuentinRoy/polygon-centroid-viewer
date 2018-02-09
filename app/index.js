import store from "store";
import polygonWidget from "./polygon-widget";
import "./index.scss";

const STORE_VERTEX_KEY = "polygon-vertexes";

const { getVertexes, setVertexes } = polygonWidget({
  // Init the vertexes using the local storage.
  initVertexes: store.get(STORE_VERTEX_KEY),
  // Handle vertexes change.
  onChanged: type => {
    if (type === "set") return;
    const vertexes = getVertexes();
    // Set up local storage (for refresh and next page load).
    store.set(STORE_VERTEX_KEY, vertexes);
    // Set up history.
    if (type !== "drag") {
      window.history.pushState({ vertexes }, null, null);
    }
  }
});

// Handle history navigation.
window.addEventListener("popstate", e => {
  const vertexes = e.state && e.state.vertexes;
  setVertexes(vertexes || []);
  if (!vertexes) {
    store.remove(STORE_VERTEX_KEY);
  } else {
    store.set(STORE_VERTEX_KEY, vertexes);
  }
});

// Map undo/redo keyboard shortcuts to history.
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

document.querySelector(".clear").addEventListener("click", () => {
  setVertexes([]);
  store.remove(STORE_VERTEX_KEY);
  window.history.pushState(null, null, null);
});
