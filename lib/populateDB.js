/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const fs = require('fs');
const mongoose = require('mongoose');
const User = require('../models/user');

const createUserModels = (users) => {
  const usersMap = new Map();

  // init map with users
  for (const user of users) {
    const userModel = new User({
      id: user.id,
      firstName: user.firstName,
      surname: user.surname,
      age: user.age,
      gender: user.gender,
    });
    usersMap.set(user.id, userModel);
  }

  // set user's friends
  for (const user of users) {
    const userModel = usersMap.get(user.id);
    const friends = user.friends.map((friendId) => usersMap.get(friendId)._id);
    userModel.friends = friends;
  }

  return Array.from(usersMap.values());
};

const dropUsers = async () => {
  try {
    await mongoose.connection.db.dropCollection('users');
    console.log('Droped old users collection');
  } catch (err) {
    if (err.message !== 'ns not found') console.log(err);
  }
};

module.exports = async () => {
  await dropUsers();
  const data = fs.readFileSync('./dev-data/data.json', 'utf8');
  const users = JSON.parse(data);
  const usersModel = createUserModels(users);
  await User.insertMany(usersModel);
};
