const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: true,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

    // Migrate submissions index if old single-attempt unique index exists
    try {
      const submissionsCol = conn.connection.collection('submissions');
      const indexes = await submissionsCol.indexes();
      if (indexes.some((idx) => idx.name === 'assignment_1_student_1')) {
        await submissionsCol.dropIndex('assignment_1_student_1');
        console.log('[Database] Migrated submissions index: dropped assignment_1_student_1 for multi-attempt support.');
      }
    } catch (idxErr) {
      // ignore if collection is new or unindexed
    }
  } catch (error) {
    console.error(`[Database Error] Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;