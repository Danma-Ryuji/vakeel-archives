const express = require('express');
const app = express();
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');

app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));

function generateUniqueId(username) {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 15);
  const uniqueId = `${username}${timestamp}${randomString}`;
  return uniqueId;
}

const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root', /* MySQL User */
  password: '', /* MySQL Password */
  database: 'vakeel' /* MySQL Database */
});



conn.connect((err) =>{
  if(err) throw err;
  console.log('Mysql Connected with App...');
});
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));


app.get("/", function(req,res){
   res.render("login");
});

app.get("/login", function(req,res){
  res.render("login");
});

app.get("/signup", function(req,res){
  res.render("signup");
});

app.get("/contribute", function(req,res){
  res.render("contribute");
});

app.get("/aboutus", function(req,res){
  res.render("aboutus");
});

app.get("/logout",function(req,res){
  if(req.session.loggedin){
  req.session.destroy();
  res.redirect("/");
  }else{res.redirect("/");}
});

app.post("/cauth", async (req, res) => {
  const cuname = req.body.cuname;
  const cpasswd = req.body.cpasswd;

  try {
    const hashedPassword = await bcrypt.hash(cpasswd, 10);

    const sql = "INSERT INTO users (id, username, passwd) VALUES ?";
    const values = [[, cuname, hashedPassword]];

    conn.query(sql, [values], function (err, result) {
      if (err) throw err;
      console.log("1 record inserted");
    });

    res.redirect("/login");
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post('/auth', function (req, res) {
  let username = req.body.uname;
  let password = req.body.passwd;

  if (username && password) {
    conn.query('SELECT * FROM users WHERE username = ?', [username], async function (error, results, fields) {
      if (error) throw error;

      if (results.length > 0) {
        const hashedPassword = results[0].passwd;

        try {
          const match = await bcrypt.compare(password, hashedPassword);

          if (match) {
            req.session.loggedin = true;
            req.session.username = username;
            res.redirect("/dashboard");
          } else {
            res.send('Incorrect Password!');
          }
        } catch (error) {
          console.error("Error comparing passwords:", error);
          res.status(500).send("Internal Server Error");
        }
      } else {
        res.send('User not found!');
      }

      res.end();
    });
  } else {
    res.send('Please enter Username and Password!');
    res.end();
  }
});

app.get("/dashboard", function (req, res) {
  if (req.session.loggedin) {
    // Fetch data from the database
    conn.query('SELECT * FROM judgements order by date', function (error, results, fields) {
      if (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Internal Server Error");
      } else {
        // Render the dashboard EJS template and pass the data
        res.render("dashboard", { data: results });
      }
    });
  } else {
    res.send("<h1>401: Not found</h1>")
  }
});


  app.post("/contribute", (req, res)=>{
    console.log("Received POST request at /contribute");
    var report=req.body.report;
    var appellant=req.body.appellant;
    var respondent=req.body.respondent;
    var judge=req.body.judge;
    var date=req.body.date;
    var dno=req.body.dno;
    var year=req.body.year;
    var sql = "INSERT INTO judgements (report, appellant, respondent, judge, date, dno, year) VALUES ?";
    var values=[[report, appellant, respondent, judge, date, dno, year]];
    conn.query(sql, [values], function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
    });
    //console.log(type);
    res.redirect("/dashboard");
  });








app.listen(3000,() =>{
  console.log('Server started on port 3000');
});
