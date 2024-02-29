var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");
const utils = require("../utils/utils");

passport.use(new localStrategy(userModel.authenticate()));

router.get("/", function (req, res, next) {
  res.render("index", { nav: false });
});

router.get("/login", function (req, res, next) {
  res.render("login", { nav: false });
});

router.get("/register", function (req, res, next) {
  res.render("register", { nav: false });
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
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
  res.render("card", {
    postId,
    post,
    user,
    date: utils.formatRelativeTime,
    nav: true,
  });
});

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
  const regex = new RegExp(searchTerm);

  let users = await userModel.find({ username: { $regex: regex } });

  res.json(users);
});

router.post(
  "/createpost",
  isLoggedIn,
  upload.single("postimage"),
  async function (req, res, next) {
    const user = await userModel.findOne({
      username: req.session.passport.user
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

router.post("/register", function (req, res, next) {
  const data = new userModel({
    username: req.body.username,
    name: req.body.fullname,
    email: req.body.email,
  });

  userModel.register(data, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/profile",
  }),
  function (req, res, next) {}
);

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

module.exports = router;
