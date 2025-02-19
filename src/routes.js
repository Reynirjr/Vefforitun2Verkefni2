import express from 'express';
import { getDatabase } from './lib/db.client.js';
import { environment } from './lib/environment.js';
import { logger } from './lib/logger.js';

export const router = express.Router();

router.get('/', async (req, res) => {
  const result = await getDatabase()?.query('SELECT * FROM categories');

  const categories = result?.rows ?? [];

  console.log(categories);
  res.render('index', { title: 'Forsíða', categories });
});

router.get('/spurningar/:category', (req, res) => {
  // TEMP EKKI READY FYRIR PRODUCTION
  const category = req.params.category;
  res.render('category', { title: category });
});

router.get('/form', (req, res) => {
  res.render('form', { title: 'Búa til flokk' });
});

router.post('/form', async (req, res, next) => {
  try{
    const { name } = req.body;
    // Hér þarf að setja upp validation, hvað ef name er tómt? hvað ef það er allt handritið að BEE MOVIE?
    // Hvað ef það er SQL INJECTION? HVAÐ EF ÞAÐ ER EITTHVAÐ ANNAÐ HRÆÐILEGT?!?!?!?!?!
    // TODO VALIDATION OG HUGA AÐ ÖRYGGI

    // Ef validation klikkar, senda skilaboð um það á notanda

    // Ef allt OK, búa til í gagnagrunn.
    if(!name || name.trim().length < 3 || name.trim().length > 255){
      return res.render('form',{
        title: 'Búa til flokk',
        error: 'Nafn þarf að vera á milli 3 og 255 stafir'});
    }

    const sanitizedName = name.trim();
    
    const env = environment(process.env, logger);
    if (!env) {
      return res.status(500).send('Server configuration error');
    }

    const db = getDatabase();
    const result = await db?.query('INSERT INTO categories (name) VALUES ($1)',
       [sanitizedName ]);
    console.log(result);

    res.render('form-created', { title: 'Flokkur búinn til' });
} catch (error) {
  next(error);
}
});
