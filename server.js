import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const db = new pg.Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});
const port = process.env.PORT;
let isUserLoggedIn = false;
let signedInUser = null;
let authErrorMsg = null;

db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const fetchSummaries = async (userId) => {
  let summaryNotes = [];
  try {
    const result = await db.query("SELECT * FROM summaries WHERE user_id=$1", [userId]);
    summaryNotes = result.rows.map(result => (result));
  } catch (error) {
    if (error) {
      authErrorMsg = "An unexpected error occured. Please try again.";
    }
  }

  return summaryNotes;
}

const loginUser = async (username) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE username=$1", [username]);

    if (result.rowCount === 0){
      authErrorMsg = "User not found. Please signup";
    } else {
      isUserLoggedIn = true;
      signedInUser = result.rows[0];
    }
  } catch (error) {
    if (error) {
      authErrorMsg = "An unexpected error occured. Please try again.";
    }
  }
}

const signupUser = async (username) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE user_id=$1", [signedInUser.id]);

    if (result.rowCount !== 0){
      authErrorMsg = "Username already exists.";
    } else {
      try {
        const result = await db.query("INSERT INTO users (username) VALUES ($1) RETURNING *", [username]);
        isUserLoggedIn = true;
        signedInUser = result.rows[0];
      } catch (error) {
        if (error) {
          errorMsg = "An unexpected error occured. Please try again.";
        }
      }
    }

  } catch (error) {
    if (error) {
      authErrorMsg = "An unexpected error occured. Please try again.";
    }
  }
}

app.get("/", async (req, res) => {
  let result = [];
  if (isUserLoggedIn) {
    result = await fetchSummaries(signedInUser.id);
  }

  res.render("index.ejs", {
    authErrorMsg: authErrorMsg,
    isLoggedIn: isUserLoggedIn,
    signedInUser: signedInUser,
    summaries: result
  });
});

app.post("/signup", async (req, res) => {
  const { username } = req.body;
  await signupUser(username);
  res.redirect("/");
});

app.post("/login", async (req, res) => {
  const { username } = req.body;
  await loginUser(username);
  res.redirect("/");
});

app.get("/add", (req, res) => {
  res.render("form.ejs", {
    title: "Add Summary",
    endpoint: "add",
    summary: {}
  });
})

app.post("/add", async (req, res) => {
  const { title, author, rating, summary, isbn, dateread } = req.body;
  
  try {
    const result = await db.query("INSERT INTO summaries (user_id, book_title, book_author, book_isbn, rating, date_read, summary) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *", 
      [signedInUser.id, title, author, isbn, rating, dateread, summary]);
    console.log(result);
  } catch (error) {
    console.log(error);
    if (error) {
      authErrorMsg = "An unexpected error occured. Please try again.";
    }
  }
  res.redirect("/");
});

app.get("/summary/:id", async (req, res) => {
  const { id } = req.params;
  let summary = null;

  try {
    const result = await db.query("SELECT * FROM summaries WHERE id=$1", [id]);
    if (result.rowCount !== 0){
      summary = result.rows[0];
    }
    console.log(result);
  } catch (error) {
    if (error) {
      authErrorMsg = "An unexpected error occured. Please try again.";
    }
  }

  res.render("summary.ejs", {
    summary: summary,
    signedInUser: signedInUser
  });
});

app.post("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM summaries WHERE id=$1 RETURNING *", [id]);
    console.log(result.rows[0]);
  } catch (error) {
    if (error) {
      authErrorMsg = "An unexpected error occured. Please try again.";
    }
  }

  res.redirect("/");
});

app.get("/edit/:id", async (req, res) => {
  const { id } = req.params;
  let summary = null

  try {
    const result = await db.query("SELECT * FROM summaries WHERE id=$1", [id]);
    summary = result.rows[0];
  } catch (error) {
    if (error) {
      authErrorMsg = "An unexpected error occured. Please try again.";
    }
  }

  res.render("form.ejs", {
    summary: summary,
    title: "Edit Summary",
    endpoint: "edit"
  });
});

app.post("/edit/:id", async (req, res) => {
  const { id } = req.params;
  const { title, author, rating, isbn, summary, dateread } = req.body;
  
  try {
    await db.query("UPDATE summaries SET book_title=$1, book_author=$2, rating=$3,book_isbn=$4, summary=$5, date_read=$6 WHERE id=$7 AND user_id=$8", 
      [title, author, rating, isbn, summary, dateread, id, signedInUser.id]);
  } catch (error) {
    console.log(error);
    if (error) {
      authErrorMsg = "An unexpected error occured. Please try again.";
    }
  }
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});