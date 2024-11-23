const express = require("express");
const mustacheExpress = require("mustache-express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const app = express();
let globalRequestCount = 0;

// Configuração do Mustache
app.engine("mustache", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", __dirname + "/views");

// Middlewares
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: "segredo123",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Simulação de banco de dados
const users = [
  { id: 1, username: "admin", password: "admin123", type: "admin" },
  { id: 2, username: "user", password: "user123", type: "user" },
];
const tasks = [];

// Configuração do Passport
passport.use(
  new LocalStrategy((username, password, done) => {
    const user = users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user)
      return done(null, false, { message: "Usuário ou senha inválidos" });
    return done(null, user);
  })
);
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = users.find((u) => u.id === id);
  done(null, user);
});

// Middleware para verificar autenticação
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
}

// Middleware para contagem de requisições
app.use((req, res, next) => {
  globalRequestCount++;
  next();
});

// Rotas
app.get("/", (req, res) => {
  const userName = req.session.userName || null;

  const formattedTasks = tasks.map((task) => ({
    text: task.text,
    group: task.group,
    author: task.author,
  }));

  res.render("index", {
    userName,
    tasks: formattedTasks,
    isAuthenticated: req.isAuthenticated(),
    userType: req.user?.type || null,
  });
});

app.post("/salvauser", (req, res) => {
  req.session.userName = req.body.name;
  if (!req.session.tasks) req.session.tasks = [];
  res.redirect("/");
});

app.get("/random", (req, res) => {
  req.session.randomNumber = Math.floor(Math.random() * 100) + 1;
  res.cookie("randomNumber", req.session.randomNumber);
  res.render("random", { randomNumber: req.session.randomNumber });
});

app.get("/contador", (req, res) => {
  const userCount = users.length;
  res.render("contador", {
    globalRequestCount,
    userCount,
  });
});

app.post("/addtask", isAuthenticated, (req, res) => {
  const task = req.body.task;
  const userType = req.user.type;
  if (task) {
    tasks.push({ text: task, group: userType, author: req.user.username });
  }
  res.redirect("/");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

app.get("/logout", (req, res) => {
  req.logout(() => {});
  res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (users.find((u) => u.username === username)) {
    return res.render("register", { error: "Usuário já existe" });
  }
  users.push({ id: users.length + 1, username, password, type: "user" });
  res.redirect("/login");
});

// Servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
