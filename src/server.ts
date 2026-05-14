import app from "./app";

const PORT = 5000;

async function main() {
  app.listen(PORT, () => {
    console.log(`Server running on port ${`http://localhost:${PORT}`}`);
  });
}

main();
