var express = require('express');
var bodyParser = require("body-parser");
var session = require("express-session");
var mysql = require("mysql");
var Bcrypt = require('bcryptjs');

var connection = mysql.createConnection({
    host: 'complainsystem.ckkrwcogio9p.us-east-2.rds.amazonaws.com',
    user: 'DBadmin',
    password: 'rootrootroot',
    database: 'complainsystem'
});
connection.connect(function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log("Connected");
    }
});

var app = express();

app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: 'This is a black bear',
    resave: false,
    saveUninitialized: false
}));

app.use(function(req,res,next){
    currentUser = req.session.username;
    currentUserEmail = req.session.email;
    next();
});


app.get("/", (req,res) => {
    res.redirect("/login");
});

app.get("/login",(req,res) => {
    res.render("login");
});

app.post("/login",(req,res) => {
    connection.query('SELECT * FROM User WHERE email = ?', [req.body.email], function (err, results, fields) {
        if(err){
            comsole.log(err);
            res.redirect('/login');
        }
        else if(results.length <= 0){
            res.send("please Sign up!");
        }
        else if(!Bcrypt.compareSync(req.body.password, results[0].password)){
            res.send('password wrong');
        }
        else{
            req.session.loggedIn = true;
            req.session.email = results[0].email;
            req.session.username = results[0].username;
            if(results[0].usertype == "customer")
                res.redirect("/register");
            else
                res.redirect("/view");
        }
    });
    
})

app.get("/signup",(req,res) => {
    res.render("signup");
});

app.post("/signup",async (req,res) => {
    connection.query('SELECT * FROM User WHERE email = ?', [req.body.email], function (err, results, fields) {
        if(err){
            console.log(err);
            res.redirect('/signup');
        }
        else if(results.length > 0){
            res.send("Account already exist"); 
        }
        else{
            req.body.password = Bcrypt.hashSync(req.body.password, 10);
            var newUser = "insert into User(email,username,password,usertype) values(?,?,?,?)";
            var userValue = [req.body.email, req.body.username, req.body.password, req.body.usertype]
            connection.query(newUser, userValue, function (err, results, fields) {
                if (err) {
                    console.log(err);
                    res.redirect('/signup');
                } 
                else {
                    res.redirect('/login');
                }
            });
        }
    });
});
    
app.get("/home",isLoggedIn,(req,res) =>{
    res.render("home");
})

app.get("/register", (req, res) => {
    res.render("register_complaint")
})

app.post("/register", (req, res) => {
    
    var sql = "insert into feedback(cmnt, email) values (?,?)";
    var newComplaint = [req.body.feedback, req.body.email]

    connection.query(sql, newComplaint, function (err, results, fields) {
    //show success alert or something???
    });
    //reloading same page to make the annoying spinning wheel stop
    res.render("register_complaint")
})

app.get("/view", (req, res) => {
    var sql='SELECT * FROM feedback';
    connection.query(sql, function (err, data, fields) {
    if (err) throw err;
    res.render('view_complaints', { title: 'Feedback List', complaintData: data});
    });

})


function isLoggedIn(req,res,next){
    if(req.session.loggedIn){
        return next();
    }
    res.redirect("/login");
}

app.get('/logout',(req,res)=>{
    req.session.loggedIn = false;
    req.session.email = undefined;
    req.session.username = undefined;
    res.redirect('/login');
})

var server = app.listen(3000, function () {
    console.log('Server is running..');
});