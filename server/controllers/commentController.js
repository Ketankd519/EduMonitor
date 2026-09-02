const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Class = require('../models/Class');

// @desc    Add comment to a post
// @route   POST /api/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { postId, content } = req.body;

    if (!postId || !content) {
      return res.status(400).json({ success: false, message: 'Post ID and Comment Text are required.' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const newComment = await Comment.create({
      post: postId,
      author: req.user._id,
      content
    });

    const populatedComment = await Comment.findById(newComment._id).populate('author', 'name role avatar');

    res.status(201).json({
      success: true,
      message: 'Comment added.',
      comment: populatedComment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment (Comment Author or Teacher)
// @route   DELETE /api/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    const post = await Post.findById(comment.post);
    const classDoc = post ? await Class.findById(post.class) : null;

    const isTeacher = classDoc && classDoc.teacher.toString() === req.user._id.toString();
    const isAuthor = comment.author.toString() === req.user._id.toString();

    if (!isAuthor && !isTeacher) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment.' });
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: 'Comment removed.'
    });
  } catch (error) {
    next(error);
  }
};