// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
    user_id : {
      type : Number,
      required : true,
      unique : true
    },
    local: {
        email: {
            type: String,
            required: true,
            unique : true
        },
        password: {
            type: String,
            required: true
        },
        name: {
            type: String
        },
        role: String,
        verified: Boolean,
        resetPasswordToken: String,
        resetPasswordExpires: Date
    }
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('user', userSchema);
