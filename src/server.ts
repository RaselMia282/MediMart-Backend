import app from "./app";
import { redisClient } from "./lib/redis";

const PORT = process.env.port || 8000;

async function main() {
  try {
    app.listen(PORT, () => {
      console.log(`MediMart server is running ${PORT}`);
    });
    await redisClient.connect();
    console.log("Redis connected successfully");
  } catch (error) {
    console.log(error);
  }
}

main();
