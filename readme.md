#YelpCamp

#1 YelpCamp Setup
* Add Landing Page
* Add Campgrounds Page that lists all campgrounds

Each Campground has
* Name
* Image

#2 Layout and Basic Styling
* Create header and footer partials
* Add bootstrap css


#3 Creating New Campgrounds
* Setup new campground post route
* Add in body parser
* Setup route to show form
* Add basic unstyle form

#4 Style the campground page
* Add a better header/title
* Make campgrounds display in a grid

#5 Style the navbar and form
* Add a navbar to all templates
* Style the new campground form

#6 Add Mongoose
* Install and configure Mongoose
* Setup campground model
* Use campground model inside of our routes

#7 Show Page
* Review the RESTful routes we've seen so far
* Add description to our campground model
* Show db.collection.drop()
* Add a show route template

## RESTful Routes
name    url         verb        description
========================================================
INDEX   /dogs       GET         Display a list of dogs
NEW     /dogs/new   GET         Displays for to make new dogs
CREATE  /dogs       POST        Add new dog to db
SHOW    /dogs/:id   GET         Shows info about 1 dog


INDEX   /campgrounds
NEW     /campgrounds/new
CREATE  /campgrounds
SHOW    /campgrounds/:id

NEW     campgrounds/:id/comments/new   GET
CREATE  campgrounds/:idcomments        POST


