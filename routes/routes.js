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
            status: 1,
            message: 'Hello User'
        });
    });

    // SIGNUP =================================
    app.get('/signup', function(req, res) {
        if (req.flash('signupMessage').length > 0) {
            res.json({
                status: 0,
                message: req.flash('signupMessage')
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
        if (req.flash('loginMessage').length > 0) {
            res.json({
                status: 0,
                message: req.flash('loginMessage')
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


    app.post('/:param1/:param2', authenticate, refreshToken, function(req, res) {
        var decoded = jwt_decode(req.headers.authorization);
        if (req.params.param1 == 'user') {
            if (req.params.param2 == 'create') { //Creating an user
                Funct.findOne({
                    'functionName': 'CreateUser'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    else {
                        if (func.roles.indexOf(decoded.role) !== -1) {
                            Functions.CreateUser(req, res);
                        } else {
                            failureResponse(req, res, 'Not Authenticated');
                        }
                    }
                });
            } else if (req.params.param2 == 'delete') { //Deleting a user
                Funct.findOne({
                    'functionName': 'DeleteUser'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    else {
                        if (func.roles.indexOf(decoded.role) !== -1) {
                            Functions.DeleteUser(req, res);
                        } else {
                            failureResponse(req, res, 'Not Authenticated');
                        }
                    }
                });
            } else if (req.params.param2 == 'update') { //*** Profile updation** // Role can only be updated by admin
                Funct.findOne({
                    'functionName': 'UpdateProfile'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    else {
                        if (func.roles.indexOf(decoded.role) !== -1) {
                            Functions.UpdateProfile(req, res, decoded.role);
                        } else {
                            failureResponse(req, res, 'Not Authenticated');
                        }
                    }
                });
            } else {
                res.status(404).json({ // When no user route found
                    status: 404,
                    message: 'Not found'
                });
            }
        } else if (req.params.param1 == 'roles') {
            if (req.params.param2 == 'add') { //*** Addition a role by admin ***
                Funct.findOne({
                    'functionName': 'AddRole'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    else {
                        if (func.roles.indexOf(decoded.role) !== -1) {
                            Functions.AddRole(req, res);
                        } else {
                            failureResponse(req, res, 'Not Authenticated');
                        }
                    }
                });
            } else if (req.params.param2 == 'delete') { // ** Deletion of a role by admin ***
                Funct.findOne({
                    'functionName': 'DeleteRole'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    else {
                        if (func.roles.indexOf(decoded.role) !== -1) {
                            Functions.DeleteRole(req, res);
                        } else {
                            failureResponse(req, res, 'Not Authenticated');
                        }
                    }
                });
            } else if (req.params.param2 == 'update') { //Updation of a role by admin
                Funct.findOne({
                    'functionName': 'UpdateRole'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    else {
                        if (func.roles.indexOf(decoded.role) !== -1) {
                            Functions.UpdateRole(req, res);
                        } else {
                            failureResponse(req, res, 'Not Authenticated');
                        }
                    }
                });
            } else res.status(404).json({
                status: 404,
                message: 'Not Found'
            });
        } else if (req.params.param1 == 'functions') { //**** Function routes ***
            if (req.params.param2 == 'roles') { //To add allowed roles for each function
                Funct.findOne({
                    'functionName': 'AssignRoles'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    else {
                        if (func.roles.indexOf(decoded.role) !== -1) {
                            Functions.AssignRoles(req, res);
                        } else {
                            failureResponse(req, res, 'Not Authenticated');
                        }
                    }
                });
            } else if (req.params.param2 == 'add-funct' && decoded.role == 'admin') { //Temporary route to add functions
                Funct.findOne({
                    'functionName': req.body.functionName
                }, function(err, funct) {
                    if (!funct) {
                        Config.findOne({
                            'config': 'normal'
                        }, function(err, config) {
                            if (err) throw err;
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
                                    funct: newFunct,
                                    newToken: req.token
                                });
                            });
                        });
                    }
                });
            } else { // When no user route matches
                res.status(404).json({
                    status: 404,
                    message: 'Not found'
                });
            }
        } else if (req.params.param1 == 'orders') { //Routes for managing orders
            if (req.params.param2 == 'create') {      //Creating an order
                Funct.findOne({
                    'functionName': 'CreateOrder'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    if (func.roles.indexOf(decoded.role !== -1)) {
                        Functions.CreateOrder(req, res, decoded.role);
                    } else {
                        failureResponse(req, res, 'Not Authenticated');
                    }
                });
            } else if (req.params.param2 == 'all') {      //Getting list of orders by the respective user
                Funct.findOne({
                    'functionName': 'GetOrders'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    if (func.roles.indexOf(decoded.role) !== -1) {
                        Functions.GetOrders(req, res, decoded.role);
                    } else {
                        failureResponse(req, res, 'Not Authenticated');
                    }
                });
            } else if (req.params.param2 == 'cancel') {       //To cancel an order
                Funct.findOne({
                    'functionName': 'CancelOrder'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    if (func.roles.indexOf(decoded.role) !== -1) {
                        Functions.CancelOrder(req, res, decoded.role);
                    } else {
                        failureResponse(req, res, 'Not Authenticated');
                    }
                });
            } else if (req.params.param2 == 'cancelled') {        //Getting list of cancelled orders
                Funct.findOne({
                    'functionName': 'GetCancelledOrders'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    if (func.roles.indexOf(decoded.role) !== -1) {
                        Functions.GetCancelledOrders(req, res, decoded.role);
                    } else {
                        failureResponse(req, res, 'Not Authenticated');
                    }
                });
            } else if (req.params.param2 == 'createforuser') {      //Creating an order for a user
                Funct.findOne({
                    'functionName': 'CreateOrderForUser'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    if (func.roles.indexOf(decoded.role) !== -1) {
                        Functions.CreateOrderForUser(req, res);
                    } else {
                        failureResponse(req, res, 'Not Authenticated');
                    }
                });
            } else if (req.params.param2 == 'allorders') {        //Getting list of all orders
                Funct.findOne({
                    'functionName': 'GetAllOrders'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    if (func.roles.indexOf(decoded.role) !== -1) {
                        Functions.GetAllOrders(req, res);
                    } else {
                        failureResponse(req, res, 'Not Authenticated');
                    }
                });
            } else if (req.params.param2 == 'cancelforuser') {        // Cancelling order for a user
                Funct.findOne({
                    'functionName': 'CancelOrderForUser'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    if (func.roles.indexOf(decoded.role) !== -1) {
                        Functions.CancelOrderForUser(req, res);
                    } else {
                        failureResponse(req, res, 'Not Authenticated');
                    }
                });
            } else {          //Getting list of orders per user
                Funct.findOne({
                    'functionName': 'GetOrdersPerUser'
                }, function(err, func) {
                    if (err) throw err;
                    if (!func) failureResponse(req, res, 'Function Not Added');
                    if (func.roles.indexOf(decoded.role) !== -1) {
                        Functions.GetOrdersPerUser(req, res);
                    } else {
                        failureResponse(req, res, 'Not Authenticated');
                    }
                });
            }
        } else { // When no route matches
            res.status(404).json({
                status: 404,
                message: 'Not found!'
            });
        }
    });
}

function refreshToken(req, res, next) { // Function To Refresh Token on each request
    var decoded = jwt_decode(req.headers.authorization);
    req.token = jwt.sign({
        id: decoded.id,
        role: decoded.role,
        user_id: decoded.user_id
    }, config.Secret, {
        expiresIn: 120 * 60
    });
    next();
}

//Function to generate a JWT token using the website secret
function generateToken(req, res, next) {
    req.token = jwt.sign({
        id: req.user.id,
        role: req.user.local.role,
        user_id: req.user.user_id
    }, config.Secret, {
        expiresIn: 120 * 60
    });
    next();
}


//function to respond after generation on token
function respond(req, res) {
    res.status(200).json({
        status: 1,
        user: req.user,
        token: req.token
    });
}

function failureResponse(req, res, message) {
    res.json({
        status: 0,
        message: message,
        newToken: req.token
    });
}
