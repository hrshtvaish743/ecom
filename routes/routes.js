var User = require('../models/user');
var Role = require('../models/role');
var Funct = require('../models/function');
var Order = require('../models/order');
var Config = require('../models/config');
var Functions = require('../functions/functions');

var jwt = require('jsonwebtoken');
var config = require('../config/config.js');
var expressJwt = require('express-jwt');
var authenticate = expressJwt({
    secret: config.Secret
});
var jwt_decode = require('jwt-decode');
var async = require('async');


module.exports = function(app, passport) {

    // INDEX ===========================
    app.get('/', function(req, res) {
        res.json({
          status : 1,
          message : 'Hello User'
        });
    });

    // SIGNUP =================================
    app.get('/signup', function(req, res) {
      if(req.flash('signupMessage').length > 0) {
        res.json({
          status : 0,
          message : req.flash('signupMessage')
        });
      } else {
        res.redirect('/');
      }
    });

    app.post('/signup', passport.authenticate('local-signup', {
        failureRedirect: '/signup',
        failureFlash: true,
        session: false
    }), generateToken, respond);

    // LOGIN =================================

    app.get('/login', function(req, res) {
      if(req.flash('loginMessage').length > 0) {
        res.json({
          status : 0,
          message : req.flash('loginMessage')
        });
      } else {
        res.redirect('/');
      }
    });

    app.post('/login', passport.authenticate('local-login', {
        failureRedirect: '/login', // redirect back to the login page if there is an error
        failureFlash: true, // allow flash messages
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
                        Config.findOne({
                            'config': 'normal'
                        }, function(err, config) {
                            if (err) throw err;
                            var user_id = config.incrementUserCount();
                            newUser = new User();
                            newUser.local.email = req.body.email;
                            newUser.local.name = req.body.name;
                            newUser.local.password = newUser.generateHash(req.body.password);
                            newUser.local.role = req.body.role;
                            newUser.user_id = user_id;
                            newUser.save(function(err) {

                                if (err)
                                    throw err;
                                config.save(function(err) {
                                    if (err) throw err;
                                });
                                console.log('Saving user');
                                res.json({
                                    status: 1,
                                    message: 'User created Successfully.'
                                });
                            });
                        });
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
                        Config.findOne({
                            'config': 'normal'
                        }, function(err, config) {
                            if (err) throw err;
                            var count = config.decrementUserCount();
                            config.save(function(err) {
                                if (err) throw err;
                                res.json({
                                    status: 1,
                                    message: 'User Deleted!'
                                });
                            });
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
                status: 404,
                message: 'Not found'
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
                        Config.findOne({
                            'config': 'normal'
                        }, function(err, config) {
                            var role_id = config.incrementRoleCount();
                            newRole = new Role();
                            newRole.role = req.body.role;
                            newRole.role_id = role_id;
                            newRole.save(function(err) {
                                if (err) throw err;
                                config.save(function(err) {
                                    if (err) throw err;
                                });
                                console.log('Saving Role');
                                res.json({
                                    status: 1,
                                    message: 'Role added Successfully!'
                                });
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
                    else {
                        Config.findOne({
                            'config': 'normal'
                        }, function(err, config) {
                            var count = config.decrementRoleCount();
                            config.save(function(err) {
                                if (err) throw err;
                                res.json({
                                    status: 1,
                                    message: 'Role deleted!'
                                });
                            });
                        });
                    }
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
                status: 404,
                message: 'Not Found'
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
                        var roles;
                        if (!funct.roles) {
                            roles = [];
                        } else roles = funct.roles;
                        for (var i = 0; i < req.body.roles.length; i++) {
                            roles.push(req.body.roles[i]);
                        }
                        var roles = ArrNoDupe(roles);
                        funct.roles = roles;
                        funct.save(function(err) {
                            if (err) throw err;
                            res.json({
                                status: 1,
                                message: 'Roles added to the function',
                                newRoles: roles
                            });
                        });
                    }
                });
            } else if (req.params.param2 == 'add-funct' && decoded.role == 'admin') {
                Funct.findOne({
                    'functionName': req.body.functionName
                }, function(err, funct) {
                    if (!funct) {
                      Config.findOne({'config' : 'normal'}, function(err,config) {
                        if(err) throw err;
                        var function_id = config.function_count + 1;
                        config.function_count = function_id;
                        newFunct = new Funct();
                        newFunct.functionName = req.body.functionName;
                        newFunct.function_id = function_id;
                        newFunct.functionRoute = req.body.functionRoute;
                        newFunct.save(function(err) {
                            config.save();
                            res.json({
                                status: 1,
                                message: 'Function added',
                                funct : newFunct
                            });
                        });
                        });
                    }
                });
            } else res.status(404).json({
                status: 404,
                message: 'Not found'
            });
        } else if (req.params.param1 == 'orders') {
            if (req.params.param2 == 'create') {
              Funct.findOne({'functionName' : 'CreateOrder'}, function(err, func) {
                if(err) throw err;
                if(func.roles.indexOf(decoded.role !== -1)) {
                  Functions.CreateOrder(req, decoded.id, function(order_id) {
                      res.json({
                          status: 1,
                          order_id: order_id
                      });
                  });
                }
              })

            } else if (req.params.param2 == 'all') {
                Funct.findOne({'functionName' : 'GetOrders'}, function(err, func) {
                  if(err) throw err;
                  if(func.roles.indexOf(decoded.role) !== -1){
                  Functions.GetOrders(req,res,decoded.id, function(orders) {
                    res.json({
                      status : 1,
                      orders : orders
                    });
                  });
                } else res.json({
                  status : 0,
                  message : 'Not Authenticated'
                });
                });

            } else if (req.params.param2 == 'cancel') {
                Functions.CancelOrder(req,res,decoded.id, function(order) {
                  res.json({
                    status : 1,
                    order : order
                  });
                });
            }
        } else res.status(404).json({
            status: 404,
            message: 'Not found!'
        });
    });

    app.get('/:param1/:param2?', authenticate, function(req, res) {
        var decoded = jwt_decode(req.headers.authorization);
        if (req.params.param1 == 'functions' && req.params.param2) {
            Funct.findOne({
                'functionName': req.params.param2
            }, function(err, funct) {
                if (err) throw err;
                if (!funct) {
                    res.json({
                        status: 0,
                        message: 'Function not found'
                    });
                } else {
                    if (funct.roles.indexOf(decoded.role) !== -1) {
                        res.json({
                            status: 1,
                            message: 'You can access this function'
                        });
                    } else {
                        res.json({
                            status: 0,
                            message: 'You cannot access this function'
                        });
                    }
                }
            });
        } else if (req.params.param1 == 'functions' && !req.params.param2) { //to get list of all the functions
            if (decoded.role == 'admin') {
                Funct.find({}, function(err, funct) {
                    if (err) throw err;
                    if (!funct) {
                        res.json({
                            status: 0,
                            message: 'No function found'
                        });
                    } else {
                        res.json({
                            status: 1,
                            functions: funct
                        });
                    }
                });
            }
        } else res.json({
            status: 0
        });
    });
}

//Function to generate a JWT token using the website secret
function generateToken(req, res, next) {
    req.token = jwt.sign({
        id: req.user.id,
        role: req.user.local.role,
        user_id : req.user.user_id
    }, config.Secret, {
        expiresIn: 120 * 60
    });
    next();
}


//function to respond after generation on token
function respond(req, res) {
    res.status(200).json({
        status : 1,
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
