# Currency Converter

This is a simple project I built to practice full stack development with HTML, CSS, JavaScript, Node, Express, EJS, APIs, and Postgres. The application lets users to summarise the books they have read.

## Tech Stack

**Frontend:** HTML, CSS, EJS.

**Backend:** Node.js + Express.js.

**API**: https://openlibrary.org/dev/docs/api/covers.

**Database**: Postgres.

**HTTP Client**: Axios.

## Features

- User authentication(login/signup).
- Add new summary.
- Edit summary.
- Delete summary.
- View all summaries.

## Installation

**Prerequisites**

Make sure you have the following installed:

- Node.js
- npm or yarn (for package management).

**Steps to run MakeWeGo locally**:

- **Clone the repository**

```bash
  git clone https://github.com/jeremiahUdom/book_summary_app.git
```

- **Navigate to the project folder**

```bash
  cd book_summary_app
```

- **Create a database on postgres**
- **Run the following commands in your postgres query tool to create the following tables in the database you created.**

```bash
  CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE summary({
    id SERIAL PRIMARY KEY,
    user_id int FOREIGN KEY REFERENCES users(id),
    book_title TEXT NOT NULL,
    book_author TEXT NOT NULL,
    book_isbn TEXT NOT NULL,
    summary TEXT NOT NULL,
    date_read DATE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  })
```

- **Install dependencies**

```bash
  npm install
  OR
  yarn install
```

- **Run the application**

```bash
    Nodemon server.js
```

## Feedback

If you have any suggestions, questions, or encounter any issues while using the project, feel free to open an issue or reach out directly.

You can also connect with me on GitHub for feedback or collaboration.

- Email: jeremiahudom07@gmail.com
