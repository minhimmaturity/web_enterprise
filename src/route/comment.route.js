const express = require("express");
const { Router } = express;
const { authMiddleware } = require("../middleware/checkRole");
const { Role } = require("@prisma/client");
const {
    createComment,
    getCommentsByContributionId,
    getComment,
    updateComment,
    deleteComment,
} = require("../controller/comment.controller");
const validate = require("../middleware/validate");
const checkDefaultPassword = require("../middleware/checkDefaultPassword");
const comment = Router();
const isLocked = require("../middleware/isLocked");

// Other routes...

comment.post("/:contributionId", authMiddleware([Role.COORDIONATOR]), isLocked, checkDefaultPassword, createComment);

comment.get("/:contributionId", authMiddleware([Role.COORDIONATOR]), isLocked, checkDefaultPassword, getCommentsByContributionId);

comment.get("/:id", authMiddleware([Role.COORDIONATOR]), isLocked, checkDefaultPassword, getComment);

comment.put("/edit/:id", authMiddleware([Role.COORDIONATOR]), isLocked, checkDefaultPassword, updateComment);

comment.delete("/delete/:id", authMiddleware([Role.COORDIONATOR]), isLocked, checkDefaultPassword, deleteComment);

module.exports = comment;
