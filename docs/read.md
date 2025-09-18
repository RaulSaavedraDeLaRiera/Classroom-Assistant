# Classroom Assistant - Development Notes

## Credentials for Testing
- **Teacher**: john@teacher.com / abc123
- **Admin**: admin@admin.com / admin123
- **JWT_SECRET**: Must be the same in both frontend and backend

## CRITICAL LIMITATIONS - Demo Mode

### Randomized initial progress in demo
- In demo mode, the initial progress shown for courses and students may be randomized to present a variety of states for demonstration purposes.
- Once you grade or adjust an exercise for a student (e.g., assign a score, mark as completed/visible), the system recalculates and displays the student's real progress for that course.

### Demo data is limited
- The demo generator creates only basic data and may leave relationships incomplete or inconsistent.
- Projects bootstrapped with demo data can show errors due to missing links between entities.
- If you seed a clean database from zero, the system will behave more reliably.

### Student progress is not implemented on the backend
- Student progress, exercise solving, and tracking are not mounted server-side; these belong to the student side, which is not yet implemented.

### How to generate the demo environment
- Go to `backend/scripts` and read `README.md` for the scripts and steps to generate and load the DEMO environment with sample data.
