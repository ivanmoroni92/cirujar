import express from 'express';
import cors from 'cors';
import routes from './routes';
import { requestLogger } from './middlewares/requestLogger.middleware';
import { setupSwagger } from './swagger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

setupSwagger(app);
app.use('/api', routes);

export default app;
