var User = require('../models/user');
var Config = require('../models/config');
var Order = require('../models/order');
var Role = require('../models/role');
var Funct = require('../models/function');

module.exports = {

    //====================================
    //======= Creation of an order =======
    //====================================
    CreateOrder: function(req, res, id) {
        User.findOne({'local.user_id' : id }, function(err, user) {
            if (err) throw err;
            Config.findOne({
                'config': 'normal'
            }, function(err, config) {
                var order_id = config.incrementOrderCount();
                var newOrder = new Order();
                newOrder.order_id = order_id;
                newOrder.contents = req.body.adverts;
                newOrder.ordered_by = user.user_id;
                newOrder.save(function(err) {
                    if (err) throw err;
                    config.save(function(err) {
                        if (err) throw err;
                    });
                    res.json({
                        status: 1,
                        message: 'Order created',
                        order: newOrder,
                        newToken: req.token
                    });
                });
            });
        });
    },

    //=====================================================
    //======= Get all orders by the respective user =======
    //=====================================================
    GetOrders: function(req, res, id) {
        User.findOne({'local.user_id' : id }, function(err, user) {
            if (err) throw err;
            Order.find({
                'ordered_by': user.user_id
            }, function(err, orders) {
                if (err) throw err;
                if (!orders) res.json({
                    status: 0,
                    message: 'Nothing ordered',
                    newToken: req.token
                });
                else {
                    res.json({
                        status: 1,
                        orders: orders,
                        newToken: req.token
                    });
                }
            });
        });
    },

    //================================================
    //======= Cancellation of an order by user =======
    //================================================

    CancelOrder: function(req, res, id) {
        User.findOne({'local.user_id' : id }, function(err, user) {
            if (err) throw err;
            Order.findOne({
                'ordered_by': user.user_id,
                'order_id': req.body.order_id
            }, function(err, order) {
                if (err) throw err;
                if (!order) res.json({
                    status: 0,
                    message: 'Order not Found',
                    newToken: req.token
                });
                else {
                    if (order.cancelled) {
                        res.json({
                            status: 0,
                            message: 'Order is already cancelled',
                            newToken: req.token
                        });
                    } else {
                        order.cancelled = true;
                        order.save(function(err) {
                            if (err) throw err;
                            res.json({
                                status: 1,
                                message: 'Order cancelled',
                                order: order,
                                newToken: req.token
                            });
                        });
                    }
                }
            });
        });
    },

    //=======================================================================
    //======= Getting list of cancelled orders by the respective user =======
    //=======================================================================

    GetCancelledOrders: function(req, res, id) {
        User.findOne({'local.user_id' : id }, function(err, user) {
            if (err) throw err;
            Order.find({
                'ordered_by': user.user_id,
                'cancelled': true
            }, function(err, orders) {
                if (err) throw err;
                if (!orders) res.json({
                    status: 0,
                    message: 'No order found',
                    newToken: req.token
                });
                else res.json({
                    status: 1,
                    orders: orders,
                    newToken: req.token
                });
            });
        });
    },

    //=====================================================
    //======= Creation of an order for another user =======
    //=====================================================

    CreateOrderForUser: function(req, res) {
        Config.findOne({
            'config': 'normal'
        }, function(err, config) {
            var order_id = config.incrementOrderCount();
            var newOrder = new Order();
            newOrder.order_id = order_id;
            newOrder.contents = req.body.adverts;
            newOrder.ordered_by = req.body.user_id;
            newOrder.save(function(err) {
                if (err) throw err;
                config.save(function(err) {
                    if (err) throw err;
                });
                res.json({
                    status: 1,
                    message: 'Order created',
                    order: newOrder,
                    newToken: req.token
                });
            });
        });
    },

    //===============================================
    //======= Getting list of orders per user =======
    //===============================================

    GetOrdersPerUser: function(req, res) {
        Order.find({
            'ordered_by': req.body.user_id
        }, function(err, orders) {
            if (err) throw err;
            if (!orders) res.json({
                status: 0,
                message: 'Nothing ordered',
                newToken: req.token
            });
            else {
                res.json({
                    status: 1,
                    orders: orders,
                    newToken: req.token
                });
            }
        });
    },

    //=====================================================
    //======= Gettig list of all orders ever placed =======
    //=====================================================

    GetAllOrders: function(req, res) {
        Orders.find({}, function(err, orders) {
            if (err) throw err;
            if (!orders) res.json({
                status: 0,
                message: 'No order found',
                newToken: req.token
            });
            else {
                res.json({
                    status: 1,
                    orders: orders,
                    newToken: req.token
                });
            }
        });
    },

    //===========================================
    //======= Cancel an order for an user =======
    //===========================================

    CancelOrderForUser: function(req, res) {
        Order.findOne({
            'ordered_by': req.body.user_id,
            'order_id': req.body.order_id
        }, function(err, order) {
            if (err) throw err;
            if (!order) res.json({
                status: 0,
                message: 'Order not Found',
                newToken: req.token
            });
            else {
                if (order.cancelled) {
                    res.json({
                        status: 0,
                        message: 'Order is already cancelled',
                        newToken: req.token
                    });
                } else {
                    order.cancelled = true;
                    order.save(function(err) {
                        if (err) throw err;
                        res.json({
                            status: 1,
                            message: 'Order cancelled',
                            order: order,
                            newToken: req.token
                        });
                    });
                }
            }
        });
    },

    //=========================================
    //======= Search orders ===================
    //=========================================

    SearchOrder: function(req, res) {

    },

    //=========================================
    //======= Update Profile ==================
    //=========================================
    //====== Only Admin can change role =======

    UpdateProfile: function(req, res, role) {
        User.findOne({
            'local.email': req.body.email
        }, function(err, user) {
            if (err) throw err;
            if (!user) res.json({
                status: 404,
                message: 'User not found',
                newToken: req.token
            });
            else {
                if(req.body.newName)
                  user.local.name = req.body.newName;
                if (role == 'admin' && req.body.newRole) {
                    user.local.role = req.body.newRole;
                }
                user.save(function(err) {
                    if (err) throw err;
                    res.json({
                        status: 1,
                        message: 'Profile updated',
                        newToken: req.token
                    });
                });
            }
        });
    },

    //=========================================
    //======= Creation of an user =============
    //=========================================

    CreateUser: function(req, res) {
        User.findOne({
            'local.email': req.body.email
        }, function(err, user) {
            if (err) throw err;
            if (user)
                res.json({
                    status: 0,
                    message: 'User with that email already exist',
                    newToken: req.token
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
                            message: 'User created Successfully.',
                            user: newUser,
                            newToken: req.token
                        });
                    });
                });
            }
        });
    },

    //==================================
    //======= Addition of a role =======
    //==================================

    AddRole: function(req, res) {
        Role.findOne({
            'role': req.body.role
        }, function(err, role) {
            if (err) throw err;
            if (role) res.json({
                status: 0,
                message: 'Role already exist!',
                newToken: req.token
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
                            message: 'Role added Successfully!',
                            newToken: req.token
                        });
                    });
                });
            }
        });
    },

    //==================================
    //======= Deletion of a role =======
    //==================================

    DeleteRole: function(req, res) {
        Role.findOneAndRemove({
            'role': req.body.role
        }, function(err, role) {
            if (err) throw err;
            if (!role) res.json({
                status: 404,
                message: 'Role not found!',
                newToken: req.token
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
                            message: 'Role deleted!',
                            newToken: req.token
                        });
                    });
                });
            }
        });
    },

    //==================================
    //======= Updation of a role =======
    //==================================

    UpdateRole: function(req, res) {
        Role.findOne({
            'role': req.body.role
        }, function(err, role) {
            if (err) throw err;
            if (!role) res.json({
                status: 404,
                message: 'Role not found',
                newToken: req.token
            });
            else {
                role.role = req.body.newRole;
                role.save(function(err) {
                    if (err) throw err;
                    res.json({
                        status: 1,
                        message: 'Role updated',
                        newToken: req.token
                    });
                });
            }
        });
    },

    //=============================================
    //======= Assigning roles to a function =======
    //=============================================

    AssignRoles: function(req, res) {
        Funct.findOne({
            'functionName': req.body.functionName
        }, function(err, funct) {
            if (err) throw err;
            if (!funct) res.json({
                status: 404,
                message: 'Function not found!',
                newToken: req.token
            });
            else {
                var roles;
                if (!funct.roles) {
                    roles = [];
                } else roles = funct.roles;
                for (var i = 0; i < req.body.roles.length; i++) {
                    roles.push(req.body.roles[i]);
                }
                var temp = {};
                for (var i = 0; i < roles.length; i++)
                    temp[roles[i]] = true;
                roles = Object.keys(temp);
                funct.roles = roles;
                funct.save(function(err) {
                    if (err) throw err;
                    console.log(req.token);
                    res.json({
                        status: 1,
                        message: 'Roles added to the function',
                        funct: funct,
                        newToken: req.token
                    });
                });
            }
        });
    },

    //=================================
    //======= Deletion of a user ======
    //=================================

    DeleteUser: function(req, res) {
        User.findOneAndRemove({
            'local.email': req.body.email
        }, function(err, user) {
            if (err) throw err;
            if (!user) res.json({
                status: 404,
                message: 'User Not Found!',
                newToken: req.token
            });
            else {
                Config.findOne({
                    'config': 'normal'
                }, function(err, config) {
                    if (err) throw err;
                    config.decrementUserCount();
                    config.save(function(err) {
                        if (err) throw err;
                        res.json({
                            status: 1,
                            message: 'User Deleted!',
                            newToken: req.token
                        });
                    });
                });
            }
        });
    }
}
