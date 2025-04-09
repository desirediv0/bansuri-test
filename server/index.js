import app from "./app.js";
import dotenv from "dotenv";
import { prisma } from "./config/db.js";

dotenv.config({ path: ".env" });

const PORT = process.env.PORT || 4002;

prisma
  .$connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} 🚀`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
  });
