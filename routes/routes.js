var User = require('../models/user');
var Role = require('../models/role')
var Funct = require('../models/function')

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


    app.get('/admin/login', function(req, res) {
        res.json(req.flash('AdminloginMessage'));
    });


    app.post('/admin/login', passport.authenticate('admin-login', {
        failureRedirect: '/admin/login', // redirect back to the login page if there is an error
        failureFlash: true, // allow flash messages
        session: false
    }), generateToken, respond);


    app.post('/:param1/:param2', authenticate, function(req, res) {
        var decoded = jwt_decode(req.headers.authorization);

        // *** User routes ***
        if (req.params.param1 == 'user') {
            //*** Creating user by admin ***
            if (req.params.param2 == 'create' && decoded.role == 'admin') {
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
            }

            //** Deleting a user by admin
            else if (req.params.param2 == 'delete' && decoded.role == 'admin') {
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
            //*** Profile updation**
            // Role can only be updated by admin
            else if (req.params.param2 == 'update') {
                User.findOne({
                    'local.email': req.body.email
                }, function(err, user) {
                    if (err) throw err;
                    if (!user) res.json({
                        status: 404,
                        message: 'User not found'
                    });
                    else {
                        user.local.name = req.body.newName;
                        if (decoded.role == 'admin' && req.body.newRole) {
                            user.local.role = req.body.newRole;
                        }
                        user.save(function(err) {
                            if (err) throw err;
                            res.json({
                                status: 1,
                                message: 'Profile updated'
                            });
                        });
                    }
                });
            } else res.status(404).json({
              status : 404,
              message : 'Not found'
            });
        }
        //*** User Routes over ****

        //*******Roles routes**********
        else if (req.params.param1 == 'roles') {
            //*** Addition a role by admin ***
            if (req.params.param2 == 'add') {
                Role.findOne({
                    'role': req.body.role
                }, function(err, role) {
                    if (err) throw err;
                    if (role) res.json({
                        status: 0,
                        message: 'Role already exist!'
                    });
                    else {
                        newRole = new Role();
                        newRole.role = req.body.role;
                        newRole.save(function(err) {
                            if (err) throw err;
                            console.log('Saving Role');
                            res.json({
                                status: 1,
                                message: 'Role added Successfully!'
                            });
                        });
                    }
                });
            }
            // ** Deletion of a role by admin ***
            else if (req.params.param2 == 'delete') {
                Role.findOneAndRemove({
                    'role': req.body.role
                }, function(err, role) {
                    if (err) throw err;
                    if (!role) res.json({
                        status: 404,
                        message: 'Role not found!'
                    });
                    else res.json({
                        status: 1,
                        message: 'Role deleted!'
                    });
                });
            }
            //*** Updation of a role by admin
            else if (req.params.param2 == 'update') {
                Role.findOne({
                    'role': req.body.role
                }, function(err, role) {
                    if (err) throw err;
                    if (!role) res.json({
                        status: 404,
                        message: 'Role not found'
                    });
                    else {
                        role.role = req.body.newRole;
                        role.save(function(err) {
                            if (err) throw err;
                            res.json({
                                status: 1,
                                message: 'Role updated'
                            });
                        });
                    }
                });
            } else res.status(404).json({
              status : 404,
              message : 'Not Found'
            });
        }

        //****Roles routes over ***
        //**** Functions routes ***
        else if (req.params.param1 == 'functions') {
            if (req.params.param2 == 'roles' && decoded.role == 'admin') {
                Funct.findOne({
                    'functionName': req.body.functionName
                }, function(err, funct) {
                    if (err) throw err;
                    if (!funct) res.json({
                        status: 404,
                        message: 'Function not found!'
                    });
                    else {
                        console.log(req.body.roles);
                        var roles;
                        if (!funct.roles) {
                            roles = [];
                        } else roles = funct.roles;
                        console.log(roles);
                        for (var i = 0; i < req.body.roles.length; i++) {
                            roles.push(req.body.roles[i]);
                        }
                        var roles = ArrNoDupe(roles);
                        funct.roles = roles;
                        funct.save(function(err) {
                            if (err) throw err;
                            res.json({
                                status: 1,
                                message : 'Roles added to the function',
                                newRoles : roles
                            });
                        });
                    }
                });
            } else if (req.params.param2 == 'add-funct' && decoded.role == 'admin') {
                Funct.findOne({
                    'functionName': req.body.functionName
                }, function(err, funct) {
                    if (!funct) {
                        newFunct = new Funct();
                        newFunct.functionName = req.body.functionName;
                        newFunct.save(function(err) {
                            res.json({
                                status: 1,
                                message: 'Function added'
                            });
                        });
                    }
                });
            } else res.status(404).json({
              status : 404,
              message : 'Not found'
            });
        } else res.status(404).json({
          status : 404,
          message : 'Not found!'
        });
    });

    app.get('/:param1/:param2?', authenticate, function(req, res) {
      var decoded = jwt_decode(req.headers.authorization);
      if(req.params.param1 == 'functions' && req.params.param2) {
        Funct.findOne({
          'functionName' : req.params.param2
        }, function(err, funct) {
          if(err) throw err;
          if(!funct) {
            res.json({
              status : 0,
              message : 'Function not found'
            });
          } else {
            if(funct.roles.indexOf(decoded.role) !== -1) {
              res.json({
                status : 1,
                message : 'You can access this function'
              });
            } else {
              res.json({
                status : 0,
                message : 'You cannot access this function'
              });
            }
          }
        });
      } else if(req.params.param1 == 'functions' && !req.params.param2) { //to get list of all the functions
          if(decoded.role == 'admin') {
            Funct.find({}, function(err, funct) {
              if (err) throw err;
              if(!funct) {
                res.json({
                  status : 0,
                  message : 'No function found'
                });
              } else {
                res.json({
                  status : 1,
                  functions : funct
                });
              }
            });
          }
      } else res.json({
        status : 0
      });
    });
}

//Function to generate a JWT token using the website secret
function generateToken(req, res, next) {
    req.token = jwt.sign({
        id: req.user.id,
        role: req.user.local.role
    }, config.Secret, {
        expiresIn: 120 * 60
    });
    next();
}

//function to respond after generation on token
function respond(req, res) {
    res.status(200).json({
        user: req.user,
        token: req.token
    });
}

//Function to ensure there are no duplicates in the roles array
function ArrNoDupe(roles) {
    var temp = {};
    for (var i = 0; i < roles.length; i++)
        temp[roles[i]] = true;
    return Object.keys(temp);
}
