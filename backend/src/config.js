import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

if (!process.env.FRONTEND_URL && process.env.RENDER_EXTERNAL_URL) {
  process.env.FRONTEND_URL = process.env.RENDER_EXTERNAL_URL;
}
