import { Router } from 'express';
import { test, frontSender } from '../controllers/main.controllers';

const mainRouter: Router = Router();

mainRouter.get('/test', test);
mainRouter.get('*', frontSender);

export default mainRouter;