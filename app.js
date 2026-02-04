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

app.use(
    session({
        store: new pgSession({
            pool: pool,
            tableName: "user_sessions",
        }),
        secret: process.env.COOKIE_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    }),
);
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.render("index", { user: req.user });
});
app.get("/sign-up", (req, res) => res.render("sign-up-form"));

app.post("/sign-up", async (req, res, next) => {
    try {
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

app.post(
    "/log-in",
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/",
    }),
);

//can access req.currentUser everywhere
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

app.get("/log-out", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            console.log("Attempting login for:", username); // Add this
            const { rows } = await pool.query(
                "SELECT * FROM users WHERE name = $1",
                [username],
            );
            const user = rows[0];

            if (!user) {
                console.log("User not found"); // Add this
                return done(null, false, { message: "Incorrect username" });
            }

            const match = await bcrypt.compare(password, user.password);
            console.log("Password match:", match); // Add this

            if (!match) {
                return done(null, false, { message: "Incorrect password" });
            }

            console.log("Login successful for user:", user.id); // Add this
            console.log(user);
            return done(null, user);
        } catch (err) {
            console.error("Login error:", err); // Add this
            return done(err);
        }
    }),
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

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
