import express from 'express';
import { getDatabase } from './lib/db.client.js';
import { logger } from './lib/logger.js';
import { environment } from './lib/environment.js';

export const router = express.Router();

function catchErrors(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

async function indexRoute(req, res) {
  const db = getDatabase();
  const result = await db.query('SELECT * FROM categories');
  const categories = result.rows ?? [];
  res.render('index', { title: 'Forsíða', categories });
}

async function categoryRoute(req, res, next) {
  try {
    const categoryId = req.params.category;
    const db = getDatabase();

    const questionsResult = await db.query(
      'SELECT * FROM questions WHERE category_id = $1',
      [categoryId]
    );
    const questions = questionsResult.rows || [];

    for (const question of questions) {
      const answersResult = await db.query(
        'SELECT * FROM answers WHERE question_id = $1 ORDER BY id',
        [question.id]
      );
      question.answers = answersResult.rows;
    }
    
    res.render('questions', { 
      title: 'Spurningar', 
      categoryId, 
      questions 
    });
  } catch (error) {
    next(error);
  }
}

async function createQuestionFormRoute(req, res) {
  const db = getDatabase();
  const result = await db.query('SELECT * FROM categories');
  const categories = result.rows ?? [];
  res.render('form', {
    title: 'Bæta við spurningu',
    data: {},
    errors: [],
    invalidFields: [],
    categories,
  });
}

async function createQuestionRoute(req, res, next) {
  try {
    const { question, category, answers, correctAnswer } = req.body;
    let errors = [];
    let invalidFields = [];

    if (!question || question.trim().length < 10) {
      errors.push({ msg: 'Spurning verður að vera að minnsta kosti 10 stafir.', path: 'question' });
      invalidFields.push('question');
    }
    if (!category) {
      errors.push({ msg: 'Veldu flokk.', path: 'category' });
      invalidFields.push('category');
    }
    let answersArray = Array.isArray(answers) ? answers : [answers];
    const nonEmptyAnswers = answersArray.filter(a => a.trim() !== '');
    if (nonEmptyAnswers.length < 2) {
      errors.push({ msg: 'Að minnsta kosti tvö svör verða að vera til staðar.', path: 'answers' });
      invalidFields.push('answers');
    }
    if (typeof correctAnswer === 'undefined' || correctAnswer === null) {
      errors.push({ msg: 'Veldu rétt svar.', path: 'correctAnswer' });
      invalidFields.push('correctAnswer');
    }

    if (errors.length > 0) {
      const db = getDatabase();
      const result = await db.query('SELECT * FROM categories');
      const categories = result.rows ?? [];
      return res.render('form', {
        title: 'Bæta við spurningu',
        errors,
        invalidFields,
        data: req.body,
        categories,
      });
    }

    const sanitizedQuestion = question.trim();
    const env = environment(process.env, logger);
    if (!env) {
      return res.status(500).send('Server configuration error');
    }

    const db = getDatabase();
    const created = await db.query(
      'INSERT INTO questions (question, category_id) VALUES ($1, $2) RETURNING id',
      [sanitizedQuestion, category]
    );
    const questionId = created.rows[0].id;
    for (let i = 0; i < answersArray.length; i++) {
      const answerText = answersArray[i].trim();
      if (answerText === '') continue;
      
      const isCorrect = parseInt(correctAnswer) === i;
      await db.query(
        'INSERT INTO answers (answer, is_correct, question_id) VALUES ($1, $2, $3)',
        [answerText, isCorrect, questionId]
      );
    }
    req.session = req.session || {};
    req.session.messages = ['Spurningu bætt við.'];
    res.redirect('/');
  } catch (error) {
    next(error);
  }
}
async function answerAllQuestionsRoute(req, res, next) {
  try {
    const selectedAnswers = req.body.selectedAnswers;
    const db = getDatabase();
    let total = 0;
    let correctCount = 0;

    for (const questionId in selectedAnswers) {
      total++;
      const selectedIndex = parseInt(selectedAnswers[questionId], 10);
      const result = await db.query(
        'SELECT * FROM answers WHERE question_id = $1 ORDER BY id',
        [questionId]
      );
      const answers = result.rows;
      const correctIndex = answers.findIndex(a => a.is_correct);
      if (selectedIndex === correctIndex) {
        correctCount++;
      }
    }

    res.render('quiz-result', {
      title: 'Niðurstaða',
      total,
      correctCount,
      message: `Yay, you got ${correctCount} out of ${total} questions correct!`
    });
  } catch (error) {
    next(error);
  }
}

router.get('/', catchErrors(indexRoute));
router.get('/spurningar/:category(\\d+)', catchErrors(categoryRoute));
router.get('/form', catchErrors(createQuestionFormRoute));
router.post('/form', catchErrors(createQuestionRoute));
router.post('/spurningar/answer', catchErrors(answerAllQuestionsRoute));

