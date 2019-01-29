var mongoose = require("mongoose");

//Campground schema
var campgroundSchema = new mongoose.Schema({
    name:  String,
    price: String,
    image:	String,
    description: String,
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
    ]
});

//model for campground
module.exports = mongoose.model("Campground", campgroundSchema);
