const express = require("express");
const axios = require("axios"); // Import axios
const authProvider = require("../auth/AuthProvider");
const { REDIRECT_URI, POST_LOGOUT_REDIRECT_URI } = require("../authConfig");
const passport = require("passport");

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Sign-In callback route
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // Successful authentication, redirect to the app.
    console.log("Google Sign-In successful");
    res.redirect("/auth/getAppStreamUrl"); // Redirect to your AppStream URL route
  }
);

// Sign-out for Google
router.get("/google/signout", (req, res) => {
  req.logout();
  res.redirect("/");
});

router.get(
  "/signin",
  authProvider.login({
    scopes: [],
    redirectUri: REDIRECT_URI,
    successRedirect: "getAppStreamUrl", // Redirect to AppStream URL
  })
);

router.get(
  "/acquireToken",
  authProvider.acquireToken({
    scopes: ["User.Read"],
    redirectUri: REDIRECT_URI,
    successRedirect: "/users/profile",
  })
);

router.post("/redirect", authProvider.handleRedirect());

router.get(
  "/signout",
  authProvider.logout({
    postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URI,
  })
);

router.get("/getAppStreamUrl", async (req, res, next) => {
  console.log(req.isAuthenticated());
  if (!req.session.isAuthenticated && !req.isAuthenticated()) {
    return res.redirect("/auth/signin");
  }

  const email =
    req.session.account?.idTokenClaims?.preferred_username ||
    req.user?.emails[0].value;

  console.log(email);

  try {
    const response = await axios.get(
      `https://kecsb4zutd.execute-api.ap-south-1.amazonaws.com/dev/as-user?userId=${email}`
    );
    const data = response.data;

    const start_time = new Date(data.start_time);

    console.log(start_time);

    // Check if the response contains stream_url
    if (data.stream_url) {
      return res.redirect(data.stream_url);
    } else if (
      data.statusCode === 403 &&
      data.message === "User should wait until session starts"
    ) {
      
      // Pass start time and current time to countdown view
      return res.render("countdown", {
        message: data.message,
        startTime: start_time,
        nowTime: data.now_time,
      });
    } else {
      // Handle other error cases
      res.render("aserror", { errorMessage: data.message });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
