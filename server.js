import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import passport from "passport";
import bcrypt from "bcrypt";
import session from "express-session";
import { Strategy } from "passport-local";

dotenv.config();

const app = express();
const port = process.env.APP_PORT;
const saltRounds = parseInt(process.env.SALT_ROUNDS);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));


app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});
db.connect();

const fetchSummaries = async (userId) => {
  let summaryNotes = [];
  try {
    const result = await db.query("SELECT * FROM summaries WHERE user_id=$1", [userId]);
    summaryNotes = result.rows;
  } catch (error) {
    if (error) {
      authErrorMsg = "An unexpected error occured. Please try again.";
    }
  }

  return summaryNotes;
}

app.get("/", async (req, res) => {
  if (!req.isAuthenticated()){
    return res.redirect("/login");
  }

  const summaries = await fetchSummaries(req.user.id);
  res.render("index.ejs",{
    signedInUser: req.user.email,
    summaries: summaries
  });
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/add", (req, res) => {
  if (!req.isAuthenticated()){
    return res.redirect("/login");
  }

  res.render("add.ejs");
});

app.get("/summary/:id", async (req, res) => {
  if (!req.isAuthenticated()){
    return res.redirect("/login");
  }

  const { id } = req.params;
  let summary = null;

  try {
    const result = await db.query("SELECT * FROM summaries WHERE id=$1", [id]);
    if (result.rowCount !== 0){
      summary = result.rows[0];
    }
    res.render("summary.ejs", {
      summary: summary
    });
  } catch (error) {
    if (error) {
      authErrorMsg = "An unexpected error occured. Please try again.";
    }
  }
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
  if (!req.isAuthenticated()){
    return res.redirect("/login");
  }

  const { id } = req.params;
  let summary = null

  try {
    const result = await db.query("SELECT * FROM summaries WHERE id=$1", [id]);
    summary = result.rows[0];
    res.render("edit.ejs", {
      summary: summary,
      title: "Edit Summary",
      endpoint: "edit"
    });
  } catch (error) {
    if (error) {
      authErrorMsg = "An unexpected error occured. Please try again.";
    }
  }
});

app.post("/edit/:id", async (req, res) => {
  const { id } = req.params;
  const { title, author, rating, isbn, summary, dateread } = req.body;
  
  try {
    await db.query("UPDATE summaries SET book_title=$1, book_author=$2, rating=$3,book_isbn=$4, summary=$5, date_read=$6 WHERE id=$7 AND user_id=$8", 
      [title, author, rating, isbn, summary, dateread, id, req.user.id]);
  } catch (error) {
    console.log(error);
    if (error) {
      authErrorMsg = "An unexpected error occured. Please try again.";
    }
  }
  res.redirect("/");
});


app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.redirect("/login");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/");
          });
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

app.post("/add", async (req, res) => {
  const { title, author, rating, summary, isbn, dateread } = req.body;
  
  try {
    const result = await db.query("INSERT INTO summaries (user_id, book_title, book_author, book_isbn, rating, date_read, summary) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *", 
      [req.user.id, title, author, isbn, rating, dateread, summary]);
    console.log(result);
  } catch (error) {
    console.log(error);
    if (error) {
      authErrorMsg = "An unexpected error occured. Please try again.";
    }
  }
  res.redirect("/");
});

passport.use(
  new Strategy(async function verify(username, password, cb){
    try{
      const result = await db.query("SELECT * FROM users WHERE email = $1", [username]);
      if (result.rowCount === 0){
        return cb(null, false, { message: 'Incorrect email.' });
      } else {
        const user = result.rows[0];
        bcrypt.compare(password, user.password, (err, valid) => {
          if (err) { 
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});