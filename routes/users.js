const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

const DB = 'mongodb+srv://Aakrisht:Aakrisht123@cluster0.mong0me.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log(`connection successful`);
}).catch((err) => {
  console.error(`connection error: ${err.message}`);
});

const userSchema = mongoose.Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  profileImage: String,
  boardRefs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "post",
    default: []
  }],
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
  saved: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user" 
    } 
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user" 
    }
  ]
});

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);