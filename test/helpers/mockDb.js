import { vi } from 'vitest';

/**
 * Creates a mock database with predefined data for testing
 * @param {object} data - The data to mock in the database
 * @returns {object} A mock database object with a query method
 */
export function createMockDb(data = {}) {
  const categories = data.categories || [];
  const questions = data.questions || [];
  const answers = data.answers || [];
  
  return {
    query: vi.fn((query, params = []) => {
      // Match SELECT queries against our mock data
      if (query.includes('FROM categories')) {
        return Promise.resolve({ rows: categories, rowCount: categories.length });
      }
      
      if (query.includes('FROM questions WHERE category_id = $1')) {
        const categoryId = params[0];
        const filteredQuestions = questions.filter(q => q.category_id == categoryId);
        return Promise.resolve({ rows: filteredQuestions, rowCount: filteredQuestions.length });
      }
      
      if (query.includes('FROM answers WHERE question_id = $1')) {
        const questionId = params[0];
        const filteredAnswers = answers.filter(a => a.question_id == questionId);
        return Promise.resolve({ rows: filteredAnswers, rowCount: filteredAnswers.length });
      }
      
      // Handle INSERT operations
      if (query.includes('INSERT INTO questions')) {
        return Promise.resolve({ rows: [{ id: Math.floor(Math.random() * 1000) + 1 }] });
      }
      
      if (query.includes('INSERT INTO answers')) {
        return Promise.resolve({ rows: [{ id: Math.floor(Math.random() * 1000) + 1 }] });
      }
      
      // Default empty response for unmatched queries
      return Promise.resolve({ rows: [], rowCount: 0 });
    })
  };
}
