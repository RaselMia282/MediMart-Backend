import app from "./app";

const PORT = process.env.port || 7000;

async function main() {
  try {
    app.listen(PORT, () => {
      console.log(
        `Authentication Practices with Redis server is running ${PORT}`,
      );
    });
  } catch (error) {
    console.log(error);
  }
}

main();
