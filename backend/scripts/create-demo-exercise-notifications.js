const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/classroom_assistant_example';
  await mongoose.connect(uri, { autoIndex: false });
  console.log(`[create-demo-exercise-notifications] Connected to MongoDB: ${uri}`);
  try {
    const db = mongoose.connection.db;
    const notifications = db.collection('notifications');
    const studentExercises = db.collection('student_exercises');

    // Load demo ids
    const idsPath = path.join(__dirname, 'demo-ids.json');
    if (!fs.existsSync(idsPath)) {
      throw new Error('demo-ids.json not found. Run setup scripts first.');
    }
    const ids = JSON.parse(fs.readFileSync(idsPath, 'utf8'));
    const toOid = (s) => new mongoose.Types.ObjectId(s);

    const teacherId = toOid(ids.teacherId);
    const courseId = toOid(ids.courseId);

    // Resolve John Doe user id
    const john = await db.collection('users').findOne({ name: 'John Doe' }, { projection: { _id: 1, name: 1 } });
    if (!john?._id) {
      console.log('[create-demo-exercise-notifications] John Doe not found. Abort.');
      return;
    }

    // Find the latest completed exercise for John Doe in the course
    const latest = await studentExercises
      .find({ courseId: courseId, status: 'completed', studentId: john._id })
      .project({ _id: 1, title: 1, studentId: 1 })
      .sort({ _id: -1 })
      .limit(1)
      .toArray();

    if (!latest.length) {
      console.log('[create-demo-exercise-notifications] No completed exercises for John Doe. Abort.');
      return;
    }

    const ex = latest[0];
    const now = new Date();

    // Skip if data incomplete to avoid generic notifications
    if (!ex.title) {
      console.log(`[create-demo-exercise-notifications] Missing exercise title for ${ex._id}, skipping`);
      return;
    }

    // Idempotency: avoid duplicate for same exercise
    const existing = await notifications.findOne({
      type: 'exercise_completed',
      'metadata.exerciseId': ex._id
    });
    if (existing) {
      console.log(`[create-demo-exercise-notifications] Notification already exists for exercise ${ex._id}, skipping`);
      return;
    }

    const doc = {
      teacherId,
      studentId: ex.studentId,
      courseId,
      type: 'exercise_completed',
      title: `${john.name} completed an exercise`,
      message: `${john.name} completed exercise: ${ex.title}`,
      priority: 1,
      isRead: false,
      metadata: {
        exerciseId: ex._id,
        exerciseTitle: ex.title
      },
      createdAt: now,
      updatedAt: now
    };
    const res = await notifications.insertOne(doc);
    console.log(`[create-demo-exercise-notifications] Created notification ${res.insertedId} for latest exercise ${ex._id} (John Doe)`);
  } catch (e) {
    console.error('[create-demo-exercise-notifications] Error:', e.message);
  } finally {
    await mongoose.disconnect();
    console.log('[create-demo-exercise-notifications] Disconnected from MongoDB');
  }
}

main();


