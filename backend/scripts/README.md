# Demo Scripts - Classroom Assistant

This directory contains scripts to set up a complete demonstration environment for the Classroom Assistant project.

## What do these scripts create?

### Users
- **1 Teacher**: john@teacher.com (password: teacher123)
- **1 Administrator**: admin@classroom.com (password: admin123)
- **6 Students** with typical names:
  - john.doe@student.com
  - jane.smith@student.com
  - mike.johnson@student.com
  - sarah.williams@student.com
  - david.brown@student.com
  - emma.davis@student.com
  - (all use password: student123)

### English Course
- **Title**: English for Beginners to Advanced
- **5 Modules**: Present Simple, Vocabulary, Past Simple, Future, Advanced Grammar
- **12 Exercises**: Grammar, vocabulary, writing, reading comprehension
- **Realistic progress**: Varied between students (10-90%)
- **Notifications**: Configured for demonstration

### Templates
- Course, module and exercise templates **correctly connected**
- Realistic and professional educational content
- Hierarchical structure: Course → Modules → Exercises

## Quick Usage

### Option 1: Master Script (Recommended)
```bash
node setup-demo-environment.js
```
This script runs all scripts in order and gives you a complete summary.

### Option 2: Individual Scripts
```bash
# 1. Create users
node create-demo-users.js

# 2. Create templates
node create-demo-templates.js

# 3. Create course from templates
node create-demo-course.js

# 4. Create enrollments and progress
node create-demo-enrollments.js
```

## Cleanup

If you need to clean the demonstration data:
```bash
node clean-demo-data.js
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `setup-demo-environment.js` | **Master script** - Runs everything in order |
| `create-demo-users.js` | Creates users (teacher, admin, students) |
| `create-demo-templates.js` | Creates course, module and exercise templates |
| `create-demo-course.js` | Creates real course from templates |
| `create-demo-enrollments.js` | Creates enrollments and student progress |
| `clean-demo-data.js` | Cleans all demonstration data |
| `switch-database.js` | **NEW** - Switch between production and example DB |
| `demo-quick-start.js` | **NEW** - One-command setup |
| `create-test-notifications.js` | Original notifications script |
| `generate-admin-password.js` | Original admin password generator |

## Requirements

1. **MongoDB running** on `mongodb://localhost:27017/classroom_assistant_example`
2. **.env file** configured (created automatically if not exists)
3. **Node.js** with dependencies installed

## Switch Database

To alternate between production and example database:

```bash
# Switch to example database (for demonstration)
node switch-database.js example

# Switch to production database
node switch-database.js production

# See which database is currently being used
node switch-database.js status
```

## Data Structure

```
Templates (Reusable)
├── templatecourses
├── templatemodules
└── templateexercises

Real Course (Specific instance)
├── courses
├── coursemodules (based on templates)
├── courseexercises (based on templates)
└── courseenrollments

Student Progress
├── studentmodules
└── studentexercises

Teacher Management
├── teachermodules
└── teacherexercises

Notifications
└── notifications
```

## Key Features

### For system
- Templates connected: Reusable architecture
- Basic progress: Shows student tracking
- Typical names: John Doe, Jane Smith, etc.
- Educational content: Professional English course
- Notifications: Complete alert system
- Multiple roles: Teacher, admin, students

### Course Content
- **Present Simple**: Daily routines and questions
- **Vocabulary**: Family, work, technology
- **Past Simple**: Regular and irregular verbs
- **Future**: Will and Going to
- **Advanced**: Conditionals, passive, speaking

## Troubleshooting

### Error: "demo-ids.json not found"
Run the scripts in order or use the master script.

### Error: "No templates found"
Run `create-demo-templates.js` first.

### MongoDB connection error
1. Verify MongoDB is running
2. Adjust `MONGO_URI` in the `.env` file

### Inconsistent data
Run `clean-demo-data.js` and then `setup-demo-environment.js`

## Demo Tips

1. **Teacher Dashboard**: Show statistics and progress
2. **Student Management**: Explain the enrollment system
3. **Templates**: Demonstrate content reuse
4. **Notifications**: Show real-time system
5. **Responsive**: Test on mobile and desktop


## Credentials 

TEACHER:
   Email: john@teacher.com
   Password: teacher123

ADMIN:
   Email: admin@classroom.com
   Password: admin123

## Ready for use!

This environment allows you to demonstrate all the main functionalities with realistic data, but AS THE DATA IS ARTIFICIAL IT MAY CAUSE ISSUES THAT A CLEAN FROM-SCRATCH SETUP WOULD NOT; IT IS PRIMARILY INTENDED FOR DEMONSTRATION PURPOSES.