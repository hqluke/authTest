const path = require("node:path");
const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const dotenv = require("dotenv");
dotenv.config();
const bcrypt = require("bcryptjs");
const pool = require("./db/pool");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "style")));

// General rate limiter for all routes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter rate limiter for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: "Too many login attempts, please try again after 15 minutes.",
    skipSuccessfulRequests: true, // Don't count successful logins
});

// Apply rate limiting
app.use(generalLimiter);

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                scriptSrcAttr: ["'unsafe-inline'"],
            },
        },
    }),
);

app.use(
    session({
        store: new pgSession({
            pool: pool,
            tableName: "user_sessions",
        }),
        secret: process.env.COOKIE_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true, // Add this for security
            secure: process.env.NODE_ENV === "production", // HTTPS only in production
            sameSite: "lax", // CSRF protection
        },
    }),
);

app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.isDemoUser = req.user && req.user.id === 7;
    next();
});

app.get("/demo", async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM users WHERE id = $1",
            [7],
        );
        const demoUser = rows[0];

        if (!demoUser) {
            return res.status(404).send("Demo user not found");
        }

        req.login(demoUser, (err) => {
            if (err) {
                return next(err);
            }
            res.redirect("/calendar?year=2026");
        });
    } catch (error) {
        next(error);
    }
});

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/sign-up", (req, res) => res.render("sign-up-form"));

// Apply strict rate limiting to sign-up
app.post("/sign-up", authLimiter, async (req, res, next) => {
    try {
        // Add validation
        if (!req.body.username || !req.body.password) {
            return res.status(400).send("Username and password are required");
        }

        if (req.body.password.length < 8) {
            return res
                .status(400)
                .send("Password must be at least 8 characters");
        }

        // Check if username already exists
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE name = $1",
            [req.body.username],
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).send("Username already exists");
        }

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

const calendarRouter = require("./routes/calendarRouter");
app.use("/calendar", calendarRouter);

// Apply strict rate limiting to login
app.post(
    "/log-in",
    authLimiter, // Add rate limiting here
    passport.authenticate("local", {
        successRedirect: "/",
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
            return done(null, user);
        } catch (err) {
            console.error("Login error:", err);
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

app.use((err, req, res, next) => {
    console.error("Error occurred:");
    console.error("User:", req.user?.id);
    console.error("Path:", req.path);
    console.error("Error:", err);
    res.status(500).send("Internal Server Error - Check server logs");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, (error) => {
    if (error) {
        throw error;
    }
    console.log(`app listening on port ${PORT}!`);
});
