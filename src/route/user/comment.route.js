const express = require("express");
const { Router } = express;
const { authMiddleware } = require("../../middleware/checkRole");
const { Role } = require("@prisma/client");
const {
    createComment,
    getCommentsByContributionId,
    getComment,
    updateComment,
    deleteComment,
} = require("../../controller/comment.controller");
const validate = require("../../middleware/validate");
const checkDefaultPassword = require("../../middleware/checkDefaultPassword");
const comment = Router();
const isLocked = require("../../middleware/isLocked");
const { validationResult } = require("express-validator");

// Other routes...


comment.post(
    "/:contributionId",
    [
        validate.validateCreateComment(), // Validation middleware
        authMiddleware([Role.COORDIONATOR]), // Authorization middleware
        isLocked, // Middleware to check if the user is locked
        checkDefaultPassword // Middleware to check the default password
    ],
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        // Proceed to create comment if validation passed
        createComment(req, res, next);
    }
);

  

comment.get("/:contributionId", authMiddleware([Role.COORDIONATOR]), isLocked, checkDefaultPassword, getCommentsByContributionId);
comment.get("/:id", authMiddleware([Role.COORDIONATOR]), isLocked, checkDefaultPassword, getComment);

comment.put("/edit/:id",  [
    validate.validateUpdateComment(), // Validation middleware
    authMiddleware([Role.COORDIONATOR]), // Authorization middleware
    isLocked, // Middleware to check if the user is locked
    checkDefaultPassword // Middleware to check the default password
],
(req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    // Proceed to create comment if validation passed
    updateComment(req, res, next);
});

comment.delete("/delete/:id", authMiddleware([Role.COORDIONATOR]), isLocked, checkDefaultPassword, deleteComment);

module.exports = comment;