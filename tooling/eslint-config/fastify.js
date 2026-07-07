import globals from "globals";
import { createBaseConfig } from "./base.js";

export default createBaseConfig({
  files: ["**/*.ts"],
  globals: globals.node
});
