import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import fs from "fs";
import dotenv from "dotenv";
import environment from "./env/index.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/.well-known/apple-app-site-association", (req, res) => {
  const filePath = path.join(
    __dirname,
    ".well-known",
    "apple-app-site-association"
  );
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.sendFile(filePath);
  } else {
    res.status(404).send("Not found");
  }
});

const appMapping = {
  93: {
    androidPackage: "co.id.ajsmsig.cs.simpel",
    iosAppId: "co.id.ajsmsig.cs.simpel",
    iosAppStoreUrl: "https://apps.apple.com/app/id1560944906",
    customScheme: "vegaapp",
  },
  104: {
    androidPackage: "id.co.ajsmsig.cosmos.vegaforfamily",
    iosAppId: "id.co.ajsmsig.cosmos.vegaforfamily",
    iosAppStoreUrl: "https://apps.apple.com/app/id6443592027",
    customScheme: "vegafamilyapp",
  },
};

function detectPlatform(req) {
  const ua = req.headers["user-agent"] || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/macintosh|mac os x/i.test(ua)) return "android";
  if (/windows nt/i.test(ua)) return "windows";
  if (/linux/i.test(ua)) return "linux";
  return "web";
}

const atob = (b64) => Buffer.from(b64, "base64").toString("utf-8");

app.get("/intentdeeplink", (req, res) => {
  try {
    let query = {};

    if (req.query.payload) {
      const decoded = atob(decodeURIComponent(req.query.payload));
      query = Object.fromEntries(new URLSearchParams(decoded));
    } else {
      query = { ...req.query };
    }

    const appName = String(query.target_app);
    if (!appName || !appMapping[appName]) {
      return res
        .status(400)
        .send("App tidak ditemukan atau parameter 'target_app' kosong");
    }

    const appInfo = appMapping[appName];
    const platform = detectPlatform(req);

    const otherParams = { ...query };
    delete otherParams.target_app;

    const queryString = new URLSearchParams(otherParams).toString();

    console.log(`[DEEP LINK] Platform: ${platform}, App: ${appName}`);

    if (platform === "android") {
      const intentUri = [
        `intent://${appInfo.customScheme}${
          queryString ? "?" + queryString : ""
        }#Intent;`,
        `scheme=https;`,
        `package=${appInfo.androidPackage};`,
        `S.browser_fallback_url=https://play.google.com/store/apps/details?id=${
          appInfo.androidPackage
        }${queryString ? `&referrer=${encodeURIComponent(queryString)}` : ""};`,
        `end`,
      ].join("");

      res.set("Cache-Control", "no-store");
      return res.redirect(intentUri);
    }

    if (platform === "ios") {
      const openIosUrl = `/open-ios?${new URLSearchParams({
        ...otherParams,
        app: appName,
      }).toString()}`;
      res.set("Cache-Control", "no-store");
      return res.redirect(openIosUrl);
    }

    return res.send("Silakan buka dari perangkat mobile.");
  } catch (err) {
    console.error("Error in /intentdeeplink:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/open-ios", (req, res) => {
  const appName = String(req.query.app);
  const appInfo = appMapping[appName] || {};
  const fallbackUrl = appInfo.iosAppStoreUrl || "https://apps.apple.com";

  const queryParams = { ...req.query };
  delete queryParams.app;

  const queryString = new URLSearchParams(queryParams).toString();
  const customSchemeUrl = `${appInfo.customScheme}://${
    queryString ? "?" + queryString : ""
  }`;

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Opening App...</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body {
          font-family: sans-serif;
          text-align: center;
          margin-top: 40px;
        }
      </style>
      <script src="/open-ios.js"></script>
    </head>
    <body data-fallback="${fallbackUrl}" data-scheme="${customSchemeUrl}">
      <p>Opening app...</p>
    </body>
  </html>
`;

  res.set("Content-Type", "text/html");
  res.send(html);
});

const apiKeyMiddleware = (req, res, next) => {
  const apiKey = (req.headers["api-key"] || "").trim();
  const validApiKey = (environment.apiKey || "").trim();

  // console.log("env.apiKey :", JSON.stringify(validApiKey));
  // console.log("req.headers[api-key]:", JSON.stringify(apiKey));
  // console.log("Equal?", apiKey === validApiKey);

  if (apiKey !== validApiKey) {
    return res
      .status(401)
      .json({ error: "Oops! Kamu tidak punya akses ke fitur ini." });
  }

  next();
};

app.post("/generate-link", apiKeyMiddleware, (req, res) => {
  try {
    const params = req.body;

    const appName = String(params.target_app);
    if (!appName || !appMapping[appName]) {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'target_app' parameter." });
    }

    const sanitizedParams = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        sanitizedParams[key] = val;
      }
    });

    const payload = Buffer.from(
      new URLSearchParams(sanitizedParams).toString()
    ).toString("base64");

    const deeplinkUrl = `${
      environment.domain
    }/intentdeeplink?payload=${encodeURIComponent(payload)}`;

    return res.json({ deeplink: deeplinkUrl });
  } catch (err) {
    console.error("Error in POST /generate-link:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use((req, res, next) => {
  res.status(404).json({ error: "404 not found" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
