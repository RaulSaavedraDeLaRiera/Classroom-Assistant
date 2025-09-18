/*
  Create or update manual exercises for Module 1 and Module 2.
  - Insert or update 8 exercises (4 in M1, 4 in M2) with manual content.
  - Prepend these exercises at the start of each module (content.exercises).
  - Recalculate previousExerciseId/nextExerciseId in each module according to the new order.
  - Does not touch grades; only exercise content/title/metadata.
*/

const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  exercise1Base,
  exercise2Base,
  exercise3Base,
  exercise4Base,
  exercise5Base,
  exercise6Base,
  exercise7Base,
  exercise8Base
} = require('./manual-exercises-data');

// Define the 8 manual exercises with BASE content pasted as-is
const manualM1 = [
  {
    title: 'Present Simple - Daily Routines',
    content: exercise1Base,
    type: 'grammar',
    tags: ['grammar', 'present-simple', 'beginner'],
    estimatedTime: 15,
    maxScore: 10,
    difficulty: 'beginner'
  },
  {
    title: 'Adverbs of Frequency',
    content: exercise2Base,
    type: 'grammar',
    tags: ['grammar', 'adverbs-of-frequency', 'beginner'],
    estimatedTime: 12,
    maxScore: 10,
    difficulty: 'beginner'
  },
  {
    title: 'Questions in Present Simple',
    content: exercise3Base,
    type: 'grammar',
    tags: ['grammar', 'present-simple', 'beginner'],
    estimatedTime: 15,
    maxScore: 10,
    difficulty: 'beginner'
  },
  {
    title: 'Present Simple - Affirmative/Negative',
    content: exercise4Base,
    type: 'grammar',
    tags: ['grammar', 'present-simple', 'beginner'],
    estimatedTime: 12,
    maxScore: 10,
    difficulty: 'beginner'
  }
];

const manualM2 = [
  {
    title: 'English Grammar Exercise: Mixed Tenses and Conditionals',
    content: exercise5Base,
    type: 'grammar',
    tags: ['grammar', 'mixed-tenses', 'conditionals'],
    estimatedTime: 30,
    maxScore: 10,
    difficulty: 'intermediate'
  },
  {
    title: 'Writing - Describe Your Hometown',
    content: exercise6Base,
    type: 'writing',
    tags: ['writing', 'beginner'],
    estimatedTime: 20,
    maxScore: 10,
    difficulty: 'beginner'
  },
  {
    title: 'Reading - Short Text',
    content: exercise7Base,
    type: 'reading',
    tags: ['reading', 'beginner'],
    estimatedTime: 15,
    maxScore: 10,
    difficulty: 'beginner'
  },
  {
    title: 'Vocabulary - Family Members (Matching)',
    content: exercise8Base,
    type: 'vocabulary',
    tags: ['vocabulary', 'family'],
    estimatedTime: 12,
    maxScore: 10,
    difficulty: 'beginner'
  }
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/classroom_assistant_example');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const idsFile = path.join(__dirname, 'demo-ids.json');
    if (!fs.existsSync(idsFile)) {
      throw new Error('demo-ids.json not found. Run create-demo-users.js and create-demo-course.js first');
    }
    const ids = JSON.parse(fs.readFileSync(idsFile, 'utf8'));

    const courseId = new mongoose.Types.ObjectId(ids.courseId);

    // Load modules for the course
    const courseModules = await db.collection('course_modules').find({ courseId }).toArray();
    if (courseModules.length === 0) {
      throw new Error('No course_modules found for courseId');
    }

    // Sort modules by order if present, else by createdAt
    const modulesOrdered = [...courseModules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const module1 = modulesOrdered[0];
    const module2 = modulesOrdered[1];
    if (!module1 || !module2) {
      throw new Error('Expected at least 2 modules to attach manual exercises');
    }

    // manualM1 and manualM2 are now imported from shared file

    async function upsertManualExercisesForModule(moduleDoc, manualList) {
      const moduleId = moduleDoc._id;
      const exercisesCol = db.collection('course_exercises');

      // Fetch existing exercises for dedupe/lookups
      const existing = await exercisesCol.find({ courseId, courseModuleId: moduleId }).toArray();

      // Ensure manual exercises exist with correct content
      const manualIds = [];
      for (const item of manualList) {
        const found = await exercisesCol.findOne({ courseId, title: item.title });
        if (found) {
          await exercisesCol.updateOne(
            { _id: found._id },
            { $set: { content: item.content, type: item.type, tags: item.tags, estimatedTime: item.estimatedTime, maxScore: item.maxScore, difficulty: item.difficulty, courseModuleId: moduleId, status: 'active', visible: true, updatedAt: new Date() } }
          );
          manualIds.push(found._id);
        } else {
          const _id = new mongoose.Types.ObjectId();
          await exercisesCol.insertOne({
            _id,
            title: item.title,
            content: item.content,
            type: item.type,
            courseModuleId: moduleId,
            templateExerciseId: null,
            courseId,
            visible: true,
            tags: item.tags,
            estimatedTime: item.estimatedTime,
            maxScore: item.maxScore,
            difficulty: item.difficulty,
            estimatedScore: item.maxScore,
            status: 'active',
            previousExerciseId: null,
            nextExerciseId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            __v: 0
          });
          manualIds.push(_id);
        }
      }

      // Prepend manualIds to module.content.exercises (remove duplicates first)
      const modulesCol = db.collection('course_modules');
      const mod = await modulesCol.findOne({ _id: moduleId });
      const currentList = (mod?.content?.exercises || []).map(x => x.toString());
      const rest = currentList.filter(idStr => !manualIds.some(mid => mid.toString() === idStr));
      const newOrderIds = [...manualIds.map(id => id.toString()), ...rest];
      await modulesCol.updateOne({ _id: moduleId }, { $set: { 'content.exercises': newOrderIds.map(id => new mongoose.Types.ObjectId(id)), updatedAt: new Date() } });

      // Recalculate previous/next based on new order
      for (let i = 0; i < newOrderIds.length; i += 1) {
        const prevId = i > 0 ? new mongoose.Types.ObjectId(newOrderIds[i - 1]) : null;
        const nextId = i < newOrderIds.length - 1 ? new mongoose.Types.ObjectId(newOrderIds[i + 1]) : null;
        await exercisesCol.updateOne(
          { _id: new mongoose.Types.ObjectId(newOrderIds[i]) },
          { $set: { previousExerciseId: prevId, nextExerciseId: nextId, updatedAt: new Date() } }
        );
      }

      return manualIds;
    }

    console.log('Upserting manual exercises for Module 1...');
    const m1Ids = await upsertManualExercisesForModule(module1, manualM1);
    console.log(`Module 1 manual exercises: ${m1Ids.map(x => x.toString()).join(', ')}`);

    console.log('Upserting manual exercises for Module 2...');
    const m2Ids = await upsertManualExercisesForModule(module2, manualM2);
    console.log(`Module 2 manual exercises: ${m2Ids.map(x => x.toString()).join(', ')}`);

    console.log('Done. Manual exercises are in place and ordered at the top of each module.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

run();