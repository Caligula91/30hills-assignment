const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    id: Number,
    firstName: String,
    surname: String,
    age: Number,
    gender: String,
    friends: {
      type: [mongoose.Schema.ObjectId],
      ref: 'User',
    },
  },
);

const User = mongoose.model('User', UserSchema);

module.exports = User;
