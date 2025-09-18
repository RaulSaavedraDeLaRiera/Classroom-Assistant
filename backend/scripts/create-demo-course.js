const mongoose = require('mongoose');
require('dotenv').config();

async function createDemoCourse() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/classroom_assistant_example');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Load IDs from previous script
    const fs = require('fs');
    const path = require('path');
    const idsFile = path.join(__dirname, 'demo-ids.json');
    
    if (!fs.existsSync(idsFile)) {
      throw new Error('demo-ids.json not found. Run create-demo-users.js and create-demo-templates.js first');
    }
    
    const ids = JSON.parse(fs.readFileSync(idsFile, 'utf8'));
    const teacherId = new mongoose.Types.ObjectId(ids.teacherId);
    
    if (!ids.templateCourseId) {
      throw new Error('No templates found. Run create-demo-templates.js first');
    }

    // Use existing courseId from demo-ids.json
    const courseId = new mongoose.Types.ObjectId(ids.courseId);

    // Get template exercises from database
    const templateExercises = await db.collection('template_exercises').find({
      _id: { $in: ids.templateExerciseIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).toArray();

    console.log(`Found ${templateExercises.length} template exercises`);

    // Create course exercises from templates
    const courseExercises = templateExercises.map(template => ({
      _id: new mongoose.Types.ObjectId(),
      title: template.title,
      content: template.content,
      type: template.type,
      courseModuleId: null, // Will be set after modules are created
      templateExerciseId: template._id,
      courseId: courseId,
      visible: template.visible,
      tags: template.tags,
      estimatedTime: template.estimatedTime,
      maxScore: template.maxScore || 10,
      difficulty: template.difficulty,
      estimatedScore: template.estimatedScore,
      status: "active",
      previousExerciseId: null, // Will be set after all exercises are created
      nextExerciseId: null, // Will be set after all exercises are created
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    }));

    // Create additional exercises for first two modules
    const additionalExercises = [];
    
    // Module 1: 6 exercises (progress type)
    const module1Exercises = [
      {
        title: "Present Simple - Basic Sentences",
        content: "Complete the sentences with the correct form of the verb in present simple:\n\n1. I {go} to school every day.\n2. She {work} in an office.\n3. They {play} football on weekends.\n4. We {study} English together.\n5. He {live} in Madrid.",
        type: "grammar",
        estimatedTime: 15,
        difficulty: "beginner",
        maxScore: 10,
        tags: ["grammar", "present-simple", "beginner"]
      },
      {
        title: "Present Simple - Questions",
        content: "Form questions using the present simple:\n\n1. {Do} you like pizza?\n2. {Does} she work here?\n3. {Do} they play tennis?\n4. {Does} he live nearby?\n5. {Do} we have time?",
        type: "grammar",
        estimatedTime: 12,
        difficulty: "beginner",
        maxScore: 10,
        tags: ["grammar", "present-simple", "questions", "beginner"]
      },
      {
        title: "Present Simple - Negative Sentences",
        content: "Make these sentences negative:\n\n1. I {don't go} to the gym.\n2. She {doesn't like} coffee.\n3. They {don't play} video games.\n4. We {don't have} a car.\n5. He {doesn't work} on Sundays.",
        type: "grammar",
        estimatedTime: 10,
        difficulty: "beginner",
        maxScore: 10,
        tags: ["grammar", "present-simple", "negative", "beginner"]
      },
      {
        title: "Present Simple - Daily Routines",
        content: "Write about your daily routine using present simple:\n\nMy daily routine:\n\nI {wake up} at 7 AM.\nI {brush} my teeth and {get} dressed.\nI {have} breakfast at 8 AM.\nI {go} to work by bus.\nI {start} work at 9 AM.",
        type: "writing",
        estimatedTime: 20,
        difficulty: "beginner",
        maxScore: 15,
        tags: ["writing", "present-simple", "routines", "beginner"]
      },
      {
        title: "Present Simple - Time Expressions",
        content: "Choose the correct time expression:\n\n1. I go to school {every day} / {yesterday}.\n2. She works {always} / {now}.\n3. They play football {on weekends} / {last week}.\n4. We study {every morning} / {tomorrow}.\n5. He lives here {since 2020} / {for 3 years}.",
        type: "quiz",
        estimatedTime: 8,
        difficulty: "beginner",
        maxScore: 10,
        tags: ["quiz", "present-simple", "time-expressions", "beginner"]
      },
      {
        title: "Present Simple - Mixed Practice",
        content: "Complete the text with present simple:\n\nMy friend Sarah {lives} in London. She {works} as a teacher. Every day, she {wakes up} at 6 AM and {has} breakfast. She {goes} to school by train. Her students {are} very smart. She {loves} her job because she {enjoys} teaching English.",
        type: "grammar",
        estimatedTime: 18,
        difficulty: "intermediate",
        maxScore: 15,
        tags: ["grammar", "present-simple", "mixed", "intermediate"]
      }
    ];

    // Module 2: 4 exercises (all type)
    const module2Exercises = [
      {
        title: "Vocabulary - Family Members",
        content: "Match the family members:\n\n1. My father's father is my {grandfather}.\n2. My mother's sister is my {aunt}.\n3. My brother's son is my {nephew}.\n4. My sister's daughter is my {niece}.\n5. My parents' parents are my {grandparents}.",
        type: "vocabulary",
        estimatedTime: 12,
        difficulty: "beginner",
        maxScore: 10,
        tags: ["vocabulary", "family", "beginner"]
      },
      {
        title: "Vocabulary - Daily Activities",
        content: "Complete with the correct verb:\n\n1. I {wake up} at 7 AM.\n2. I {brush} my teeth.\n3. I {have} breakfast.\n4. I {go} to work.\n5. I {come} home in the evening.\n6. I {watch} TV before bed.",
        type: "vocabulary",
        estimatedTime: 15,
        difficulty: "beginner",
        maxScore: 12,
        tags: ["vocabulary", "daily-activities", "beginner"]
      },
      {
        title: "Vocabulary - Food and Drinks",
        content: "Categorize these items:\n\nFruits: {apple}, {banana}, {orange}\nVegetables: {carrot}, {tomato}, {potato}\nDrinks: {water}, {coffee}, {tea}\nMeat: {chicken}, {beef}, {fish}\nDairy: {milk}, {cheese}, {yogurt}",
        type: "vocabulary",
        estimatedTime: 10,
        difficulty: "beginner",
        maxScore: 10,
        tags: ["vocabulary", "food", "categorization", "beginner"]
      },
      {
        title: "Vocabulary - Colors and Descriptions",
        content: "Describe these objects:\n\n1. The sky is {blue}.\n2. The sun is {yellow}.\n3. The grass is {green}.\n4. The snow is {white}.\n5. The night is {dark}.\n6. The fire is {red} and {hot}.",
        type: "vocabulary",
        estimatedTime: 8,
        difficulty: "beginner",
        maxScore: 10,
        tags: ["vocabulary", "colors", "descriptions", "beginner"]
      }
    ];

    // Create additional exercises
    [...module1Exercises, ...module2Exercises].forEach((exercise, index) => {
      additionalExercises.push({
        _id: new mongoose.Types.ObjectId(),
        title: exercise.title,
        content: exercise.content,
        type: exercise.type,
        courseModuleId: null, // Will be set after modules are created
        templateExerciseId: null, // No template for additional exercises
        courseId: courseId,
        visible: true,
        tags: exercise.tags,
        estimatedTime: exercise.estimatedTime,
        maxScore: exercise.maxScore,
        difficulty: exercise.difficulty,
        estimatedScore: exercise.maxScore,
        status: "active",
        previousExerciseId: null, // Will be set after all exercises are created
        nextExerciseId: null, // Will be set after all exercises are created
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      });
    });

    // Combine all exercises
    const allCourseExercises = [...courseExercises, ...additionalExercises];

    // Create course modules from templates
    const templateModules = await db.collection('template_modules').find({
      _id: { $in: ids.templateModuleIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).toArray();

    const courseModules = templateModules.map((template, moduleIndex) => {
      let courseExerciseIds = [];
      
      if (moduleIndex === 0) {
        // Module 1: empty; only the 4 manual ones added later
        courseExerciseIds = [];
      } else if (moduleIndex === 1) {
        // Module 2: empty; only the 4 manual ones added later
        courseExerciseIds = [];
      } else if (moduleIndex === 2) {
        // Module 3: exactly like the following modules — use only template exercises
        courseExerciseIds = template.content.exercises.map(templateExId => {
          const courseEx = allCourseExercises.find(ce => 
            ce.templateExerciseId && ce.templateExerciseId.toString() === templateExId.toString()
          );
          return courseEx ? courseEx._id : null;
        }).filter(id => id !== null);
      } else {
        // Other modules: Use only template exercises
        courseExerciseIds = template.content.exercises.map(templateExId => {
          const courseEx = allCourseExercises.find(ce => 
            ce.templateExerciseId.toString() === templateExId.toString()
          );
          return courseEx ? courseEx._id : null;
        }).filter(id => id !== null);
      }

      return {
        _id: new mongoose.Types.ObjectId(),
        title: template.title,
        description: template.description,
        templateModuleId: template._id,
        courseId: courseId,
        visible: true,
        tags: template.tags,
        estimatedTime: template.estimatedTime,
        progress: 0,
        type: moduleIndex === 0 ? "progress" : moduleIndex === 1 ? "all" : "all",
        status: template.status,
        prerequisites: template.prerequisites,
        content: {
          exercises: courseExerciseIds
        },
        previousModuleId: null, // Will be set after all modules are created
        nextModuleId: null, // Will be set after all modules are created
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      };
    });

    console.log(`Found ${templateModules.length} template modules`);

    // Set up previous/next exercise relationships within each module
    courseModules.forEach(module => {
      const moduleExercises = module.content.exercises;
      
      // Set previous and next exercise IDs for each exercise in the module
      moduleExercises.forEach((exerciseId, index) => {
        const exercise = allCourseExercises.find(ce => ce._id.toString() === exerciseId.toString());
        if (exercise) {
          // Set previous exercise (null for first exercise)
          exercise.previousExerciseId = index > 0 ? moduleExercises[index - 1] : null;
          
          // Set next exercise (null for last exercise)
          exercise.nextExerciseId = index < moduleExercises.length - 1 ? moduleExercises[index + 1] : null;
        }
      });
    });

    // Set up previous/next module relationships
    courseModules.forEach((module, index) => {
      // Set previous module (null for first module)
      module.previousModuleId = index > 0 ? courseModules[index - 1]._id : null;
      
      // Set next module (null for last module)
      module.nextModuleId = index < courseModules.length - 1 ? courseModules[index + 1]._id : null;
    });

    // Set courseModuleId for each course exercise
    courseModules.forEach(module => {
      module.content.exercises.forEach(exerciseId => {
        const exercise = allCourseExercises.find(ce => ce._id.toString() === exerciseId.toString());
        if (exercise) {
          exercise.courseModuleId = module._id;
        }
      });
    });

    // Only exercises used by some module
    const usedExerciseIdSet = new Set(courseModules.flatMap(m => m.content.exercises.map(id => id.toString())));
    const usedCourseExercises = allCourseExercises.filter(ex => usedExerciseIdSet.has(ex._id.toString()));

    // Get template course to copy its properties
    const templateCourse = await db.collection('template_courses').findOne({
      _id: new mongoose.Types.ObjectId(ids.templateCourseId)
    });

    // Actual course
    const course = {
      _id: courseId,
      title: templateCourse.title,
      description: templateCourse.description,
      teacherId: teacherId,
      modules: courseModules.map(cm => cm._id),
      students: ids.studentIds.map(id => new mongoose.Types.ObjectId(id)),
      visible: templateCourse.visible,
      tags: templateCourse.tags,
      estimatedTime: 6,
      isPublic: templateCourse.isPublic,
      status: "active",
      maxStudents: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    };

    // Insert data
    console.log('Inserting course exercises...');
    await db.collection('course_exercises').insertMany(usedCourseExercises);
    
    console.log('Inserting course modules...');
    await db.collection('course_modules').insertMany(courseModules);
    
    console.log('Inserting course...');
    await db.collection('courses').insertOne(course);

    console.log('\nEnglish course created successfully:');
    console.log(`Course: ${course.title}`);
    console.log(`Teacher: ${teacherId}`);
    console.log(`Modules: ${courseModules.length}`);
    console.log(`Exercises: ${usedCourseExercises.length}`);
    console.log(`Students: ${ids.studentIds.length}`);

    // Update IDs file
    const updatedIds = {
      ...ids,
      courseId: courseId.toString(),
      moduleIds: courseModules.map(cm => cm._id.toString()),
      exerciseIds: usedCourseExercises.map(ce => ce._id.toString())
    };
    
    fs.writeFileSync(idsFile, JSON.stringify(updatedIds, null, 2));
    console.log(`\nIDs updated in: ${idsFile}`);

    console.log('\nNext step:');
    console.log('   Run: node create-demo-enrollments.js');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
createDemoCourse();