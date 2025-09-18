const mongoose = require('mongoose');
require('dotenv').config();

async function createDemoTemplates() {
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
      throw new Error('demo-ids.json not found. Run create-demo-users.js first');
    }
    
    const ids = JSON.parse(fs.readFileSync(idsFile, 'utf8'));

    // Generate template IDs
    const templateExerciseIds = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId()
    ];

    const templateModuleIds = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId()
    ];

    const templateCourseId = new mongoose.Types.ObjectId();

    // Template Exercises - More varied and realistic for English
    const templateExercises = [
      {
        _id: templateExerciseIds[0],
        title: "Present Simple - Daily Routines",
        content: `## Present Simple - Daily Routines

Complete the sentences with the correct form of the verb:

1. I _____ (wake up) at 7 AM every day.
2. She _____ (go) to work by bus.
3. They _____ (have) lunch at 12:30 PM.
4. He _____ (finish) work at 6 PM.
5. We _____ (watch) TV in the evening.

**Instructions:** Use the present simple form of the verb in parentheses.`,
        type: "quiz",
        templateModuleId: templateModuleIds[0],
        visible: true,
        tags: ["grammar", "present-simple", "routines", "beginner"],
        estimatedTime: 10,
        difficulty: "beginner",
        estimatedScore: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateExerciseIds[1],
        title: "Present Simple - Questions",
        content: `## Present Simple - Questions

Make questions from these statements:

1. You work in an office.
   → _____ you work?

2. She lives in London.
   → Where _____ she live?

3. They speak English.
   → _____ they speak English?

4. He has a car.
   → _____ he have a car?

5. We study every day.
   → How often _____ you study?

**Instructions:** Complete the questions with the correct auxiliary verbs.`,
        type: "quiz",
        templateModuleId: templateModuleIds[0],
        visible: true,
        tags: ["grammar", "present-simple", "questions", "beginner"],
        estimatedTime: 12,
        difficulty: "beginner",
        estimatedScore: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateExerciseIds[2],
        title: "Vocabulary - Family Members",
        content: `## Family Members Vocabulary

Match the words with their definitions:

1. **Nephew**     a) Your mother's sister
2. **Cousin**     b) Your brother's son
3. **Aunt**       c) Your uncle's son or daughter
4. **Grandfather** d) Your father's father
5. **Stepfather** e) Your mother's new husband

**Instructions:** Write the letter (a, b, c, d, or e) next to each number.`,
        type: "quiz",
        templateModuleId: templateModuleIds[1],
        visible: true,
        tags: ["vocabulary", "family", "relationships", "beginner"],
        estimatedTime: 8,
        difficulty: "beginner",
        estimatedScore: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateExerciseIds[3],
        title: "Past Simple - Regular Verbs",
        content: `## Past Simple - Regular Verbs

Complete the sentences with the past simple form:

1. Yesterday, I _____ (walk) to the park.
2. She _____ (cook) dinner last night.
3. They _____ (visit) their grandparents last weekend.
4. He _____ (study) English for three hours.
5. We _____ (clean) the house on Saturday.

**Instructions:** Add -ed to regular verbs. Watch for spelling changes!`,
        type: "quiz",
        templateModuleId: templateModuleIds[2],
        visible: true,
        tags: ["grammar", "past-simple", "regular-verbs", "intermediate"],
        estimatedTime: 10,
        difficulty: "intermediate",
        estimatedScore: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateExerciseIds[4],
        title: "Past Simple - Irregular Verbs",
        content: `## Past Simple - Irregular Verbs

Complete the sentences with the past simple form:

1. I _____ (go) to the cinema yesterday.
2. She _____ (eat) pizza for lunch.
3. They _____ (see) a movie last night.
4. He _____ (take) a photo of the sunset.
5. We _____ (buy) some new clothes.

**Instructions:** Use the irregular past form of each verb.`,
        type: "quiz",
        templateModuleId: templateModuleIds[2],
        visible: true,
        tags: ["grammar", "past-simple", "irregular-verbs", "intermediate"],
        estimatedTime: 12,
        difficulty: "intermediate",
        estimatedScore: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateExerciseIds[5],
        title: "Future with 'Will' - Predictions",
        content: `## Future with 'Will' - Predictions

Make predictions using 'will' or 'won't':

**Example:** It's cloudy. → It will rain.

Now make predictions:

1. She's studying hard. → She _____ pass the exam.
2. He's not feeling well. → He _____ go to work tomorrow.
3. They're saving money. → They _____ buy a new car.
4. The weather is nice. → We _____ go to the beach.
5. It's very late. → The shops _____ be open.

**Instructions:** Use 'will' for positive predictions and 'won't' for negative ones.`,
        type: "quiz",
        templateModuleId: templateModuleIds[3],
        visible: true,
        tags: ["grammar", "future", "will", "predictions", "intermediate"],
        estimatedTime: 10,
        difficulty: "intermediate",
        estimatedScore: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateExerciseIds[6],
        title: "Future with 'Going to' - Plans",
        content: `## Future with 'Going to' - Plans

Complete the sentences with 'going to':

1. I _____ (study) English next year.
2. She _____ (travel) to Spain in summer.
3. They _____ (buy) a new house.
4. He _____ (learn) to drive.
5. We _____ (have) a party next weekend.

**Instructions:** Use 'going to' + base form of the verb.`,
        type: "quiz",
        templateModuleId: templateModuleIds[3],
        visible: true,
        tags: ["grammar", "future", "going-to", "plans", "intermediate"],
        estimatedTime: 10,
        difficulty: "intermediate",
        estimatedScore: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateExerciseIds[7],
        title: "Conditional Sentences - Type 1",
        content: `## First Conditional - Real Possibilities

Complete the conditional sentences:

1. If it _____ (rain), we _____ (stay) at home.
2. If you _____ (study) hard, you _____ (pass) the exam.
3. If she _____ (come) early, we _____ (have) dinner together.
4. If they _____ (not hurry), they _____ (miss) the bus.
5. If I _____ (have) time, I _____ (help) you.

**Instructions:** Use present simple in the 'if' clause and 'will' + base form in the main clause.`,
        type: "quiz",
        templateModuleId: templateModuleIds[4],
        visible: true,
        tags: ["grammar", "conditionals", "first-conditional", "advanced"],
        estimatedTime: 15,
        difficulty: "advanced",
        estimatedScore: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateExerciseIds[8],
        title: "Passive Voice - Present Simple",
        content: `## Passive Voice - Present Simple

Rewrite these sentences in passive voice:

1. People speak English all over the world.
   → English _____ all over the world.

2. They make cars in Japan.
   → Cars _____ in Japan.

3. Someone cleans the office every day.
   → The office _____ every day.

4. They serve coffee in this café.
   → Coffee _____ in this café.

5. People watch this TV show worldwide.
   → This TV show _____ worldwide.

**Instructions:** Use 'is/are' + past participle.`,
        type: "quiz",
        templateModuleId: templateModuleIds[4],
        visible: true,
        tags: ["grammar", "passive-voice", "present-simple", "advanced"],
        estimatedTime: 12,
        difficulty: "advanced",
        estimatedScore: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateExerciseIds[9],
        title: "Writing - Describe Your Hometown",
        content: `## Writing Exercise - Describe Your Hometown

Write a short paragraph (5-6 sentences) about your hometown. Include:

- Where it is located
- How big it is
- What you like about it
- What you don't like about it
- What tourists can do there

**Instructions:** Write complete sentences using present simple and present perfect if possible. Aim for 80-100 words.`,
        type: "writing",
        templateModuleId: templateModuleIds[1],
        visible: true,
        tags: ["writing", "descriptions", "hometown", "intermediate"],
        estimatedTime: 20,
        difficulty: "intermediate",
        estimatedScore: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateExerciseIds[10],
        title: "Speaking - Job Interview Roleplay",
        content: `## Speaking Exercise - Job Interview

Prepare answers to these common interview questions:

1. "Tell me about yourself."
2. "What are your strengths and weaknesses?"
3. "Why do you want this job?"
4. "Where do you see yourself in 5 years?"
5. "Do you have any questions for us?"

**Instructions:** Write detailed answers (2-3 sentences each). Practice saying them aloud. Focus on clear pronunciation and confident delivery.`,
        type: "writing",
        templateModuleId: templateModuleIds[4],
        visible: true,
        tags: ["speaking", "job-interview", "career", "advanced"],
        estimatedTime: 25,
        difficulty: "advanced",
        estimatedScore: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateExerciseIds[11],
        title: "Reading Comprehension - Technology Article",
        content: `## Reading Comprehension

Read this short article and answer the questions:

**"The Future of Work"**

Remote work has become increasingly popular since 2020. Many companies now offer flexible working arrangements, allowing employees to work from home or hybrid schedules. This change has benefits like better work-life balance and reduced commuting time. However, it also presents challenges such as maintaining team communication and company culture.

**Questions:**
1. When did remote work become more popular?
2. What are two benefits of remote work mentioned?
3. What are two challenges mentioned?
4. What does "hybrid schedules" mean?

**Instructions:** Answer in complete sentences based on the text.`,
        type: "quiz",
        templateModuleId: templateModuleIds[3],
        visible: true,
        tags: ["reading", "comprehension", "technology", "intermediate"],
        estimatedTime: 15,
        difficulty: "intermediate",
        estimatedScore: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      }
    ];

    // Template Modules - Connected to exercises
    const templateModules = [
      {
        _id: templateModuleIds[0],
        title: "Module 1: Present Simple",
        description: "Learn the basics of present simple tense for daily routines and habits.",
        visible: true,
        tags: ["grammar", "present-simple", "beginner"],
        estimatedTime: 22,
        status: "active",
        prerequisites: [],
        order: 1,
        previousModuleId: null,
        nextModuleId: templateModuleIds[1],
        content: {
          exercises: [templateExerciseIds[0], templateExerciseIds[1]]
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateModuleIds[1],
        title: "Module 2: Vocabulary & Writing",
        description: "Expand your vocabulary and practice descriptive writing skills.",
        visible: true,
        tags: ["vocabulary", "writing", "beginner"],
        estimatedTime: 28,
        status: "active",
        prerequisites: [],
        content: {
          exercises: [templateExerciseIds[2], templateExerciseIds[9]]
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateModuleIds[2],
        title: "Module 3: Past Simple",
        description: "Master the past simple tense with regular and irregular verbs.",
        visible: true,
        tags: ["grammar", "past-simple", "intermediate"],
        estimatedTime: 22,
        status: "active",
        prerequisites: [],
        content: {
          exercises: [templateExerciseIds[3], templateExerciseIds[4]]
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateModuleIds[3],
        title: "Module 4: Future & Reading",
        description: "Learn to express future plans and predictions, plus reading comprehension.",
        visible: true,
        tags: ["grammar", "future", "reading", "intermediate"],
        estimatedTime: 35,
        status: "active",
        prerequisites: [],
        content: {
          exercises: [templateExerciseIds[5], templateExerciseIds[6], templateExerciseIds[11]]
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: templateModuleIds[4],
        title: "Module 5: Advanced Grammar & Speaking",
        description: "Advanced grammar structures and professional communication skills.",
        visible: true,
        tags: ["grammar", "speaking", "advanced"],
        estimatedTime: 52,
        status: "active",
        prerequisites: [],
        content: {
          exercises: [templateExerciseIds[7], templateExerciseIds[8], templateExerciseIds[10]]
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      }
    ];

    // Template Course - Connected to modules
    const templateCourse = {
      _id: templateCourseId,
      title: "English for Beginners to Advanced",
      description: "A comprehensive English course covering grammar, vocabulary, writing, and speaking skills. Perfect for students from beginner to advanced levels.",
      visible: true,
      tags: ["english", "grammar", "vocabulary", "writing", "speaking"],
      estimatedDuration: 6,
      isPublic: true,
      content: {
        modules: templateModuleIds
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    };

    // Insert templates
    console.log('Inserting template exercises...');
    await db.collection('template_exercises').insertMany(templateExercises);
    
    console.log('Inserting template modules...');
    await db.collection('template_modules').insertMany(templateModules);
    
    console.log('Inserting template course...');
    await db.collection('template_courses').insertOne(templateCourse);

    console.log('\nTemplates created successfully:');
    console.log(`Template course: ${templateCourse.title}`);
    console.log(`Template modules: ${templateModules.length}`);
    console.log(`Template exercises: ${templateExercises.length}`);

    // Update IDs file
    const updatedIds = {
      ...ids,
      templateCourseId: templateCourseId.toString(),
      templateModuleIds: templateModuleIds.map(id => id.toString()),
      templateExerciseIds: templateExerciseIds.map(id => id.toString())
    };
    
    fs.writeFileSync(idsFile, JSON.stringify(updatedIds, null, 2));
    console.log(`\nIDs updated in: ${idsFile}`);

    console.log('\nNext step:');
    console.log('   Run: node create-demo-course.js');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
createDemoTemplates();
