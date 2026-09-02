const Class = require('../models/Class');

/**
 * Generates a class code in the form SUBJECTCODE_SECTION (e.g. MC0004_A),
 * matching the format shown in the project brief. If that exact combination
 * is already taken (a teacher re-using the same subject code + section,
 * possible after a previous class was soft-deleted), a numeric suffix is
 * appended (MC0004_A2, MC0004_A3, ...) until a free code is found.
 */
async function generateClassCode(subjectCode, section) {
  const base = `${subjectCode}_${section}`.toUpperCase().replace(/\s+/g, '');

  let candidate = base;
  let suffix = 1;

  // Loop guards against the rare collision case; in practice this runs once.
  while (await Class.findOne({ classCode: candidate })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }

  return candidate;
}

module.exports = { generateClassCode };
