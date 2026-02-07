const path = require("node:path");
const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session); // Add this
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const dotenv = require("dotenv");
dotenv.config();
const bcrypt = require("bcryptjs");
const pool = require("./db/pool");
const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "style")));

app.use(
    session({
        // Stores the session in the db in the table user_sessions.
        // pool defines the db connection.
        store: new pgSession({
            pool: pool,
            tableName: "user_sessions",
        }),
        // The secret is used to sign the cookie.
        // Its a long random string that is stored in the .env file.
        secret: process.env.COOKIE_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    }),
);
// Uses the above defined session so passport can access it in the operations below.
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

//can access req.currentUser everywhere
// has to be after passport.session() is defined
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

app.get("/", (req, res) => {
    res.render("index");
});
app.get("/sign-up", (req, res) => res.render("sign-up-form"));

app.post("/sign-up", async (req, res, next) => {
    try {
        // Hashes the password before inserting it into the db
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await pool.query("INSERT INTO users (name, password) VALUES ($1, $2)", [
            req.body.username,
            hashedPassword,
        ]);
        res.redirect("/");
    } catch (error) {
        console.error(error);
        next(error);
    }
});

const exerciseRouter = require("./routes/exerciseRouter");
app.use("/exercise", exerciseRouter);

app.post(
    "/log-in",
    // Calls passport.use to authenticate the user
    passport.authenticate("local", {
        successRedirect: "/exercise",
        failureRedirect: "/",
    }),
);

app.get("/log-out", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

// Looks if the user exists in the db and if so, compares the password.
// If the password matches, the user is logged in and the user is returned as req.user
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            console.log("Attempting login for:", username);
            const { rows } = await pool.query(
                "SELECT * FROM users WHERE name = $1",
                [username],
            );
            const user = rows[0];

            if (!user) {
                console.log("User not found");
                return done(null, false, { message: "Incorrect username" });
            }

            const match = await bcrypt.compare(password, user.password);
            console.log("Password match:", match);

            if (!match) {
                return done(null, false, { message: "Incorrect password" });
            }

            console.log("Login successful for user:", user.id);
            console.log(user);
            return done(null, user);
        } catch (err) {
            console.error("Login error:", err);
            return done(err);
        }
    }),
);

// Stores the user id as a session in the db and in the cookie.
// So when the user logs in, the userID is sent to the server and the server looks up the user in the db.
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Reads the session cookie and looks up the userID in the db. If found, returns the user as req.user
passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
            id,
        ]);
        const user = rows[0];

        done(null, user);
    } catch (err) {
        done(err);
    }
});

app.listen(3000, (error) => {
    if (error) {
        throw error;
    }
    console.log("app listening on port 3000!");
});
