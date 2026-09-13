import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ev from "./routes/verificationRoutes.js";
import pe from "./routes/preEnrollmentRoutes.js";
import auth from "./routes/authRoutes.js";
import acad from "./routes/academicRoute.js";
import po from "./routes/paymentOptionRoute.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());
app.use("/api/auth", auth);
app.use("/api/preEnrollment", pe);
console.log("Loading verification routes...");
app.use("/api/email-verification", ev);
app.use("/api/academics", acad);
app.use("/api/payments", po);

app.get("/test", (req, res) => {
  res.json({
    message: "Express server is working",
  });
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`server running on port ${process.env.PORT}`);
});
