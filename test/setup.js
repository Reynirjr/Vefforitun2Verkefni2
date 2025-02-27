import dotenv from 'dotenv';

dotenv.config();

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://test:test@localhost/test_db';
process.env.PORT = process.env.PORT || '3001';

console.log = () => {};
console.info = () => {};
console.warn = () => {};
console.error = () => {};
