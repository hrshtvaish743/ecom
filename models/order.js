var mongoose = require('mongoose');

var orderSchema = mongoose.Schema({
    order_id: {
      required : true,
      type : Number,
      unique : true
    },
    ordered_by : String,
    contents : {
      required : true,
      type : [String]
    },
    cancelled : Boolean
});

module.exports = mongoose.model('order', orderSchema);
