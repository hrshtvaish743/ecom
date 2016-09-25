var mongoose = require('mongoose');

var roleSchema = mongoose.Schema({
    role: {
      type : String,
      required : true
    },
    role_id : {
      type : Number,
      required : true,
      unique : true
    }
});

// methods ======================


module.exports = mongoose.model('role', roleSchema);
