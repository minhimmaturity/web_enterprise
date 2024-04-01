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

comment.post("/:contributionId", authMiddleware([Role.STUDENT, Role.COORDIONATOR, Role.MANAGER]), checkDefaultPassword, createComment);

comment.get("/:contributionId", authMiddleware([Role.STUDENT, Role.COORDIONATOR, Role.MANAGER]), checkDefaultPassword, getCommentsByContributionId);

comment.get("/:id", authMiddleware([Role.STUDENT, Role.COORDIONATOR, Role.MANAGER]), checkDefaultPassword, getComment);

comment.put("/edit/:id", authMiddleware([Role.STUDENT, Role.COORDIONATOR, Role.MANAGER]), checkDefaultPassword, updateComment);

comment.delete("/delete/:id", authMiddleware([Role.STUDENT, Role.COORDIONATOR, Role.MANAGER]), checkDefaultPassword, deleteComment);

module.exports = comment;
