const fs = require("fs");
const mongoose = require("mongoose");
const net = require("net");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { connectToDatabase } = require("../../lib/db/connectToDatabase");

let mongoProcess;
let mongoDataDir;
let spawnedMongoUrl;
const originalMongoUrl = process.env.MONGODB_URL;
const originalMongoUri = process.env.MONGODB_URI;

function isLocalMongoUrl(mongoUrl) {
  return /^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\//.test(mongoUrl);
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

function waitForPort(port, timeoutMs = 15000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.createConnection({ host: "127.0.0.1", port }, () => {
        socket.end();
        resolve();
      });

      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for mongod on port ${port}`));
          return;
        }
        setTimeout(attempt, 100);
      });
    };

    attempt();
  });
}

function waitForExit(child, signal) {
  return new Promise((resolve) => {
    child.once("exit", resolve);
    child.kill(signal);
  });
}

beforeAll(async () => {
  const configuredMongoUrl = process.env.MONGODB_URL || process.env.MONGODB_URI;

  if (configuredMongoUrl) {
    try {
      await connectToDatabase();
      return;
    } catch (error) {
      if (!isLocalMongoUrl(configuredMongoUrl)) {
        throw error;
      }
    }
  }

  mongoDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "quizr-mongo-"));
  const mongoPort = await getFreePort();
  const mongoUrl = `mongodb://127.0.0.1:${mongoPort}/quizr_test`;
  const mongoLogPath = path.join(mongoDataDir, "mongod.log");
  spawnedMongoUrl = mongoUrl;

  process.env.MONGODB_URL = mongoUrl;
  process.env.MONGODB_URI = mongoUrl;

  mongoProcess = spawn(
    process.env.MONGOD_BINARY || "mongod",
    [
      "--dbpath",
      mongoDataDir,
      "--port",
      String(mongoPort),
      "--bind_ip",
      "127.0.0.1",
      "--logpath",
      mongoLogPath,
      "--quiet",
    ],
    { stdio: "ignore" }
  );

  await Promise.race([
    waitForPort(mongoPort),
    new Promise((_, reject) => {
      mongoProcess.once("error", reject);
      mongoProcess.once("exit", (code) => {
        reject(new Error(`mongod exited early with code ${code}`));
      });
    }),
  ]);

  await connectToDatabase();
}, 30000);

afterAll(async () => {
  await mongoose.connection.close(true);
  if (mongoProcess && mongoProcess.exitCode === null) {
    await Promise.race([
      waitForExit(mongoProcess, "SIGTERM"),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);

    if (mongoProcess.exitCode === null) {
      await waitForExit(mongoProcess, "SIGKILL");
    }
  }

  if (mongoDataDir) {
    fs.rmSync(mongoDataDir, { recursive: true, force: true });
  }

  if (spawnedMongoUrl) {
    if (originalMongoUrl === undefined) {
      delete process.env.MONGODB_URL;
    } else {
      process.env.MONGODB_URL = originalMongoUrl;
    }

    if (originalMongoUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalMongoUri;
    }
  }
}, 30000);
