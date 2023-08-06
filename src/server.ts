import express, { NextFunction, Request, Response } from "express";
import { getSharedIdempotencyService, idempotency } from "express-idempotency";
import axios from "axios";
import cors from "cors";
import env from "dotenv";
import loggers from "pino-http";
env.config();

const app = express();
app.use(express.json());
app.use(loggers());
app.use(cors());
app.use(idempotency());

const PORT = process.env.PORT || 30002;

app.get("/ping", async (req: Request, res: Response) => {
  res.send("pong");
});
app.post(
  "/sepolia",
  async (req: Request, res: Response, next: NextFunction) => {
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
