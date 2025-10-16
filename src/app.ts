import "dotenv/config";
import express from "express";
import logger from "./utils/logger";
import cookieParser from "cookie-parser";
import loggingMiddleware from "./middlewares/logger.middleware";
import cors from "cors";
import expressEjsLayouts from "express-ejs-layouts";
import path from "node:path";
import ingressRoute from "./routes/ingress.route";
import tripsRoute from "./routes/trips.route";

const app = express();

// Set up EJS as the templating engine
app.use(expressEjsLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
const publicDirectoryPath = path.join(__dirname, "public");
app.use(express.static(publicDirectoryPath));

app.use(cookieParser()); // for parsing cookies
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(
  cors({
    origin: process.env.SITE_URL || "http://localhost:3000",
    credentials: true, // This allows cookies to be sent/received
  }),
);

// Request logging middleware
app.use(loggingMiddleware);

// Health check endpoint
app.get("/health", (req, res) => {
  logger.info("🏥 Health check requested");
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
  });
});

// Render home page
app.get("/", (_, res) => {
  res.render("index", {
    title: "Dashboard",
    mapboxToken: process.env.MAPBOX_TOKEN || "",
  });
});

app.use("/api/v1/ingress", ingressRoute);
app.use("/api/v1/trips", tripsRoute);

// 404 handler
app.use((_, res) => {
  res.status(404).render("404", { title: "404 - Not Found" });
});

export default app;
