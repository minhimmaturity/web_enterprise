const express = require("express");
const { Router } = express;
const {createAccountForUser, createAcademicYear} = require("../../controller/admin.controller")

const admin = express.Router()

admin.use(express.json());

admin.post("/registerForUser", createAccountForUser)

admin.post("/createAcademicYear", createAcademicYear)

module.exports = admin