const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = require("../authConfig");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, // Your Google Client ID
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Your Google Client Secret
      callbackURL: "/auth/google/callback", // Google callback route
    },
    function (accessToken, refreshToken, profile, done) {
      // Logic to handle the Google profile and link it with the user database.
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

module.exports = passport;
