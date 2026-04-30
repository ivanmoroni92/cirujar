import express from 'express';
import cors from 'cors';
import routes from './routes';
import { requestLogger } from './middlewares/requestLogger.middleware';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use('/api', routes);

export default app;
