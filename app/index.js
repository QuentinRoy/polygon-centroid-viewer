import store from "store";
import polygonWidget from "./polygon-widget";
import "./index.scss";

const { getVertexes, setVertexes } = polygonWidget({
  initVertexes: store.get("polygon-vertexes"),
  onChanged: () => {
    store.set("polygon-vertexes", getVertexes());
  }
});

document
  .querySelector(".clear")
  .addEventListener("click", () => setVertexes([]));
