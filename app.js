  require('dotenv').config();

var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    moment = require("moment"),
    flash = require("connect-flash"),
    passport = require("passport"),
    localStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Campground = require("./models/campground"),
    Comment = require("./models/comment"),
    User = require("./models/user"),
    seedDB = require("./seeds");


//run on command line: export GMAILPW: picasso0
// https://mysterious-escarpment-87474.herokuapp.com/ deployed to Heroku

//requiring routes    
var commentRoutes    = require("./routes/comments"),
    reviewRoutes     = require("./routes/reviews"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index");

//in public/images folder add static images
//then when adding campground url :https://hillc255-2-hillc255.c9users.io/images/desertmesa.png
//app.use(express.static("public/images/desertmesa.png"));

//environment variable - issued on command line
//$ export DATABASEURL=mongodb://localhost/yelp_camp_v12 

//check db: console.log(process.env.DATABASEURL); 

//connect mongoose to mLab db in AWS
//first db:  
//mongoose.connect("mongodb://hillc255:hillc255@ds211625.mlab.com:11625/hillc255", { useNewUrlParser: true });
//original url from mlab:  mongodb://hillc255:hillc255@ds211625.mlab.com:11625/hillc255

//use mongoose to connect below locally in Cloud9 Express with ./mongod
//mongoose.connect("mongodb://localhost/yelp_camp_v12", { useNewUrlParser: true });
/////MUST  run this command for reset pwd :  export GMAILPW=picasso0

//second db hillc255-2
//try to connect locally
mongoose.connect("mongodb://hillc255:hillc255@ds227255.mlab.com:27255/hillc255-2");
//mongoose.connect("mongodb://hillc255:hillc255@ds227255.mlab.com:27255/hillc255-2", { useNewUrlParser: true });
//use environmental variable to connect


//temp commented out
// var url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp_v12";
// mongoose.connect(url, { useNewUrlParser: true });
// console.log(url);

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
//seed the db when developing
//seedDB(); 

//passport configuration
app.use(require("express-session")({
    secret: "Red apple",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//middleware - global variable for each template
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.moment = require("moment");
    next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("YelpCamp server started");
});
