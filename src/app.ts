import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/uploadRoutes";
import campaignRoutes from "./routes/campaignRoutes";
import { errorHandler, notFound } from "./middleware";
import { env } from "./config/env";

const app = express();
const PORT = env.PORT;

// Middleware
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api", uploadRoutes);
app.use("/api", campaignRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Unifimed Insight Nexus Server is running",
    timestamp: new Date().toISOString(),
    services: {
      supabase: env.SUPABASE_URL ? "Configured" : "Not configured",
      cloudinary: env.CLOUDINARY_CLOUD_NAME ? "Configured" : "Not configured",
    },
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(
    `📁 Supabase: ${env.SUPABASE_URL ? "✅ Configured" : "❌ Not configured"}`
  );
  console.log(
    `☁️  Cloudinary: ${
      env.CLOUDINARY_CLOUD_NAME ? "✅ Configured" : "❌ Not configured"
    }`
  );
});

export default app;
