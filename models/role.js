var mongoose = require('mongoose');

var roleSchema = mongoose.Schema({
    role: String
});

// methods ======================


module.exports = mongoose.model('role', roleSchema);
