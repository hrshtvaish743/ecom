// config/passport.js
// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var User = require('../models/user');
var Config = require('../models/config');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) {

            // find a user whose email is the same as the forms
            // we are checking to see if the user trying to login already exists
            User.findOne({
                'local.email': email
            }, function(err, user) {
                // if there are any errors, return the error
                if (err) {
                    return done(err);
                }
                // check to see if theres already a user with that email
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'This email is already taken!'));
                } else {
                    var user_id;
                    Config.findOne({'config' : 'normal'}, function(err, config) {
                      if(err) throw err;
                      user_id = config.incrementUserCount();
                      config.user_count = user_id;

                    // if there is no user with that email
                    // create the user
                    var newUser = new User();
                    // set the user's local credentialsc
                    newUser.local.password = newUser.generateHash(password); // use the generateHash function in our user model
                    newUser.local.email = email;
                    newUser.local.role = 'customer';
                    newUser.local.name = req.param('name');
                    newUser.user_id = user_id;
                    // save the user
                    newUser.save(function(err) {
                        if (err)
                            throw err;
                        config.save(function(err) {
                          if(err) throw err;
                        });
                        console.log('Saving user');
                        return done(null, newUser, req.flash('signupMessage', 'Successfully Signed up!'));
                    });
                    });
                }
            });
        }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function(req, email, password, done) {
            if (email)
                email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

            // asynchronous
            process.nextTick(function() {
                User.findOne({
                    'local.email': email
                }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // if no user is found, return the message
                    if (!user)
                        return done(null, false, req.flash('loginMessage', 'No user found.'));

                    if (!user.validPassword(password))
                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

                    // all is well, return user
                    else
                        return done(null, user, req.flash('loginMessage', 'Successfully Logged in!!'));
                });
            });

        }));

        passport.use('admin-login', new LocalStrategy({
                // by default, local strategy uses username and password, we will override with email
                usernameField: 'email',
                passwordField: 'password',
                passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
            },
            function(req, email, password, done) {
                if (email)
                    email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

                // asynchronous
                process.nextTick(function() {
                    User.findOne({
                        'local.email': email
                    }, function(err, user) {
                        // if there are any errors, return the error
                        if (err)
                            return done(err);

                        // if no user is found, return the message
                        if (!user)
                            return done(null, false, req.flash('AdminloginMessage', 'No user found.'));
                        if(user.local.role != 'admin')
                            return done(null, false, req.flash('AdminloginMessage', 'You are not the admin of the application'));

                        if (!user.validPassword(password))
                            return done(null, false, req.flash('AdminloginMessage', 'Oops! Wrong password.'));

                        // all is well, return user
                        else
                            return done(null, user, req.flash('AdminloginMessage', 'Successfully Logged in!!'));
                    });
                });

            }));

};
