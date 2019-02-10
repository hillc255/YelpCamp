var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeocoder = require("node-geocoder");
var Review = require("../models/review");
var Comment = require("../models/comment");

//Multer/Cloudinary - image upload
var multer = require('multer');
var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({
    storage: storage,
    fileFilter: imageFilter
});

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'hillc255',
    api_key: '<add api_key for Heroku>',
    api_secret: '<add api_secret for Heroku>'
    //keys are set in .env file for c9 
    //api_key: process.env.CLOUDINARY_API_KEY,
    //api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloud9 local image access url example: 
// http://hillc255-2-hillc255.c9users.io/images/greatsmokymountains.png

//Google maps
var options = {
    provider: "google",
    httpAdapter: "https",
    // keys are set in .env file
    // apiKey: process.env.GEOCODER_API_KEY,
    apiKey: "<add google apiKey for Heroku>", 
    formatter: null
};

var geocoder = NodeGeocoder(options);

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// Index - Show all campgrounds
router.get("/", (req, res) => {

    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch = null;

    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({
            name: regex
        }).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            // handle error
            if (err) {
                console.log(err.message);
            }
            Campground.count({
                name: regex
            }).exec(function (err, count) {
                if (err) {
                    console.log(err);
                    res.redirect("back");

                } else {
                    if (allCampgrounds.length < 1) {
                        noMatch = "No campgrounds match that query. Please try again.";
                        return res.redirect("/campgrounds");
                    }
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
    } else {
        // Get all campgrounds from DB
        Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            //catch err
            if (err) {
                console.log(err.message);
            }
            Campground.count().exec(function (err, count) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
});

//Create - add new campground to DB with maps
router.post("/", middleware.isLoggedIn, upload.single('image'), function (req, res) {
    cloudinary.uploader.upload(req.file.path, function (result) {
        // get data from form and add to campgrounds array
        var name = req.body.name;
        var price = req.body.price;
        // var image = req.body.image;
        //add cloudinary url for the image to the campground object under image property
        var image = result.secure_url;
        var desc = req.body.description;
        var pname = req.body.parkName;
        var paddress = req.body.parkAddress;
        var pphone = req.body.parkPhone;
        var author = {
            id: req.user._id,
            username: req.user.username
        }

        geocoder.geocode(req.body.location, function (err, data) {
            if (err || !data.length) {
                req.flash("error", "Invalid address");
                return res.redirect('back');
            }
            var lat = data[0].latitude;
            var lng = data[0].longitude;
            var location = data[0].formattedAddress;


            var newCampground = {
                name: name,
                price: price,
                image: image,
                description: desc,
                author: author,
                location: location,
                lat: lat,
                lng: lng,
                parkName: pname,
                parkAddress: paddress,
                parkPhone: pphone
            };

            // Create a new campground and save to DB
            Campground.create(newCampground, function (err, newlyCreated) {
                if (err) {
                    console.log(err);
                    req.flash('error', err.message);
                    return res.redirect('back');
                } else {
                    //redirect back to campgrounds page
                    console.log(newlyCreated);
                    res.redirect("/campgrounds");
                }
            });
        });
    });
});


//New - show form to create new campground
router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("campgrounds/new");
});

// Show - shows more info about one campground
router.get("/:id", middleware.isLoggedIn, function (req, res) {
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {
            sort: {
                createdAt: -1
            }
        }
    }).exec(function (err, foundCampground) {
        if (err || !foundCampground) {
            console.log(err);
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else {
            console.log(foundCampground);
            //render show template with that campground
            res.render("campgrounds/show", {
                campground: foundCampground
            });
        }
    });
});

// Edit campground route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err) {
            req.flash("Can't find campground");
            res.redirect("/campgrounds");
        }
        res.render("campgrounds/edit", {
            campground: foundCampground
        });
    });
});


// Put - updates campground route in the database
router.put("/:id", middleware.checkCampgroundOwnership, function (req, res) {
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash("error", "Invalid update");
            return res.redirect("back");
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;

        Campground.findByIdAndUpdate(req.params.id, req.body.campground, function (err, updatedCampground) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success", "Successfully Updated!");
                res.redirect("/campgrounds/" + req.params.id);
            }
        });
    });
});

// Destroy Campground Route
router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            // deletes all comments associated with the campground
            Comment.remove({
                "_id": {
                    $in: campground.comments
                }
            }, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/campgrounds");
                }
                // deletes all reviews associated with the campground
                Review.remove({
                    "_id": {
                        $in: campground.reviews
                    }
                }, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }
                    //  delete the campground
                    campground.remove();
                    req.flash("success", "Campground deleted successfully!");
                    res.redirect("/campgrounds");
                });
            });
        }
    });
});


module.exports = router;