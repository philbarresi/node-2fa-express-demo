const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();

const {
  login,
  getSession,
  getUserFromSession,
  generate2faCode,
  validate2faCode
} = require("./users");
const { sendCodeToUser } = require("./messenger");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const validatePasswordAuthenticated = async (req, res, next) => {
  try {
    const { user, session } = await getUserFromSession(req.cookies.sessionId);
    if (!session.loginState === "PasswordAuthenticated")
      throw "session is not in PasswordAuthenticated state";

    req.user = user;
    req.session = session;

    next();
  } catch (e) {
    res.status(403).redirect("/login");
  }
};

const validateTwoFactorAuthenticated = async (req, res, next) => {
  try {
    const { user, session } = await getUserFromSession(req.cookies.sessionId);
    if (!session.loginState === "TwoFactorAuthenticated")
      throw "session is not in TwoFactorAuthenticated state";

    req.user = user;
    req.session = session;

    next();
  } catch (e) {
    res.status(403).redirect("/verification");
  }
};

app.set("view engine", "pug");

app.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const newSession = await login(username, password);

    res.cookie("sessionId", newSession.sessionId);

    res.redirect("/verification");
  } catch (e) {
    res.render("login", { title: "Login" });
  }
});

app.use("/verification", validatePasswordAuthenticated);

app.get("/verification", async (req, res) => {
  // send 2fa code to user
  const code = await generate2faCode(req.session.sessionId);
  await sendCodeToUser(req.user.username, code);

  res.render("verification", { title: "Verify User" });
});

app.post("/verification", async (req, res) => {
  const { code } = req.body;
  try {
    const validSession = await validate2faCode(req.session.sessionId, code);

    res.redirect("/account");
  } catch (e) {
    res.redirect("/verification");
  }
});

app.use("/account", validateTwoFactorAuthenticated);

app.get("/account", (req, res) => {
  res.render("account", { title: "My Account", user: req.user });
});

app.get("*", (req, res) => {
  res.redirect("/login");
});

app.listen(3000, () => {
  console.log("Running server on http://localhost:3000");
});
