import express, { NextFunction, Request, Response } from "express";
import { getSharedIdempotencyService, idempotency } from "express-idempotency";
import axios from "axios";
import cors from "cors";
import env from "dotenv";
import pino from 'pino'
import expressPino from 'express-pino-logger'
// import log from 'axios-debug-log'

env.config();




const app = express();
app.use(express.json());

app.use(cors());
app.use(idempotency());


const PORT = process.env.PORT || 30002;

const logger = pino({}, pino.destination('./pe.log'))
const logRequest = expressPino(
  {logger: logger, autoLogging: true,}
  )

app.use(logRequest)

// const logger = pino({})
// const alchemyLogger = expressPino({logger})
// app.use(alchemyLogger)


axios.interceptors.request.use(function (config) {
  //@ts-ignore
  config["metadata"] = { startTime: new Date() };
  return config;
}, function (error) {
  return Promise.reject(error);
});

axios.interceptors.response.use(function (response) {
  //@ts-ignore
  response.config["metadata"].endTime = new Date();
  //@ts-ignore
  const duration = response.config["metadata"].endTime - response.config["metadata"].startTime;
  logger.info({message :
    {
      "url": response.config.url,
      "duration": duration,
      "body" : response.data
    }
    //  `response time ${duration} from the url ${response.config.url} and the body is ${JSON.stringify(response.data)}`
  })
  return response;
}, function (error) {
  error.config.metadata.endTime = new Date();
  const duration = error.config.metadata.endTime - error.config.metadata.startTime;
  
  return Promise.reject(error);
});


app.post('/sepolia', async (req: Request, res: Response, next:NextFunction) => {
    const startTime = Date.now();
    res.on("finish", () => {
      const endTime = Date.now();
      const requestTime = endTime - startTime;
      console.log(`Request fulfilled in ${requestTime}ms`);
    });
    const body = req.body;
    const idempotencyService = getSharedIdempotencyService();
    console.log(idempotencyService);

    if (idempotencyService.isHit(req)) {
      console.log("Request matched idempotency key");
      return;
    }

    try {
      const response = await axios.post(
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.SEPOLIA_KEY}`,

        body,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "dhek, now we are fetching the data from the api, because we didnt have any already fetched data..."
      );
      console.log(response.data);
      res.send(response.data);
  
      next();
    } catch (error) {
      idempotencyService.reportError(req);
      return res.status(500).send("Internal Server Error");
    }
  }
);


app.post("/mumbai", async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  res.on("finish", () => {
    const endTime = Date.now();
    const requestTime = endTime - startTime;
    console.log(`Request fulfilled in ${requestTime}ms`);
  });
  const body = req.body;
  const idempotencyService = getSharedIdempotencyService();
  console.log(idempotencyService);

  if (idempotencyService.isHit(req)) {
    console.log("Request matched idempotency key");
    return;
  }

  try {
    const response = await axios.post(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.MUMBAI_KEY}`,

      body,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "dhek, now we are fetching the data from the api, because we didnt have any already fetched data..."
    );
    console.log(response.data);
    res.send(response.data);
    next();
  } catch (error) {
    idempotencyService.reportError(req);
    return res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
