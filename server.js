const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
mongoose.connect("mongodb://localhost:27017/math-assessment", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const StudentSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const AttemptSchema = new mongoose.Schema({
  studentId: mongoose.Schema.Types.ObjectId,
  score: Number,
  totalQuestions: Number,
  date: { type: Date, default: Date.now },
});
const Student = mongoose.model("Student", StudentSchema);
const Attempt = mongoose.model("Attempt", AttemptSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const existing = await Student.findOne({ username });
  if (existing) return res.send("User already exists");
  await new Student({ username, password }).save();
  res.redirect("/login.html");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await Student.findOne({ username, password });
  if (!user) return res.send("Invalid credentials");
  res.redirect(`/quiz.html?userId=${user._id}`);
});

function generateExpressions(count) {
  const ops = ["+", "-", "*", "/"];
  const exprs = [];
  for (let i = 0; i < count; i++) {
    const a = Math.floor(Math.random() * 20 + 1);
    const b = Math.floor(Math.random() * 10 + 1);
    const c = Math.floor(Math.random() * 10 + 1);
    const op1 = ops[Math.floor(Math.random() * 4)];
    const op2 = ops[Math.floor(Math.random() * 4)];
    exprs.push(`${a} ${op1} ${b} ${op2} ${c}`);
  }
  return exprs;
}

app.get("/generate-quiz/:count", (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(403).send("Unauthorized");
  const count = parseInt(req.params.count);
  res.json(generateExpressions(count));
});

app.post("/submit-quiz", async (req, res) => {
  const { userId, answers, expressions } = req.body;
  if (!userId) return res.status(403).send("Unauthorized");

  let correct = 0;
  expressions.forEach((expr, i) => {
    const ans = parseFloat(eval(expr).toFixed(2));
    if (parseFloat(answers[i]).toFixed(2) == ans) correct++;
  });

  const attempt = await new Attempt({
    studentId: userId,
    score: correct,
    totalQuestions: expressions.length,
  }).save();

  const all = await Attempt.find({}).sort({ score: -1 });
  const rank = all.findIndex(a => a._id.equals(attempt._id)) + 1;
  res.json({ score: correct, total: expressions.length, rank });
});

app.get("/history", async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(403).send("Unauthorized");
  const history = await Attempt.find({ studentId: userId });
  res.json(history);
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));
