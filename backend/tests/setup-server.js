import { afterAll, beforeAll } from "vitest";
import http from "node:http";
import app from "../app.js";
import { closeSocket, initSocket } from "../src/sockets/index.js";

const PORT = Number(process.env.TEST_PORT || 5100);
let server;

beforeAll(async () => {
  server = http.createServer(app);
  initSocket(server);

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(PORT, () => {
      server.off("error", reject);
      resolve();
    });
  });
}, 30000);

afterAll(async () => {
  if (!server) return;

  await closeSocket();

  await new Promise((resolve) => {
    server.close(() => resolve());
  });
}, 30000);
