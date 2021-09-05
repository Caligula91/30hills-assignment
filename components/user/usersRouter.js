const express = require('express');
const usersController = require('./usersController');

const router = express.Router();

router.get('/users/:id/friends', usersController.getFriends);

router.get('/users/:id/friends-of-friends',
  usersController.friendOfFriendsHandler,
  usersController.getFriendsOfFriends);

router.get('/users/:id/suggested-friends',
  usersController.friendOfFriendsHandler,
  usersController.getSuggestedFriends);

module.exports = router;
