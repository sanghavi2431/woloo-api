import * as bodyParser from "body-parser";
import express from "express";
import fs from "fs";
const readline = require("readline");
const morgan = require("morgan");
import application from "../Constants/application";
import indexRoute from "../Routes/index";
import joiErrorHandler from "../Middlewares/joiErrorHandler";
import Authenticate from "../Middlewares/Authenticate";
import path from "path";
import { getLogFilePath } from "../utilities/getLogFilePath";
const cors = require("cors");
const app = express();

app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "DELETE, PUT, GET, POST");
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, token_access, user_id, User-agent, client_id, client_secret,x-api-key"
  );
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  next();
});
require("dotenv").config();

app.set("views", path.join(__dirname, "..", "views"));
app.set("view engine", "ejs");

app.use(bodyParser.json());

// // Create a logs directory if it doesn't exist
// const logDirectory = path.join(__dirname, "../.." ,"logs");
// if (!fs.existsSync(logDirectory)) {
//   fs.mkdirSync(logDirectory);
// }

// // Create a writable stream for log file (appending logs)
// const accessLogStream = fs.createWriteStream(
//   path.join(logDirectory, "access.log"),
//   { flags: "a" } // 'a' means append, 'w' means write
// );

// // Configure Morgan to write logs to the file
// app.use(morgan("combined", { stream: accessLogStream }));
app.use(morgan("dev"));
app.use(Authenticate);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

// Router
function readLastLines(logFilePath: any, numberOfLines: any) {
  return new Promise((resolve, reject) => {
    const stream: any = fs.createReadStream(logFilePath, { encoding: "utf8" });
    const rl: any = readline.createInterface({ input: stream });

    const lines: any[] = [];
    rl.on("line", (line: any) => {
      lines.push(line);
      if (lines.length > numberOfLines) {
        lines.shift(); // Keep only the last 'numberOfLines' lines
      }
    });

    rl.on("close", () => {
      resolve(lines.join("\n"));
    });

    rl.on("error", (err: any) => {
      reject(err);
    });
  });
}

app.get("/api/logs", async (req, res) => {
  const logsType = req.query.type as string;
  const numberOfLines = req.query.lines || 1000;

  try {
    const lastLines = await readLastLines(getLogFilePath(logsType), numberOfLines);
    res.type("text/plain").send(lastLines);
  } catch (err: any) {
    res.status(500).send("Error reading log file: " + err.message);
  }
});

app.use(application.url.base, indexRoute);
// Joi Error Handler
app.use(joiErrorHandler);

export default app;
