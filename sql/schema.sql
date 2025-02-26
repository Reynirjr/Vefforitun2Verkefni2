-- sql/schema.sql
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE CHECK (name <> ''),
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id)
);

CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  question_id INTEGER NOT NULL REFERENCES questions(id)
);