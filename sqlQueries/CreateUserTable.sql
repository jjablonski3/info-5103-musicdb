CREATE TABLE IF NOT EXISTS member(
   member_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 9000 INCREMENT BY 1),
   membername TEXT UNIQUE NOT NULL,
   password TEXT NOT NULL,
   email TEXT UNIQUE NOT NULL
);