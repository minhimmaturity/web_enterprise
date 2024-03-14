const express = require("express");
const { Router } = express;
const { editUserProfile, changePassword} = require('../../controller/user.controller');
const user = Router();

// Other routes...

user.put('/editProfile', editUserProfile);
user.put('/changePassword', changePassword);


module.exports = user;