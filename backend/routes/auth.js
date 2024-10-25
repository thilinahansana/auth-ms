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

// Ensure user is authenticated before accessing the AppStream URL
router.get("/getAppStreamUrl", async (req, res, next) => {
  console.log(req.isAuthenticated());
  if (!req.session.isAuthenticated && !req.isAuthenticated()) {
    return res.redirect("/auth/signin"); // Redirect to sign-in if not authenticated
  }

  const email =
    req.session.account?.idTokenClaims?.preferred_username ||
    req.user?.emails[0].value;

  console.log(email);

  try {
    const response = await axios.get(
      `https://kecsb4zutd.execute-api.ap-south-1.amazonaws.com/dev/as-user?userId=${email}`
    );

    const appStreamUrl = response.data;
    if (appStreamUrl && appStreamUrl.stream_url) {
      return res.redirect(appStreamUrl.stream_url);
    } else {
      throw new Error(appStreamUrl.message);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
