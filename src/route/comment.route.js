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

// Other routes...

comment.post("/:contributionId", authMiddleware([Role.COORDIONATOR]), checkDefaultPassword, createComment);

comment.get("/:contributionId", authMiddleware([Role.COORDIONATOR]), checkDefaultPassword, getCommentsByContributionId);

comment.get("/:id", authMiddleware([Role.COORDIONATOR]), checkDefaultPassword, getComment);

comment.put("/edit/:id", authMiddleware([Role.COORDIONATOR]), checkDefaultPassword, updateComment);

comment.delete("/delete/:id", authMiddleware([Role.COORDIONATOR]), checkDefaultPassword, deleteComment);

module.exports = comment;
