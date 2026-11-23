import nodemailer from "nodemailer/lib/nodemailer";
import app from "./app";
import { redisClient } from "./lib/redis";
import { transporter } from "./lib/nodemailer";

const PORT = process.env.port || 8000;

async function main() {
  try {
    app.listen(PORT, () => {
      console.log(`MediMart server is running ${PORT}`);
    });
    await redisClient.connect();
    console.log("Redis connected successfully");
    await transporter.verify();
    console.log("Nodemailer connected successfully");
    
  } catch (error) {
    console.log(error);
  }
}

main();
