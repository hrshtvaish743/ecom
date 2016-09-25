var mongoose = require('mongoose');

var functionSchema = mongoose.Schema({
    function_id: {
      type : Number,
      unique : true,
      required: true
    },
    functionName: {
      type : String,
      required : true
    },
    functionRoute : {
      type : String,
      unique : true,
      required : true
    },
    roles: [String]
});

module.exports = mongoose.model('function', functionSchema);
