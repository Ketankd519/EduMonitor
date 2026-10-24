const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Class = require('../models/Class');
const ClassMember = require('../models/ClassMember');
const fs = require('fs');
const path = require('path');

// @desc    Get all posts for a class with comments
// @route   GET /api/posts/class/:classId
// @access  Private
exports.getClassPosts = async (req, res, next) => {
  try {
    const { classId } = req.params;

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Classroom not found.' });
    }

    const isTeacher = classDoc.teacher.toString() === req.user._id.toString();
    const isEnrolled = await ClassMember.exists({ class: classId, student: req.user._id });

    if (!isTeacher && !isEnrolled) {
      return res.status(403).json({ success: false, message: 'Not authorized to view posts in this classroom.' });
    }

    const posts = await Post.find({ class: classId })
      .populate('author', 'name role avatar')
      .sort({ createdAt: -1 });

    // Fetch comments for each post
    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const comments = await Comment.find({ post: post._id })
          .populate('author', 'name role avatar')
          .sort({ createdAt: 1 });
        return {
          ...post.toObject(),
          comments
        };
      })
    );

    res.status(200).json({
      success: true,
      count: postsWithComments.length,
      posts: postsWithComments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new announcement post with optional image attachments (Teacher or Student)
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { classId, content } = req.body;
    const hasFiles = req.files && req.files.length > 0;

    if (!classId || (!content?.trim() && !hasFiles)) {
      if (hasFiles) {
        req.files.forEach((f) => {
          if (fs.existsSync(f.path)) {
            try { fs.unlinkSync(f.path); } catch (e) {}
          }
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Classroom ID and Post Content or Images are required.'
      });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      if (hasFiles) {
        req.files.forEach((f) => {
          if (fs.existsSync(f.path)) {
            try { fs.unlinkSync(f.path); } catch (e) {}
          }
        });
      }
      return res.status(404).json({ success: false, message: 'Classroom not found.' });
    }

    const isTeacher = classDoc.teacher.toString() === req.user._id.toString();
    const isEnrolled = await ClassMember.exists({ class: classId, student: req.user._id });

    if (!isTeacher && !isEnrolled) {
      if (hasFiles) {
        req.files.forEach((f) => {
          if (fs.existsSync(f.path)) {
            try { fs.unlinkSync(f.path); } catch (e) {}
          }
        });
      }
      return res.status(403).json({ success: false, message: 'Not authorized to post in this classroom.' });
    }

    const attachments = hasFiles ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const newPost = await Post.create({
      class: classId,
      author: req.user._id,
      content: content?.trim() || '',
      attachments
    });

    const populatedPost = await Post.findById(newPost._id).populate('author', 'name role avatar');

    res.status(201).json({
      success: true,
      message: 'Post created successfully.',
      post: { ...populatedPost.toObject(), comments: [] }
    });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      req.files.forEach((f) => {
        if (fs.existsSync(f.path)) {
          try { fs.unlinkSync(f.path); } catch (e) {}
        }
      });
    }
    next(error);
  }
};

// @desc    Delete post (Author or Teacher of the class)
// @route   DELETE /api/posts/:postId
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const classDoc = await Class.findById(post.class);
    const isTeacher = classDoc && classDoc.teacher.toString() === req.user._id.toString();
    const isAuthor = post.author.toString() === req.user._id.toString();

    if (!isAuthor && !isTeacher) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post.' });
    }

    // Unlink attached image files
    if (post.attachments && post.attachments.length > 0) {
      post.attachments.forEach((att) => {
        const filePath = path.join(__dirname, '..', att);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      });
    }

    await Post.findByIdAndDelete(postId);
    await Comment.deleteMany({ post: postId });

    res.status(200).json({
      success: true,
      message: 'Post and associated comments deleted.'
    });
  } catch (error) {
    next(error);
  }
};