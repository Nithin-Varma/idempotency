import express, { NextFunction, Request, Response } from "express";
import { getSharedIdempotencyService, idempotency } from "express-idempotency";
import axios from "axios";
import cors from "cors";
import env from "dotenv";
import pino from "pino";
// import expressPino from "express-pino-logger";
import logger from "pino-http";
import QuickLRU from "quick-lru";
import { Mutex } from "async-mutex";
env.config();
const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 30002;

// const logger = pino({}, pino.destination("./mumbai.log"));
// const logRequest = expressPino({ logger: logger, autoLogging: true });
const log = logger(
  {
    autoLogging: true,
  },
  pino.destination("./mumbai.log")
);
app.use(log);
const cache = new QuickLRU({
  maxSize: 100000000,
});

const mutex = new Mutex();

axios.interceptors.request.use(
  function (config) {
    //@ts-ignore
    config["metadata"] = { startTime: new Date() };
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

axios.interceptors.request.use(
  function (config) {
    //@ts-ignore
    config["metadata"] = { startTime: new Date() };
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  function (response) {
    //@ts-ignore
    response.config["metadata"].endTime = new Date();
    //@ts-ignore
    const duration =
      //@ts-ignore
      response.config["metadata"].endTime -
      //@ts-ignore
      response.config["metadata"].startTime;
    log.logger.info({
      message: {
        url: response.config.url,
        duration: duration,
        body: response.data,
      },
      //  `response time ${duration} from the url ${response.config.url} and the body is ${JSON.stringify(response.data)}`
    });
    return response;
  },
  function (error) {
    error.config.metadata.endTime = new Date();
    const duration =
      error.config.metadata.endTime - error.config.metadata.startTime;

    return Promise.reject(error);
  }
);

app.get("/ping", async (req: Request, res: Response, next: NextFunction) => {
  res.send("pong");
});

app.post("/mumbai", async (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers["idempotency"];

  // const cached = cache.get(key);
  // if (cached) {
  //   return res.send(cached);
  // }

  // const startTime = Date.now();
  // res.on("finish", () => {
  //   const endTime = Date.now();
  //   const requestTime = endTime - startTime;
  //   console.log(`Request fulfilled in ${requestTime}ms`);
  // });
  const body = req.body;

  const release = await mutex.acquire();
  try {
    const cachedResult = await cache.get(key);
    if (cachedResult) {
      console.log("Cache hit with value", { cachedResult });
      res.send(cachedResult);
      return;
    }

    const response = await axios.post(
      `https://polygon-mumbai.g.alchemy.com/v2/${process.env.MUMBAI_KEY}`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    cache.set(key, response.data);
    console.log(
      "dhek, now we are fetching the data from the api, because we didnt have any already fetched data..."
    );
    console.log(response.data);
    res.send(response.data);
    console.log("hi i run after send");
  } catch (error) {
    res.status(500).send(`Internal Server Error ${error}`);
  } finally {
    release();
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
