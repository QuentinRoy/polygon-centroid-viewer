import store from "store/dist/store.modern";
import { csvParse } from "d3-dsv";
import swal from "sweetalert2";
import polygonWidget from "./polygon-widget";
import { downloadTextFile } from "./utils";
import "./index.scss";

const STORE_VERTEX_KEY = "polygon-vertexes";

const initVertexes = store.get(STORE_VERTEX_KEY);

const { getVertexes, setVertexes } = polygonWidget({
  // Init the vertexes using the local storage.
  initVertexes,
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

if (initVertexes) {
  window.history.replaceState({ vertexes: initVertexes }, null, null);
}

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

const controls = document.querySelector(".controls");
const HIDDEN_IMPORT_INPUT_CLASS = "hidden-import-input";

controls.innerHTML += `
  <input
    class="${HIDDEN_IMPORT_INPUT_CLASS}"
    type="file"
    name="import"
    accept=".csv,text/csv"
    style="display:none;"
  />
`;

controls.querySelector(".clear").addEventListener("click", () => {
  setVertexes([]);
  store.remove(STORE_VERTEX_KEY);
  window.history.pushState(null, null, null);
});

controls.querySelector(".save").addEventListener("click", () => {
  const csvContent = getVertexes()
    .map(v => v.join(","))
    .join("\n");
  downloadTextFile(`x,y\n${csvContent}`, "polygon.csv");
});

const hiddenImportInput = controls.querySelector(
  `.${HIDDEN_IMPORT_INPUT_CLASS}`
);

controls.querySelector(".load").addEventListener("click", () => {
  hiddenImportInput.click();
});

hiddenImportInput.addEventListener("change", () => {
  if (hiddenImportInput.files.length === 0) return;
  new Promise(resolve => {
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
        resolve(reader.result);
      },
      { once: true }
    );
    reader.readAsText(hiddenImportInput.files[0]);
  })
    .then(file => {
      const vertexes = csvParse(file).map(({ x, y }) => {
        const nbX = +x;
        const nbY = +y;
        if (Number.isNaN(nbX) || Number.isNaN(nbY)) {
          throw new Error(
            "Invalid polygon format: file must be a csv file of vertexes with an x and a y column, both containing numbers only."
          );
        }
        return [+x, +y];
      });
      setVertexes(vertexes || []);
      // Set up local storage (for refresh and next page load).
      store.set(STORE_VERTEX_KEY, vertexes);
      // Set up history.
      window.history.pushState({ vertexes }, null, null);
    })
    .catch(e => {
      swal({
        title: "Load Error",
        text: e.message,
        type: "error",
        showConfirmButton: false
      });
    })
    .then(() => {
      hiddenImportInput.value = "";
    });
});
