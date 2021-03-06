const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/user-model");

router.post("/signup", (req, res) => {
  console.log("in signup");
  // const username = req.body.user.username;
  // const password = req.body.user.password;
  // const name = req.body.user.name;
  // const isCompany = req.body.user.isCompany;
  // const city = req.body.user.city;
  const { username, password, city, isCompany, name } = req.body.user;
  // console.log('this is the request body', req.body )
  if (!username || !password) {
    res.status(400).json({ message: "Provide username and password" });
    return;
  }
  User.findOne({ username }, (err, foundUser) => {
    if (err) {
      res.status(500).json({ message: "Username check went bad." });
      return;
    }
    if (foundUser) {
      res.status(400).json({
        message: "Username taken. Choose another one.",
      });
      return;
    }
    const salt = bcrypt.genSaltSync(10);
    const hashPass = bcrypt.hashSync(password, salt);
    const aNewUser = new User({
      username: username,
      password: hashPass,
      city,
      isCompany,
      name,
    });
    aNewUser.save((err) => {
      if (err) {
        res.status(400).json({
          message: "Saving user to database went wrong.",
        });
        return;
      }

      res.status(200).json(aNewUser);
    });
  });
});

router.post("/login", (req, res) => {
  passport.authenticate("local", (err, theUser, failureDetails) => {
    if (err) {
      res.status(500).json({
        message: "Something went wrong authenticating user",
      });
      return;
    }
    if (!theUser) {
      // "failureDetails" contains the error messages
      // from our logic in "LocalStrategy" { message: '...' }.
      res.status(401).json(failureDetails);
      return;
    }
    // save user in session
    req.login(theUser, (err) => {
      if (err) {
        res.status(500).json({ message: "Session save went bad." });
        return;
      }
      // We are now logged in (that's why we can also send req.user)
      res.status(200).json(theUser);
    });
  })(req, res);
});

router.post("/logout", (req, res) => {
  req.logout();
  res.status(200).json({ message: "Log out successful!" });
});

router.get("/loggedin", (req, res) => {
  if (req.isAuthenticated()) {
    //Some user is authenticated
    res.json(req.user);
    return;
  }
  //No one is authenticated
  res.json({});
});

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: `${process.env.CLIENT_HOSTNAME}/`,
    failureRedirect: `${process.env.CLIENT_HOSTNAME}/login`,
  })
);
module.exports = router;
