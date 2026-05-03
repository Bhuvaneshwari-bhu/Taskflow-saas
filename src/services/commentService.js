const Comment = require('../models/Comment');

const createComment = async ({ text, taskId, userId }) => {
    return Comment.create({ text, task: taskId, user: userId });
};

const getComments = async (taskId) => {
    return Comment.find({ task: taskId }).sort({ createdAt: 1 });
};

const getComment = async (commentId) => {
    return Comment.findById(commentId);
};

const deleteComment = async (commentId) => {
    return Comment.findByIdAndDelete(commentId);
};

module.exports = { createComment, getComments, getComment, deleteComment };
