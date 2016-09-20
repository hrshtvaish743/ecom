var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var functionSchema = mongoose.Schema({

    role: String,
    funct: String
});

// methods ======================


module.exports = mongoose.model('function', functionSchema);
