import { environment as dev } from "./env-dev.js";
import { environment as prod } from "./env-prod.js";

const envType = process.env.type_deploy || "Development";
const environment = envType === "Production" ? prod : dev;

export default environment;
