const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
require('dotenv').config();



const DB = process.env.DB_URL;

mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log(`connection successful`);
}).catch((err) => {
  console.error(`connection error: ${err.message}`);
});

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    unique: false,
    required: false
  },
  email: {
    type: String,
    unique: false,
    required: false
  },
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
  ],
  provider: String,
  accountId: String,
  github: {
    id: {
      type: String,
      unique: true, // Ensure uniqueness for GitHub IDs
      required: false,
    },
    username: String,
    // ... other relevant GitHub profile information
  },
  google: {
    id: {
      type: String,
      unique: true, // Ensure uniqueness for Google IDs
      required: false,
    },
    username: String,
    // ... other relevant Google profile information
  },
  message: {
    type: String,
    unique: false,
    required: false,
    default: '',
  }
});

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);