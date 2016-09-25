var mongoose = require('mongoose');

var functionSchema = mongoose.Schema({
    function_id: {
      type : Number,
      unique : true,
      required: true
    },
    functionName: {
      type : String,
      required : true,
      unique : true
    },
    roles: [String]
});

module.exports = mongoose.model('function', functionSchema);
