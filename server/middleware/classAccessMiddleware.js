const Class = require('../models/Class');
const ClassMember = require('../models/ClassMember');
const { error } = require('../utils/apiResponse');

/**
 * Core access check, reusable outside of Express middleware (e.g. from
 * assignment/submission controllers where the class isn't in the route
 * params directly, but resolved via an Assignment/Post document).
 *
 * Returns { targetClass, isOwner, isMember }. targetClass is null if the
 * class doesn't exist or is soft-deleted.
 */
async function checkClassAccess(classId, user) {
  const targetClass = await Class.findOne({ _id: classId, isActive: true });
  if (!targetClass) {
    return { targetClass: null, isOwner: false, isMember: false };
  }

  const isOwner = targetClass.teacher.toString() === user._id.toString();
  let isMember = isOwner;

  if (!isOwner && user.role === 'student') {
    const membership = await ClassMember.findOne({ class: classId, student: user._id });
    isMember = !!membership;
  }

  return { targetClass, isOwner, isMember };
}

/**
 * Express middleware wrapping checkClassAccess for routes where the
 * class ID is directly in the URL params. Attaches req.classDoc and
 * req.isClassOwner for downstream handlers.
 *
 * Must run after `protect`.
 */
function requireClassMember(paramName = 'classId') {
  return async (req, res, next) => {
    try {
      const classId = req.params[paramName];
      const { targetClass, isMember, isOwner } = await checkClassAccess(classId, req.user);

      if (!targetClass) {
        return error(res, 404, 'Class not found');
      }
      if (!isMember) {
        return error(res, 403, 'You do not have access to this class');
      }

      req.classDoc = targetClass;
      req.isClassOwner = isOwner;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireClassMember, checkClassAccess };
