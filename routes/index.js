const express = require("express");
const router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const localStrategy = require("passport-local");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require("passport-github").Strategy;  // Add GitHubStrategy
const upload = require("./multer");
const utils = require("../utils/utils");
const mongodb = require("mongodb");
const post = require("./post");


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if the user already exists in your database
    const user = await userModel.findOne({ 'google.id': profile.id });

    if (user) {
      return done(null, user);
    } 
    const usernameExists = await userModel.findOne({ username: profile.displayName });

    if (usernameExists) {
      // Prompt the user to choose a different username
      const newUser = new userModel({
        username: generateUniqueUsername(profile.displayName),
        google: {
          id: profile.id,
          // ... other relevant Google profile information
        },
        github: {
          id: profile.id,
          // ... other relevant Google profile information
        },
      });

      await newUser.save();
      return done(null, newUser);
    }

    // Create a new user in your database with Google profile information
    const newUser = new userModel({
      username: profile.displayName,
      google: {
        id: profile.id,
        // ... other relevant Google profile information
      },
      github: {
        id: profile.id,
        username: profile.username,
        // ... other relevant Google profile information
      },
    });

    await newUser.save();
    return done(null, newUser);
  } catch (err) {
    return done(err);
  }
}));

function generateUniqueUsername(baseUsername) {
  // You can implement a logic to generate a unique username based on the baseUsername
  // For example, by appending a number or a unique identifier
  // This is just a simple example; adjust it based on your requirements
  const randomNumber1 = Math.floor(Math.random() * 10000);
  return `${baseUsername}${randomNumber1}`;
}


router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: "/", successRedirect: "/profile" }),
  (req, res) => {
    // Successful Google authentication
    res.redirect('/profile', {nav: true});
  });


// GitHub authentication setup
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if the user already exists in your database
    const user = await userModel.findOne({ 'github.id': profile.id });

    if (user) {
      return done(null, user);
    } // Check if the username already exists
    const usernameExists = await userModel.findOne({ username: profile.username });

    if (usernameExists) {
      // Prompt the user to choose a different username
      const newUser = new userModel({
        username: generateUniqueUsername(profile.username),
        github: {
          id: profile.id,
          // ... other relevant GitHub profile information
        },
        google: {
          id: profile.id,
          // ... other relevant Google profile information
        },
      });

      await newUser.save();
      return done(null, newUser);
    }

    // Create a new user in your database with GitHub profile information
    const newUser = new userModel({
      username: profile.username,
      github: {
        id: profile.id,
        // ... other relevant GitHub profile information
      },
      google: {
        id: profile.id,
        username: profile.username,
        // ... other relevant Google profile information
      },
    });

    await newUser.save();
    return done(null, newUser);
  } catch (err) {
    return done(err);
  }
}));

function generateUniqueUsername(baseUsername) {
  // You can implement a logic to generate a unique username based on the baseUsername
  // For example, by appending a number or a unique identifier
  // This is just a simple example; adjust it based on your requirements
  const randomNumber = Math.floor(Math.random() * 1000);
  return `${baseUsername}${randomNumber}`;
}


passport.use(new localStrategy(userModel.authenticate()));

// Serialize and deserialize users
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

router.get("/", function (req, res, next) {
  res.render("index", { nav: false });
});

// ... (rest of your routes)

// GitHub authentication routes
router.get("/auth/github", passport.authenticate("github"));

router.get("/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/", successRedirect: "/profile" }),
  (req, res) => {
    // Successful GitHub authentication
    res.redirect("/profile", {nav: true});
  }
);

// ... (rest of your routes)



router.get("/login", function (req, res, next) {
  res.render("login", { nav: false });
});

router.get("/register", function (req, res, next) {
  const errorMessage = '';
  res.render("register", {message: errorMessage, nav: false });
});

router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  const userS = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("saved");
  const Upost = await postModel.findOne({ _id: req.params.id });
  const postId = req.params.postId;
  const post = await postModel.findById(Upost).populate("user");
  res.render("profile", { user, userS, Upost, postId, post, nav: true });
});

router.get("/userprofile/:userId", isLoggedIn, async (req, res) => {
  const userId = req.params.userId;
  const userSess = await userModel.findOne({
    username: req.session.passport.user,
  });
  const user = await userModel.findOne({ username: userId }).populate("posts");
  res.render("userprofile", { user, userSess, nav: true });
});

router.get("/edit", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("edit", { nav: true, user });
});

router.post("/update", isLoggedIn, async function (req, res) {
  const user = await userModel.findOneAndUpdate(
    { username: req.session.passport.user },
    { username: req.body.username, name: req.body.name, email: req.body.email },
    { new: true }
  );
  req.login(user, function (err) {
    if (err) throw err;
    res.redirect("/profile");
  });
});

router.get("/follow/:userid", isLoggedIn, async function (req, res) {
  let followKarneWaala = await userModel.findOne({
    username: req.session.passport.user,
  });

  let followHoneWaala = await userModel.findOne({ _id: req.params.userid });

  if (followKarneWaala.following.indexOf(followHoneWaala._id) !== -1) {
    let index = followKarneWaala.following.indexOf(followHoneWaala._id);
    followKarneWaala.following.splice(index, 1);

    let index2 = followHoneWaala.followers.indexOf(followKarneWaala._id);
    followHoneWaala.followers.splice(index2, 1);
  } else {
    followHoneWaala.followers.push(followKarneWaala._id);
    followKarneWaala.following.push(followHoneWaala._id);
  }

  await followHoneWaala.save();
  await followKarneWaala.save();

  res.redirect("back");
});

router.get("/show/posts", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  res.render("show", { user, nav: true });
});

router.get("/saved/posts", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("saved");
  const Upost = await postModel.findOne({ _id: req.params.id });
  const postId = req.params.postId;
  const post = await postModel.findById(Upost).populate("user");
  res.render("saved", { user, Upost, postId, post, nav: true });
});

router.get("/card/:postId", isLoggedIn, async function (req, res, next) {
  const postId = req.params.postId;
  const post = await postModel.findById(postId).populate("user");
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  res.render("card", {
    postId,
    post,
    user,
    date: utils.formatRelativeTime,
    nav: true,
  });
});

router.get("/post/:postId", isLoggedIn, async function (req, res, next) {
  const postId = req.params.postId;
  const post = await postModel.findById(postId).populate("user");
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  res.render("post", {
    postId,
    post,
    user,
    date: utils.formatRelativeTime,
    nav: true,
  });
});

router.delete("/delete/pin/:id", isLoggedIn, async function (req, res, next) {
  const postId = req.params.id;
  const result = await postModel.deleteOne({ _id: new mongodb.ObjectId(postId) });
  console.log(result);
}

);

router.get("/feed", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const posts = await postModel.find().populate("user");
  res.render("feed", { user, posts, nav: true });
});

router.get("/add", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("add", { user, nav: true });
});

router.get("/search", isLoggedIn, async function (req, res) {
  let user = await userModel.findOne({ username: req.session.passport.user });
  const userId = req.user._id;

  res.render("search", { nav: true, user, userId });
});

router.get("/search/:user", isLoggedIn, async function (req, res) {
  const searchTerm = `^${req.params.user}`;
  const regex = new RegExp(searchTerm , 'i');

  let users = await userModel.find({ username: { $regex: regex } });

  res.json(users);
});

router.post(
  "/createpost",
  isLoggedIn,
  upload.single("postimage"),
  async function (req, res, next) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    const post = await postModel.create({
      user: user._id,
      title: req.body.title,
      description: req.body.description,
      image: req.file.filename,
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
  }
);

router.post(
  "/fileupload",
  isLoggedIn,
  upload.single("image"),
  async function (req, res, next) {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    user.profileImage = req.file.filename;
    await user.save();
    res.redirect("/profile");
  }
);

router.get("/like/post/:id", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const Upost = await postModel.findOne({ _id: req.params.id });
  const postId = req.params.id;
  const post = await postModel.findById(Upost).populate("user");

  if (post.likes.indexOf(user._id) === -1) {
    post.likes.push(user._id);
  } else {
    post.likes.splice(post.likes.indexOf(user._id), 1);
  }
  await post.save();
  res.redirect(`/card/${postId}`);
});

router.get("/save/post/:id", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const Upost = await postModel.findOne({ _id: req.params.id });
  const postId = req.params.id;
  const post = await postModel.findById(Upost).populate("user");

  if (post.saved.indexOf(user._id) === -1) {
    post.saved.push(user._id);
    user.saved.push(post._id);
    s = 1;
  } else {
    post.saved.splice(post.saved.indexOf(user._id), 1);
    user.saved.splice(user.saved.indexOf(post._id), 1);
    s = 0;
  }

  await user.save();
  await post.save();
  res.redirect(`/card/${postId}`);
});

router.post("/register", async function (req, res, next) {
  try {
    // Check if the username already exists
    const usernameExists = await userModel.findOne({ username: req.body.username });

    if (usernameExists) {
      // Prompt the user to choose a different username
      const errorMessage = 'Username already exists. Please choose a different username.';
      res.render("register", { message: errorMessage, nav: false });
      return;
    }

    // Create a new user in your database
    const data = new userModel({
      username: req.body.username,
      name: req.body.fullname,
      email: req.body.email,
      google: {
        id: req.body.username,
        username: req.body.username,
        // ... other relevant Google profile information
      },
      github: {
        id: req.body.username,
        username: req.body.username,
        // ... other relevant Google profile information
      },
    });

    // Register the user
    userModel.register(data, req.body.password, (err, user) => {
      if (err) {
        // Handle registration error (e.g., display an error message)
        const errorMessage = 'Registration failed. Please try again.';
        res.render("register", { message: errorMessage, nav: false });
        return;
      }

      // Log in the user after successful registration
      passport.authenticate("local")(req, res, function () {
        res.redirect("/profile");
      });
    });
  } catch (err) {
    // Handle unexpected errors
    console.error(err);
    const errorMessage = 'An unexpected error occurred. Please try again.';
    res.render("register", { message: errorMessage, nav: false });
  }
});


router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/profile",
  }),
  function (req, res, next) { }
);

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/",);
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login", {nav: false});
}

module.exports = router;
