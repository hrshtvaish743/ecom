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
    this.order_count = this.order_count + 1;
    return this.order_count;
};
configSchema.methods.incrementRoleCount = function() {
    this.role_count = this.role_count + 1;
    return this.role_count;
};
configSchema.methods.incrementUserCount = function() {
    this.user_count = this.user_count + 1
    return this.user_count;
};

configSchema.methods.decrementRoleCount = function() {
    this.role_count = this.role_count - 1;
    return this.role_count;
};
configSchema.methods.decrementUserCount = function() {
    this.user_count = this.user_count - 1;
    return this.user_count;
};

module.exports = mongoose.model('config', configSchema);
