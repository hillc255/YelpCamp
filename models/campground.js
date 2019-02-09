var mongoose = require("mongoose");
var Comment = require("./comment");
var Review = require("./review");

//Campground schema
var campgroundSchema = new mongoose.Schema({
    name:  String,
    price: String,
    image:	String,
    parkName: String,
    parkAddress: String,
    parkPhone: String,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt: { type: Date, default: Date.now },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
       username: String 
    },
    comments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Comment"
        }
    ],
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    rating: {
        type: Number,
        default: 0
    }
});

//model for campground
module.exports = mongoose.model("Campground", campgroundSchema);
