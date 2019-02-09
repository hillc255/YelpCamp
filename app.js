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


mongoose.connect(process.env.DATABASEURL);
//mongoose.connect("mongodb://localhost/yelp_camp_v12", { useNewUrlParser: true });


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
