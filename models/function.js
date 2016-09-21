var mongoose = require('mongoose');

var functionSchema = mongoose.Schema({
    functionName: String,
    roles: [String]
});

module.exports = mongoose.model('function', functionSchema);
