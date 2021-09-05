/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const User = require('../../models/user');

/**
 * @api {get} /users/:id/friends Get Friends
 * @apiVersion 1.0.0
 * @apiName Get Friends
 * @apiDescription Get all users's friends
 * @apiGroup Users
 *
 * @apiSuccessExample Success-Response:
 HTTP/1.1 200 OK
 {
  "message": "Friends fetched successfully",
  "results": [
    {
      "_id": "61347f31d45ca1f286e2f8e2",
      "id": 2,
      "firstName": "Rob",
      "surname": "Fitz",
      "age": 23,
      "gender": "male",
      "friends": [
        "61347f31d45ca1f286e2f8e1",
        "61347f31d45ca1f286e2f8e3"
      ],
      "__v": 0
    }
  ]
 }
 */
exports.getFriends = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User
      .findOne({ id })
      .populate({ path: 'friends' })
      .lean();

    if (!user) throw new Error('Not Found');

    const { friends } = user;

    return res.status(200).send({
      message: 'Friends fetched successfully',
      results: friends,
    });
  } catch (err) {
    return res.status(err.status || 500).send(err.toString());
  }
};

/**
 * @api {get} /users/:id/suggested-friends Get Suggested Friends
 * @apiVersion 1.0.0
 * @apiName Get Suggested Friends
 * @apiDescription Get all users's suggested friends
 * @apiGroup Users
 *
 * @apiSuccessExample Success-Response:
 HTTP/1.1 200 OK
 {
  "message": "Suggested friends fetched successfully",
  "results": [
    {
      "friendOfFriend": {
        "_id": "61347fceec8f1bb6a4d69f2e",
        "id": 7,
        "firstName": "Sarah",
        "surname": "Lane",
        "age": 30,
        "gender": "female",
        "__v": 0
      },
      "mutualFriendsSum": 2,
      "isSuggested": true,
      "mutualFriends": [
        {
          "_id": "61347fceec8f1bb6a4d69f33",
          "id": 12,
          "firstName": "Laura",
          "surname": "Murphy",
          "age": 33,
          "gender": "female",
          "__v": 0
        },
        {
          "_id": "61347fceec8f1bb6a4d69f3b",
          "id": 20,
          "firstName": "Katy",
          "surname": "Couch",
          "age": 28,
          "gender": "female",
          "__v": 0
        }
      ]
    }
  ]
 }
 */
exports.getSuggestedFriends = (req, res, next) => {
  const { resultsMap } = req;

  const results = Array.from(resultsMap.values()).filter((el) => (el.isSuggested));

  return res.status(200).send({
    message: 'Suggested friends fetched successfully',
    results,
  });
};

/**
 * @api {get} /users/:id/friends-of-friends Get Friends of Friends
 * @apiVersion 1.0.0
 * @apiName Get Friends of Friends
 * @apiDescription Get all users's friends of friends
 * @apiGroup Users
 *
 * @apiSuccessExample Success-Response:
 HTTP/1.1 200 OK
 {
  "message": "Friends of friends fetched successfully",
  "results": [
    {
      "_id": "6134802258eb9f861cb78792",
      "id": 3,
      "firstName": "Ben",
      "surname": "O'Carolan",
      "age": null,
      "gender": "male",
      "__v": 0
    }
  ]
 }
 */
exports.getFriendsOfFriends = (req, res, next) => {
  const { resultsMap } = req;

  const results = Array.from(resultsMap.values()).map((el) => el.friendOfFriend);

  return res.status(200).send({
    message: 'Friends of friends fetched successfully',
    results,
  });
};

exports.friendOfFriendsHandler = async (req, res, next) => {
  try {
    const suggestedThreshold = 2;

    const { id } = req.params;

    const user = await User.findOne({ id }).lean();
    if (!user) throw new Error('Not Found');
    const { friends, _id: userId } = user;

    // exclude user's friends and yourself from final results
    const friendsSet = new Set(
      [...friends.map((el) => el.toString()),
        userId.toString(),
      ],
    );

    const resultsMap = new Map();

    const cursor = User
      .find({ _id: { $in: friends } })
      .populate({ path: 'friends' })
      .lean()
      .cursor();

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      for (const friendOfFriend of doc.friends) {
        const friendOfFriendKey = friendOfFriend._id.toString();

        if (!friendsSet.has(friendOfFriendKey)) {
          const friendOfFriendObj = resultsMap.get(friendOfFriendKey);

          friendOfFriend.friends = undefined;
          doc.friends = undefined;

          if (friendOfFriendObj) {
            friendOfFriendObj.mutualFriends.push(doc);
            friendOfFriendObj.mutualFriendsSum += 1;
            friendOfFriendObj.isSuggested = friendOfFriendObj.mutualFriendsSum >= suggestedThreshold;
          } else {
            resultsMap.set(friendOfFriendKey, {
              friendOfFriend, mutualFriendsSum: 1, isSuggested: suggestedThreshold <= 1, mutualFriends: [doc],
            });
          }
        }
      }
    }

    // Results map containts all informtaions about friends of friends
    // including informations about mutual friends
    req.resultsMap = resultsMap;

    return next();
  } catch (err) {
    return res.status(err.status || 500).send(err.toString());
  }
};
