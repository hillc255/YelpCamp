var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeocoder = require("node-geocoder");

var options = {
provider: "google",
httpAdapter: "https",
apiKey: process.env.GEOCODER_API_KEY,
formatter: null
};

var geocoder = NodeGeocoder(options);

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// INDEX - Show all campgrounds
router.get("/", (req, res) => {
    
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch = null;
    
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        
                Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
                Campground.count({name: regex}).exec(function (err, count) {
                    
        // Campground.find({name: regex}, (err, searchResults) => {
            if (err) {
                console.log(err);
                
                  res.redirect("back");
                  
            } else {
                // if (searchResults.length === 0) {
                //     req.flash("error", "Sorry, no campgrounds match your query. Please try again");
                //     return res.redirect("/campgrounds");
                
                if(allCampgrounds.length < 1) {
                        noMatch = "No campgrounds match that query. Please try again.";
                        return res.redirect("/campgrounds");
                   // }
                    
                }
                // res.render("campgrounds/index", {campgrounds: searchResults,
                // page: "campgrounds" });
                
                res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search });
                }
            });
        });
    } else {
        // Get all campgrounds from DB
        
         Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
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
//         Campground.find({}, (err, allCampgrounds) => {
//             if (err) {
//                 console.log(err);
//             } else {
//                 res.render("campgrounds/index", {campgrounds: allCampgrounds,
//                                                  page: "campgrounds" });
//             }
//         });
//     }
// });



// CREATE - add new campgrounds to db 
// router.post("/", middleware.isLoggedIn, function(req,res){
//     //get data from form and add to campgrounds array
//     var name = req.body.name;
//     var price = req.body.price;
//     var image = req.body.image;
//     var desc = req.body.description;
//     var author = {
//         id: req.user._id,
//         username: req.user.username
//     }
//     var newCampground = {name: name, price: price, image: image, description: desc, author:author}
//      //Create a new campground and save to DB
//     Campground.create(newCampground, function(err, newlyCreated){
//         if(err){
//             console.log(err);
//         } else {
//             //go back to campgrounds
//             console.log(newlyCreated);
//             res.redirect("/campgrounds");
//         }
//     });
// });


//CREATE - add new campground to DB with maps
router.post("/", middleware.isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var price = req.body.price;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }

  geocoder.geocode(req.body.location, function (err, data) {
    if (err ||!data.length) {
      req.flash("error", "Invalid address");
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    
    var newCampground = {name: name, price: price, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
  
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
  });
});



//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req,res){
    res.render("campgrounds/new");
});

//SHOW - shows more info about one campground
router.get("/:id", middleware.isLoggedIn, function(req,res){
    //find the campground with the provided id
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
	if(err || !foundCampground){
		req.flash("error", "Campground not found");
		res.redirect("back");
    } else {
        console.log(foundCampground);
        //render show template with that campgrond
        res.render("campgrounds/show", {campground: foundCampground});
	}
  });
});

//EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
            Campground.findById(req.params.id, function(err, foundCampground){
                if(err){
                   req.flash("Can't find campground"); 
                   res.redirect("/campgrounds");
                }
                 res.render("campgrounds/edit", {campground: foundCampground});
         });
});

//UPDATE CAMPGROUND ROUTE
// router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
//     //find and update the correct campground
//     Campground.findByIdAndUpdate(req.params.id, req.body.campground,
//             function(err, updatedCampground){
//              if(err) {
//                  res.redirect("/campgrounds");
//                  } else {
//                     res.redirect("/campgrounds/" + req.params.id);
//                  }
//           }); //redirect somewhere(show page)
// });

// PUT - updates campground in the database
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
      if(err || !data.length){
          req.flash("error", "Invalid address");
          return res.redirect("back");
      }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;
    
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
  });
});

//DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    // res.send("YOU ARE TRYING TO DELETE SOMETHING!");
    Campground.findByIdAndRemove(req.params.id, function(err){
       if(err){
           res.redirect("/campgrounds");
       } else {
           res.redirect("/campgrounds");
       }
    });
});


module.exports = router;