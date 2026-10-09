import app from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';

connectDB()
  .then(() => app.listen(config.port, () => console.log(`API listening on :${config.port}`)))
  .catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });
