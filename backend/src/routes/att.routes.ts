import { Router } from 'express';
import {
  connectToAttenuator,
  sendCommandToAttenuator,
  receiveAttenuatorValue,
  disconnectFromAttenuator
} from '../controllers/att.controllers';

const router: Router = Router();

router.post('/connect', connectToAttenuator);
router.post('/send-command', sendCommandToAttenuator);
router.get('/receive-value', receiveAttenuatorValue);
router.post('/disconnect', disconnectFromAttenuator);

export default router;