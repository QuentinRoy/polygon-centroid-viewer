import store from "store";
import polygonWidget from "./polygon-widget";
import "./index.scss";

const { getData } = polygonWidget({
  initVertexes: store.get("polygon-vertexes"),
  onChanged: () => {
    store.set("polygon-vertexes", getData());
  }
});
