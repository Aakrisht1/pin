const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  title: {
    type: String,
    required: true
},
  description: {
    type: String,
    required: true
},
  image: {
    type: String,
    required: true
},
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
}],
  saved: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
],
date: {
  type: Date,
  default: Date.now
},
shares: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "user"
}],
});

module.exports = mongoose.model("post", postSchema);
