const express = require("express");
const { Router } = express;
const {createAccountForUser} = require("./../../controller/user/admin.controller")

const admin = express.Router()

admin.use(express.json());

admin.post("/registerForUser", createAccountForUser)

module.exports = admin