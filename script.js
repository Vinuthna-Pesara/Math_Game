const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");

const app=express();
mongoose.connect("mongodb://localhost:27017/evoting",{
    UseNewUrlParser:true,
    UseUnifiedTopology:true,
});
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

const userschema=mongoose.Schema({
    name:String,
    password:String,
    votes:Object,
});
const electionschema=mongoose.Schema({
    category:String,
    votes:[{name:String,votes:Number}],
    active:Boolean,
});
const User=mongoose.model("user",userschema);
const Election=mongoose.model("election",electionschema);

app.use(express.static(__dirname + "/public"));
app.get('/',(req,res)=>{
    res.send("voting");
})
app.post('/register', async (req, res) => {
    const { email,password} = req.body;
    const user = await User.findOne({ email });
    if (user) return res.send('User already exists');
    await new User({ email, password, votes: {} }).save();
    res.send('Registered successfully');
  });
  
  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.send('Login failed');
    res.redirect(`/get-quiz:count?userId:${user}`);
  });
  
  app.get('/elections', async (req, res) => {
    const elections = await Election.find({ active: true });
    const user = await User.findOne({ email: req.query.email });
    res.json({ elections, votes: user?.votes || {} });
  });
app.listen(3001,()=>console.log("running at http://localhost:3001"));