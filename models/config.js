var mongoose = require('mongoose');

var configSchema = mongoose.Schema({
    config : String,
    order_count: {
      type : Number
    },
    role_count : {
      type : Number
    },
    function_count : {
      type : Number
    },
    user_count : {
      type : Number
    }
});

configSchema.methods.incrementOrderCount = function() {
    return this.order_count + 1;
};
configSchema.methods.incrementRoleCount = function() {
    return this.role_count + 1;
};
configSchema.methods.incrementUserCount = function() {
    console.log(this.user_count);
    return this.user_count + 1;
};

configSchema.methods.decrementRoleCount = function() {
    return this.role_count - 1;
};
configSchema.methods.decrementUserCount = function() {
    console.log(this.user_count);
    return this.user_count - 1;
};

module.exports = mongoose.model('config', configSchema);
