const Note = require('../models/Note');
const Class = require('../models/Class');
const path = require('path');
const fs = require('fs');

// @desc    Upload course note / document (Teacher only)
// @route   POST /api/notes
// @access  Private (Teacher)
exports.uploadNote = async (req, res, next) => {
  try {
    const { classId, title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please attach a document file.' });
    }

    if (!classId || !title) {
      return res.status(400).json({ success: false, message: 'Classroom ID and Title are required.' });
    }

    const note = await Note.create({
      class: classId,
      uploadedBy: req.user._id,
      title,
      description,
      filePath: `/uploads/${req.file.filename}`,
      fileType: path.extname(req.file.originalname).replace('.', '').toUpperCase(),
      fileSize: req.file.size
    });

    const populatedNote = await Note.findById(note._id).populate('uploadedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      note: populatedNote
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all notes for a class
// @route   GET /api/notes/class/:classId
// @access  Private
exports.getClassNotes = async (req, res, next) => {
  try {
    const { classId } = req.params;

    const notes = await Note.find({ class: classId })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete note and remove local file (Teacher only)
// @route   DELETE /api/notes/:noteId
// @access  Private (Teacher)
exports.deleteNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note material not found.' });
    }

    // Delete file from disk if exists
    const absoluteFilePath = path.join(__dirname, '..', note.filePath);
    if (fs.existsSync(absoluteFilePath)) {
      fs.unlinkSync(absoluteFilePath);
    }

    await Note.findByIdAndDelete(noteId);

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};