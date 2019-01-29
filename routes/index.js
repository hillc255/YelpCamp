var express     = require("express"),
    router      = express.Router(),
    passport    = require("passport"),
    User        = require("../models/user"),
    Campground  = require("../models/campground"),
    async       = require("async"),
    nodemailer  = require("nodemailer"),
    crypto      = require("crypto");

//root route
router.get("/", function(req,res){
   res.render("landing");
});


//show register form
router.get("/register", function(req, res){
    res.render("register");
});

//show about page
router.get("/about", function(req, res){
    res.render("about");
});

//handle sign up logic
router.post("/register", function(req, res) {
    // var newUser = new User({username: req.body.username});
    // eval(require("locus"));
    
    //user profile
    var newUser = new User({
        username:  req.body.username,
        avatar:    req.body.avatar,
        firstName: req.body.firstName,
        lastName:  req.body.lastName,
        email:     req.body.email
    });
    
    if(req.body.adminCode === "secretcode123") {
      newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message);
            // FIXED BUG - return res.render("register");
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp "+ user.username);
            res.redirect("/campgrounds");
        });
    });
});

//show login form
router.get("/login", function(req, res){
    res.render("login");
});

//handling login logic with middleware
router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res){
});

//logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

//password reset notes
//https://www.youtube.com/watch?v=UV9FvlTySGg&feature=youtu.be
//https://github.com/nax3t/yelp-camp-refactored/blob/password-reset/views/forgot.ejs
//Run this????
//>export GMAILPW=yourpassword
//Google Less secure apps -- turn on
//https://support.google.com/mail/?p=BadCredentials 195sm1294017itm.2
//https://myaccount.google.com/lesssecureapps?utm_source=google-account&utm_medium=web

//npm i -S async nodemailer
//export GMAILPW=00picasso0
//export GMAILPW=picasso0

// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      process.env['GMAILPW'] = 'picasso0';
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'noreply.webapp.test@gmail.com',
          pass: process.env.GMAILPW
          //set this on the console if it doesn't work: export GMAILPW=picasso0
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'noreply.webapp.test@gmail.com',
        subject: 'YelpCamp Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'noreply.webapp.test@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'noreply.webapp.test@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});

// // forgot password
// router.get("/forgot", function(req, res) {
//   res.render("forgot");
// });

// router.post("/forgot", function(req, res, next) {
//   async.waterfall([
//     function(done) {
//       crypto.randomBytes(20, function(err, buf) {
//         var token = buf.toString("hex");
//         done(err, token);
//       });
//     },
//     function(token, done) {
//       User.findOne({ email: req.body.email }, function(err, user) {
//           //error handling
//         if (!user || err) {
//           req.flash("error", "No account with that email address exists.");
//           return res.redirect("/forgot");
//         }

//         user.resetPasswordToken = token;
//         user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

//         user.save(function(err) {
//           done(err, token, user);
//         });
//       });
//     },
//     function(token, user, done) {
//       var smtpTransport = nodemailer.createTransport({
//         service: "Gmail", 
//         auth: {
//           user: "learntocodeinfo@gmail.com",
//           pass: process.env.GMAILPW
//         }
//       });
//       var mailOptions = {
//         to: user.email,
//         from: "learntocodeinfo@gmail.com",
//         subject: "Node.js Password Reset",
//         text: "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
//           "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
//           "http://" + req.headers.host + "/reset/" + token + "\n\n" +
//           "If you did not request this, please ignore this email and your password will remain unchanged.\n"
//       };
//       smtpTransport.sendMail(mailOptions, function(err) {
//         console.log("mail sent");
//         req.flash("success", "An e-mail has been sent to " + user.email + " with further instructions.");
//         done(err, "done");
//       });
//     }
//   ], function(err) {
//     if (err) return next(err);
//     res.redirect("/forgot");
//   });
// });

// router.get('/reset/:token', function(req, res) {
//   User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
//     //error handling
//     if (!user || err) {
//       req.flash('error', 'Password reset token is invalid or has expired.');
//       return res.redirect('/forgot');
//     }
//     res.render('reset', {token: req.params.token});
//   });
// });

// //check lots of error handling mistakes
// router.post("/reset/:token", function(req, res) {
//   async.waterfall([
//     function(done) {
//       User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
//         //error handling
//         if (!user || err) {
//           req.flash("error", "Password reset token is invalid or has expired.");
//           return res.redirect("back");
//         }
//         if(req.body.password === req.body.confirm) {
//           user.setPassword(req.body.password, function(err) {
//             //handling error
//             // if (err) return next(err);
//           if(!err){
//             user.resetPasswordToken = undefined;
//             user.resetPasswordExpires = undefined;
//           // }
//             user.save(function(err) {
//             //handling error
//             if(err){
//               req.logIn(user, function(err) {
//                 done(err, user);
//               });
//               //part of error handling
//             }
//             });
//             //part of error handling
//           }
//           })
//         } else {
//             req.flash("error", "Passwords do not match.");
//             return res.redirect("back");
//         }
//       });
//     },
//     function(user, done) {
//       var smtpTransport = nodemailer.createTransport({
//         service: "Gmail", 
//         auth: {
//           user: "learntocodeinfo@gmail.com",
//           pass: process.env.GMAILPW
//         }
//       });
//       var mailOptions = {
//         to: user.email,
//         from: "learntocodeinfo@mail.com",
//         subject: "Your password has been changed",
//         text: "Hello,\n\n" +
//           "This is a confirmation that the password for your account " + user.email + " has just been changed.\n"
//       };
//       smtpTransport.sendMail(mailOptions, function(err) {
//         req.flash("success", "Success! Your password has been changed.");
//         done(err);
//       });
//     }
//   ], function(err) {
//       //error handling
//       if(err){
//       console.log(err);
//   } else {
//     res.redirect("/campgrounds");
//   }
//   });
// });

//user profile
router.get("/users/:id", function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", "Something went wrong..");
            req.redirect("/");
        }
        Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds){
         if(err){
            req.flash("error", "Something went wrong..");
            req.redirect("/");
        } 
        // eval(require("locus"));
        res.render("users/show", {user: foundUser, campgrounds: campgrounds});
        });
    });
});

//image access url: http://hillc255-2-hillc255.c9users.io/images/greatsmokymountains.png

module.exports = router;
