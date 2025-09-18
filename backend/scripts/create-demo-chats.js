const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function ensureConnection() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/classroom_assistant_example';
  await mongoose.connect(uri, { autoIndex: false });
  console.log(`[create-demo-chats] Connected to MongoDB: ${uri}`);
  try {
    const admin = mongoose.connection.db.admin();
    const info = await admin.serverStatus();
    console.log(`[create-demo-chats] Server status ok, version: ${info.version}`);
  } catch (e) {
    console.log(`[create-demo-chats] Warning: could not fetch serverStatus: ${e.message}`);
  }
}

function loadDemoIdsIfPresent() {
  try {
    const idsPath = path.join(__dirname, 'demo-ids.json');
    if (fs.existsSync(idsPath)) {
      const raw = fs.readFileSync(idsPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (_) {}
  return null;
}

async function resolveIds(db) {
  const ids = loadDemoIdsIfPresent();
  const oid = (id) => new mongoose.Types.ObjectId(id);

  // Collections
  const usersCol = db.collection('users');
  const coursesCol = db.collection('courses');
  const enrollmentsCol = db.collection('course_enrollments');

  // Diagnostics: basic counts
  try {
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name).sort();
    console.log('[create-demo-chats] Collections present:', names.join(', '));
    const totalEnrollments = await enrollmentsCol.countDocuments({});
    console.log('[create-demo-chats] course_enrollments total documents:', totalEnrollments);
    if (totalEnrollments > 0) {
      const sample = await enrollmentsCol.find({}).project({ _id: 1, studentId: 1, courseId: 1, teacherId: 1 }).limit(3).toArray();
      console.log('[create-demo-chats] course_enrollments sample:', sample.map(d => ({ _id: String(d._id), studentId: d.studentId && String(d.studentId), courseId: d.courseId && String(d.courseId), teacherId: d.teacherId && String(d.teacherId) })));
    }
  } catch (e) {
    console.log('[create-demo-chats] Diagnostics failed:', e.message);
  }

  let teacherId;
  let courseId;
  let studentEnrollments = [];

  // Primary path: use demo-ids.json directly if it includes enrollmentIds
  if (ids && ids.teacherId && ids.courseId && Array.isArray(ids.enrollmentIds) && ids.enrollmentIds.length) {
    teacherId = oid(ids.teacherId);
    courseId = oid(ids.courseId);
    const enrollmentObjectIds = ids.enrollmentIds.map(oid);
    studentEnrollments = await enrollmentsCol
      .find({ _id: { $in: enrollmentObjectIds } })
      .project({ _id: 1, studentId: 1, courseId: 1, teacherId: 1 })
      .toArray();
    console.log(`[create-demo-chats] Loaded ${studentEnrollments.length} enrollments by enrollmentIds from demo-ids.json`);

    // If for some reason none found, fallback to studentIds+courseId
    if (!studentEnrollments.length && Array.isArray(ids.studentIds) && ids.studentIds.length) {
      const studentObjectIds = ids.studentIds.map(oid);
      studentEnrollments = await enrollmentsCol
        .find({ courseId: courseId, studentId: { $in: studentObjectIds } })
        .project({ _id: 1, studentId: 1, courseId: 1, teacherId: 1 })
        .toArray();
      console.log(`[create-demo-chats] Fallback loaded ${studentEnrollments.length} enrollments by studentIds+courseId from demo-ids.json`);
    }
  } else if (ids && ids.teacherId && ids.courseId && Array.isArray(ids.studentIds) && ids.studentIds.length) {
    // Secondary path: use studentIds + courseId
    teacherId = oid(ids.teacherId);
    courseId = oid(ids.courseId);
    const studentObjectIds = ids.studentIds.map(oid);
    studentEnrollments = await enrollmentsCol
      .find({ courseId: courseId, studentId: { $in: studentObjectIds } })
      .project({ _id: 1, studentId: 1, courseId: 1, teacherId: 1 })
      .toArray();
    console.log(`[create-demo-chats] Loaded ${studentEnrollments.length} enrollments by studentIds+courseId from demo-ids.json`);
  } else {
    // Fallback by querying known emails and course title from demo scripts
    const teacher = await usersCol.findOne({ email: 'john@teacher.com' }, { projection: { _id: 1 } });
    const course = await coursesCol.findOne({ title: 'English for Beginners to Advanced' }, { projection: { _id: 1 } });
    if (!teacher || !course) {
      throw new Error('Could not resolve teacher or course. Run demo setup scripts first.');
    }
    teacherId = teacher._id;
    courseId = course._id;
    // Try by courseId first
    studentEnrollments = await enrollmentsCol
      .find({ courseId: courseId })
      .project({ _id: 1, studentId: 1, courseId: 1, teacherId: 1 })
      .toArray();
    if (!studentEnrollments.length) {
      console.log('[create-demo-chats] No enrollments by courseId (from course lookup), trying by teacherId...');
      studentEnrollments = await enrollmentsCol
        .find({ teacherId: teacherId })
        .project({ _id: 1, studentId: 1, courseId: 1, teacherId: 1 })
        .toArray();
      console.log(`[create-demo-chats] Found ${studentEnrollments.length} enrollments by teacherId`);
      if (studentEnrollments.length) {
        courseId = studentEnrollments[0].courseId;
      }
    }
  }

  // Last-resort fallback: use any enrollments present
  if (!studentEnrollments.length) {
    const anyEnrollments = await enrollmentsCol
      .find({})
      .project({ _id: 1, studentId: 1, courseId: 1, teacherId: 1 })
      .toArray();
    console.log('[create-demo-chats] Last-resort fallback any enrollments count:', anyEnrollments.length);
    if (anyEnrollments.length) {
      // Pick the most common courseId
      const counts = anyEnrollments.reduce((acc, e) => {
        const k = e.courseId && String(e.courseId);
        if (!k) return acc;
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {});
      const topCourseIdStr = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (topCourseIdStr) {
        courseId = new mongoose.Types.ObjectId(topCourseIdStr);
        studentEnrollments = anyEnrollments.filter(e => String(e.courseId) === topCourseIdStr);
        console.log('[create-demo-chats] Using most common courseId from enrollments:', topCourseIdStr, 'count:', studentEnrollments.length);
      } else {
        // If no courseId present, just take first N
        studentEnrollments = anyEnrollments.slice(0, 10);
        console.log('[create-demo-chats] Using first enrollments without courseId');
      }
    }
  }

  console.log('[create-demo-chats] Resolved IDs:', {
    teacherId: String(teacherId),
    courseId: courseId ? String(courseId) : null,
    enrollmentsCount: studentEnrollments.length
  });
  return { teacherId, courseId, studentEnrollments };
}

async function getOrCreateChat(db, { teacherId, studentId, courseId, enrollmentId }) {
  const chatsCol = db.collection('chats');
  const existing = await chatsCol.findOne({ teacherId, studentId, courseId });
  if (existing) {
    console.log(`[create-demo-chats] Chat already exists for student ${studentId} (chatId=${existing._id})`);
    return existing;
  }
  const now = new Date();
  const res = await chatsCol.insertOne({
    teacherId,
    studentId,
    courseId,
    enrollmentId,
    active: true,
    createdAt: now,
    updatedAt: now,
    lastMessage: null,
    lastMessageAt: null,
    lastMessageBy: null
  });
  const created = await chatsCol.findOne({ _id: res.insertedId });
  console.log(`[create-demo-chats] Created chat ${created._id} for student ${studentId}`);
  return created;
}

async function addMessages(db, { chat, teacherId, studentId }, messages) {
  const messagesCol = db.collection('chat_messages');
  const chatsCol = db.collection('chats');
  const now = new Date();
  let lastMessageId = null;
  let lastContent = null;
  let lastSender = null;
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const createdAt = new Date(now.getTime() - (messages.length - i) * 60 * 1000);
    const doc = {
      chatId: chat._id,
      senderId: m.sender === 'teacher' ? teacherId : studentId,
      message: m.text,
      isRead: false,
      type: 'text',
      createdAt,
      updatedAt: createdAt
    };
    const res = await messagesCol.insertOne(doc);
    console.log(`[create-demo-chats] Inserted message ${res.insertedId} into chat ${chat._id} (sender=${m.sender})`);
    lastMessageId = res.insertedId;
    lastContent = doc.message;
    lastSender = doc.senderId;
  }
  // Update chat last message metadata using last inserted
  await chatsCol.updateOne(
    { _id: chat._id },
    { $set: { lastMessage: lastContent, lastMessageAt: new Date(), lastMessageBy: lastSender, updatedAt: new Date() } }
  );
  console.log(`[create-demo-chats] Updated chat ${chat._id} last message metadata`);
  return lastMessageId;
}

async function createNotificationForMessage(db, { teacherId, studentId, courseId, enrollmentId, chatId, messageId }) {
  const notificationsCol = db.collection('notifications');
  const now = new Date();
  await notificationsCol.insertOne({
    teacherId,
    studentId,
    courseId,
    enrollmentId,
    type: 'message_received',
    title: 'New Message',
    message: 'You have a new message from your teacher.',
    priority: 2,
    isRead: false,
    metadata: { chatId, messageId },
    createdAt: now,
    updatedAt: now
  });
  console.log(`[create-demo-chats] Created notification for chat ${chatId} message ${messageId}`);
}

async function createDemoChats() {
  try {
    await ensureConnection();
    const db = mongoose.connection.db;

    const { teacherId, courseId, studentEnrollments } = await resolveIds(db);
    if (!studentEnrollments.length) {
      console.log('[create-demo-chats] No enrollments found. Nothing to do.');
      return;
    }

    console.log(`[create-demo-chats] Creating chats for ${studentEnrollments.length} students...`);

    // Load student docs to identify John and Jane
    const usersCol = db.collection('users');
    const studentIds = studentEnrollments.map((e) => e.studentId);
    const studentsDocs = await usersCol
      .find({ _id: { $in: studentIds } })
      .project({ _id: 1, name: 1, email: 1 })
      .toArray();
    const byId = new Map(studentsDocs.map((u) => [String(u._id), u]));
    console.log(`[create-demo-chats] Loaded ${studentsDocs.length} student docs`);

    // Identify Jane and John
    const findByEmailOrName = (query) =>
      studentsDocs.find((u) => (u.email && u.email.toLowerCase() === query) || (u.name && u.name.toLowerCase() === query));
    const jane = findByEmailOrName('jane.smith@student.com') || findByEmailOrName('jane smith');
    const john = findByEmailOrName('john.doe@student.com') || findByEmailOrName('john doe');

    let created = 0;
    for (const enr of studentEnrollments) {
      console.log(`[create-demo-chats] Processing enrollment ${enr._id} for student ${enr.studentId}`);
      try {
        const chat = await getOrCreateChat(db, {
          teacherId,
          studentId: enr.studentId,
          courseId,
          enrollmentId: enr._id
        });
        // Add messages only if chat has no messages yet
        const hasMessage = await db.collection('chat_messages').findOne({ chatId: chat._id });
        if (!hasMessage) {
          const isJane = jane && String(jane._id) === String(enr.studentId);
          const isJohn = john && String(john._id) === String(enr.studentId);

          // Create same 4-5 message conversation for all students
          const convo = [
            { sender: 'teacher', text: 'Hi! How are you doing with the current module?' },
            { sender: 'student', text: "Hi! I'm doing well, I have a question about exercise 3." },
            { sender: 'teacher', text: 'Sure, what part is confusing for you?' },
            { sender: 'student', text: 'I am not sure how to structure the sentence with present simple.' },
            { sender: 'teacher', text: 'Try using Subject + Verb(s) + Object. For example: "She works every day".' }
          ];
          const lastMsgId = await addMessages(db, { chat, teacherId, studentId: enr.studentId }, convo);
          // Only Jane and John receive a notification
          if (isJane || isJohn) {
            await createNotificationForMessage(db, {
              teacherId,
              studentId: enr.studentId,
              courseId,
              enrollmentId: enr._id,
              chatId: chat._id,
              messageId: lastMsgId
            });
          }
          created += convo.length;
        } else {
          console.log(`[create-demo-chats] Chat ${chat._id} already has messages, skipping inserts`);
        }
      } catch (err) {
        console.error(`[create-demo-chats] Error processing enrollment ${enr._id}:`, err.message);
      }
    }

    console.log(`[create-demo-chats] Chats ready. ${created} messages created across chats.`);
  } catch (error) {
    console.error('[create-demo-chats] Error creating demo chats:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('[create-demo-chats] Disconnected from MongoDB');
  }
}

createDemoChats();


