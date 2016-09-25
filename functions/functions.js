var User = require('../models/user');
var Config = require('../models/config');
var Order = require('../models/order');

module.exports = {

    CreateOrder: function(req, id, callback) {
            Config.findOne({
                'config': 'normal'
            }, function(err, config) {
                var order_id = config.incrementOrderCount();
                config.order_count = order_id;
                var newOrder = new Order();
                newOrder.order_id = order_id;
                newOrder.contents = req.body.adverts;
                newOrder.ordered_by = id;
                newOrder.save(function(err) {
                    if (err) throw err;
                    config.save(function(err) {
                        if (err) throw err;
                    });
                    return callback(order_id);
                });
            });

    },

    GetOrders: function(req, res, id, callback) {
        User.findById(id, function(err, user) {
            if (err) throw err;
            Order.find({
                'ordered_by': user.user_id
            }, function(err, orders) {
                if (err) throw err;
                if (!orders) res.json({
                    status: 0,
                    message: 'Nothing ordered by this user'
                });
                else {
                    return callback(orders);
                }
            });
        });
    },

    CancelOrder: function(req, res, id, callback) {
        User.findById(id, function(err, user) {
            if (err) throw err;
            Order.findOne({
                'ordered_by': user.user_id,
                'order_id': req.body.order_id
            }, function(err, order) {
                if (err) throw err;
                if (!order) res.json({
                    status: 0,
                    message: 'Order not Found'
                });
                else {
                    if (order.cancelled) {
                        res.json({
                            status: 0,
                            message: 'Order is already cancelled'
                        });
                    } else {
                        order.cancelled = true;
                        order.save(function(err) {
                            if (err) throw err;
                            return callback(order);
                        });
                    }
                }
            });
        });
    },

    GetCancelledOrders : function(req, res, id, callback) {

    },


    ShowOrdersAdminSales : function (req, res, id, callback) {
      Orders.find({}, function(err,orders) {
        if(err) throw err;
        if(!orders) res.json({
          status : 0,
          message : 'No order found'
        });
        else {
          callback(orders);
        }
      })
    }
}
