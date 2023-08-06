// import express,{NextFunction, Request,Response} from 'express';
// import { getSharedIdempotencyService, idempotency } from 'express-idempotency';
// import axios from 'axios';
// import cors from 'cors'
// import env from "dotenv";
// import bodyparser from "body-parser"
// env.config()

// const cache = new Map();

// const app = express();
// app.use(bodyparser.json());
// app.use(bodyparser.urlencoded({ extended: true }));
// app.use(idempotency());
// app.use(cors())

// const PORT = process.env.PORT || 30002;

// app.post('/sepolia', async (req: Request, res: Response, next:NextFunction) => {
//     const startTime = Date.now();
//     res.on('finish', () => {
//       const endTime = Date.now();
//       const requestTime = endTime - startTime;
//       console.log(`Request fulfilled in ${requestTime}ms`);
//     });
//     const body = req.body
//     const idempotencyService = getSharedIdempotencyService();

//     if(idempotencyService.isHit(req)) {
//       return;
//     }

//   try {
//     const idempotencyKey = req.headers['idempotency-key'];

//     const response = await axios.post(
//       `https://eth-sepolia.g.alchemy.com/v2/${process.env.SEPOLIA_KEY}`,

//       body,
//       {
//         headers: {
//           'Content-Type': 'application/json'
//         },
//       }
//     );

//     console.log('dhek, now we are fetching the data from the api, because we didnt have any already fetched data...');
//     console.log(response.data)
//     return res.send(response.data)
//     next();
//   } catch (error) {
//     idempotencyService.reportError(req)
//     return res.send(error)
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });




import express,{Request,Response} from 'express';
import { idempotency } from 'express-idempotency';
import axios from 'axios';
import cors from 'cors'
import env from "dotenv";
env.config()

const cache = new Map();

const app = express();
app.use(express.json());
app.use(idempotency());
app.use(cors())

const PORT = process.env.PORT || 30002;

app.post('/sepolia', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'];
    const startTime = Date.now();
    res.on('finish', () => {
      const endTime = Date.now();
      const requestTime = endTime - startTime;
      console.log(`Request fulfilled in ${requestTime}ms`);
    });

    if (cache.has(idempotencyKey)) {
      const cachedResponse = cache.get(idempotencyKey);
      console.log('dhek, now we already have a fetched data... so now we are retrieving the existing one...');
      res.send(cachedResponse);
      return;
    }

    const response = await axios.post(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.SEPOLIA_KEY}`,

      req.body,
      {
        headers: {
          'Content-Type': 'application/json'
        },
      }
    );

    cache.set(idempotencyKey, response.data);

    console.log('dhek, now we are fetching the data from the api, because we didnt have any already fetched data...');
    res.send(response.data); 
  } catch (error) {
    console.log('An error occurred', error);
  }
});

app.post('/mumbai', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'];

    const startTime = Date.now();
    res.on('finish', () => {
      const endTime = Date.now();
      const requestTime = endTime - startTime;
      console.log(`Request fulfilled in ${requestTime}ms`);
    });

    if (cache.has(idempotencyKey)) {
      const cachedResponse = cache.get(idempotencyKey);
      console.log('dhek, now we already have a fetched data... so now we are retrieving the existing one...');
      res.send(cachedResponse);
      return;
    }

    const response = await axios.post(
      `https://polygon-mumbai.g.alchemy.com/v2/${process.env.MUMBAI_KEY}`,

      req.body,
      {
        headers: {
          'Content-Type': 'application/json'
        },
      }
    );

    cache.set(idempotencyKey, response.data);

    console.log('dhek, now we are fetching the data from the api, because we didnt have any already fetched data...');
    res.send(response.data);
  } catch (error) {
    console.log('An error occurred', error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

