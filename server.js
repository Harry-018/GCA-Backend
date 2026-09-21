import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ev from "./routes/verificationRoutes.js";
import pe from "./routes/preEnrollmentRoutes.js";
import auth from "./routes/authRoutes.js";
import acad from "./routes/academicRoute.js";
import po from "./routes/paymentOptionRoute.js";

dotenv.config();

console.log("Starting server...");

const app = express();

console.log("Express created");

app.use(express.json());
app.use(cors());

console.log("Middleware loaded");

app.use("/api/auth", auth);
app.use("/api/preEnrollment", pe);
app.use("/api/email-verification", ev);
app.use("/api/academics", acad);
app.use("/api/payments", po);

console.log("Routes loaded");

app.get("/test", (req, res) => {
  res.json({
    message: "Express server is working",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
