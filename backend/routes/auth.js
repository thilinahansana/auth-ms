const express = require("express");
const axios = require("axios"); // Import axios
const authProvider = require("../auth/AuthProvider");
const {
  REDIRECT_URI,
  POST_LOGOUT_REDIRECT_URI,
  APPSTREAM_API_URL,
} = require("../authConfig");

const router = express.Router();

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
  if (!req.session.isAuthenticated) {
    return res.redirect("/auth/signin");
  }

  try {
    // Call your API to get the AppStream URL using axios
    const response = await axios.get(
      `https://kecsb4zutd.execute-api.ap-south-1.amazonaws.com/dev/as-user?userId=Naveen`
    );
    console.log(response.data);

    const appStreamUrl = response.data;

    // Check if a valid URL is returned
    if (appStreamUrl && appStreamUrl.stream_url) {
      // Redirect to the AppStream URL
      return res.redirect(appStreamUrl.stream_url);
    } else {
      throw new Error("AppStream URL not found");
    }
  } catch (error) {
    next(error); // Handle error appropriately
  }
});

module.exports = router;
