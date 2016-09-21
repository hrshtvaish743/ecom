var User = require('../models/user');
var Role = require('../models/role')

var jwt = require('jsonwebtoken');
var config = require('../config/config.js');
var expressJwt = require('express-jwt');
var authenticate = expressJwt({
    secret: config.Secret
});
var jwt_decode = require('jwt-decode');


module.exports = function(app, passport) {

    // INDEX ===========================
    app.get('/', function(req, res) {
        res.json('Hello Windswept!');
    });

    // LOGIN =================================

    app.get('/login', function(req, res) {
        res.json(req.flash('loginMessage'));
    });

    app.post('/login', passport.authenticate('local-login', {
        failureRedirect: '/login', // redirect back to the login page if there is an error
        failureFlash: true, // allow flash messages
        session: false
    }), generateToken, respond);

    // SIGNUP =================================
    app.get('/signup', function(req, res) {
        res.json(req.flash('signupMessage'));
    });

    app.post('/signup', passport.authenticate('local-signup', {
        failureRedirect: '/signup',
        failureFlash: true,
        session: false
    }), generateToken, respond);

    // Pages after LOGIN ========================
    app.get('/:action', authenticate, function(req, res) {
        if (req.params.action == 'home') {
            res.json("home");
        }
    });



    app.get('/admin/login', function(req, res) {
        res.json(req.flash('AdminloginMessage'));
    });


    app.post('/admin/login', passport.authenticate('admin-login', {
        failureRedirect: '/admin/login', // redirect back to the login page if there is an error
        failureFlash: true, // allow flash messages
        session: false
    }), generateToken, respond);

    app.get('/admin/home', authenticate, function(req, res) {
        res.render('admin-home.ejs', {
            user: req.user
        });
    });

    app.post('/:param1/:param2', authenticate, function(req, res) {
        var decoded = jwt_decode(req.headers.authorization);
        if (decoded.role == 'admin') {
            if (req.params.param1 == 'user') {
                if (req.params.param2 == 'create') {
                    User.findOne({
                        'local.email': req.body.email
                    }, function(err, user) {
                        if (err) throw err;
                        if (user)
                            res.json({
                                status: 0,
                                message: 'User with that email already exist'
                            });
                        else {
                            newUser = new User();

                            newUser.local.email = req.body.email;
                            newUser.local.name = req.body.name;
                            newUser.local.password = newUser.generateHash(req.body.password);
                            newUser.local.role = req.body.role;

                            newUser.save(function(err) {
                                console.log('Saving user');
                                if (err)
                                    throw err;
                            });

                            res.json({
                                status: 1,
                                message: 'User created Successfully.'
                            })
                        }
                    });
                } else if (req.params.param2 == 'delete') {
                    User.findOneAndRemove({
                        'local.email': req.body.email
                    }, function(err, user) {
                        if (err) throw err;
                        if (!user) res.json({
                            status: 404,
                            message: 'User Not Found!'
                        });
                        else {
                            res.json({
                                status: 1,
                                message: 'User Deleted!'
                            });
                        }
                    });
                }
            } else if(req.params.param1 == 'roles') {
              if(req.params.param2 == 'add') {
                Role.findOne({'role' : req.body.role}, function(err, role) {
                  if(err) throw err;
                  if(role) res.json({
                    status : 0,
                    message : 'Role already exist!'
                  });
                  else {
                    newRole = new Role();
                    newRole.role = req.body.role;
                    newRole.save(function(err) {
                      if(err) throw err;
                      console.log('Saving Role');
                      res.json({
                        status : 1,
                        message : 'Role added Successfully!'
                      });
                    });
                  }
                });
              } else if(req.params.param2 == 'delete') {
                Role.findOneAndRemove({'role' : req.body.role}, function(err, role) {
                  if(err) throw err;
                  if(!role) res.json({
                    status : 404,
                    message : 'Role not found!'
                  });
                  else res.json({
                    status : 1,
                    message : 'Role deleted!'
                  });
                });
              } else if(req.params.param2 == 'update') {
                Role.findOne({'role' : req.body.role}, function(err, role) {
                  if(err) throw err;
                  if(!role) res.json({
                    status : 404,
                    message : 'Role not found'
                  });
                  else {
                    role.role = req.body.newRole;
                    role.save(function (err) {
                      if (err) throw err;
                      res.json({
                        status: 1,
                        message : 'Role updated'
                      });
                    });
                  }
                });
              } else if(req.params.param2 == ''){}
            } else if(req.params.param1 == 'functions');
        } else if(decoded.role != 'admin'){
            if(req.params.param1 == 'user' && req.params.param2 == 'update') {
              User.findOne({'local.email' : req.body.email}, function(err, user) {
                if (err) throw err;
                if(!user) res.json({
                  status :404,
                  message : 'User not found'
                });
                else {
                  user.local.name = req.body.newName;
                  //user.local.email = req.body.newEmail;

                  user.save(function(err) {
                    if(err) throw err;
                    res.json({
                      status : 1,
                      message : 'Profile updated'
                    });
                  });
                }
              });
            }
        }
        else res.json('Not a verified user!');
    });


}

function generateToken(req, res, next) {
    req.token = jwt.sign({
        id: req.user.id,
        role: req.user.local.role
    }, config.Secret, {
        expiresIn: 120 * 60
    });
    next();
}

function respond(req, res) {
    res.status(200).json({
        user: req.user,
        token: req.token
    });
}
