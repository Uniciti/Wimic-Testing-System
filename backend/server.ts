import { app, server } from './src/index';
import 'dotenv/config'

const PORT = process.env.SERVER_PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});