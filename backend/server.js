const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const app = require("./app");
const { initSocket } = require("./src/sockets");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server successfully launched on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error(`Shutting down due to Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
