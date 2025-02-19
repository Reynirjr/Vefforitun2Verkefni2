import express from 'express';
import xss from 'xss';
import { getDatabase } from './lib/db.client.js';
import { logger } from './lib/logger.js';

export const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const db = getDatabase();
    if (!db) {
      logger.error('Database ekki til staðar');
      return next(new Error('Database connection error'));
    }

    const result = await db.query('SELECT * FROM categories');
    res.render('index', {
      title: 'Forsíða',
      categories: result.rows
    });
  } catch (error) {
    logger.error('Failed to fetch categories', error);
    next(error);
  }
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
  try {
    const { name } = req.body;
    const db = getDatabase();

    // Enhanced validation
    if (!name || name.trim().length < 3 || name.trim().length > 255) {
      return res.render('form', {
        title: 'Búa til flokk',
        error: 'Nafn þarf að vera á milli 3 og 255 stafir'
      });
    }

    const sanitizedName = xss(name.trim());
    
    // Additional check for empty string after sanitization
    if (sanitizedName === '') {
      return res.render('form', {
        title: 'Búa til flokk',
        error: 'Nafn má ekki vera tómt'
      });
    }

    // Check for existing category
    const exists = await db.query(
      'SELECT id FROM categories WHERE name = $1',
      [sanitizedName]
    );
    
    if (exists.rows.length > 0) {
      return res.render('form', {
        title: 'Búa til flokk',
        error: 'Flokkur með þetta nafn er þegar til'
      });
    }

    await db.query(
      'INSERT INTO categories (name) VALUES ($1)',
      [sanitizedName]
    );

    res.redirect('/'); // Redirect to home instead of separate page
  } catch (error) {
    next(error);
  }
});