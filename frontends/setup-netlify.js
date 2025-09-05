// setup-netlify.js
import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env");
const apiPath = path.join(process.cwd(), "src", "api.js");
const redirectsPath = path.join(process.cwd(), "public", "_redirects");

// 1. .env
fs.writeFileSync(envPath, "REACT_APP_API_URL=https://ecommerce-fullstack-abdou.onrender.com\n");
console.log("✅ .env mis à jour");

// 2. api.js
if (!fs.existsSync(apiPath)) {
  const apiContent = `
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true
});

export default api;
`;
  fs.writeFileSync(apiPath, apiContent.trim() + "\n");
  console.log("✅ src/api.js créé");
} else {
  console.log("ℹ️ src/api.js existe déjà — vérifie qu'il utilise process.env.REACT_APP_API_URL");
}

// 3. _redirects
fs.mkdirSync(path.dirname(redirectsPath), { recursive: true });
fs.writeFileSync(redirectsPath, "/*    /index.html   200\n");
console.log("✅ public/_redirects créé");
