import express from 'express';
import { router } from './routes.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';
import helmet from 'helmet';

dotenv.config();

console.log('DB URL:', process.env.DATABASE_URL);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const viewsPath = join(__dirname, 'views');

app.set('views', viewsPath);
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.disable('x-powered-by');
app.use('/', router);

app.use((req, res) => {
  res.status(404).render('404', { title: 'Síða fannst ekki' });
});

app.use((err, req, res) => {
  console.error(err);
  res.status(500).render('error', { title: 'Villa', error: err });
});

if (!process.env.NETLIFY) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
