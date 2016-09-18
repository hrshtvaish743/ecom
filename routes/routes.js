module.exports = function(app, passport) {

    // NDEX ===========================
    app.get('/', function(req, res) {
        res.json('Hello Windswept!');
    });

    // LOGIN =================================

    app.get('/login', function(req, res) {
      res.json(req.flash('loginMessage'));
    });

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/home', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // SIGNUP =================================
    app.get('/signup', function(req, res) {
      res.json(req.flash('signupMessage'));
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/home', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // Landing page after LOGIN ========================
    app.get('/home', isLoggedIn, function(req, res) {
      response = {
        signup : req.flash('signupMessage'),
        login : req.flash('loginMessage'),
        home: 'Welcome to home page'
      }
      res.json(response);
    });

    // LOGOUT =============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.json('Logged Out');
    });

}

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.json('Not Logged In!');
}
