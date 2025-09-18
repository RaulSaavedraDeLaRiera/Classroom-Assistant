// Test configuration file
module.exports = {
  // API configuration
  api: {
    baseUrl: 'http://localhost:3000',
    timeout: 10000, // 10 seconds
  },
  
  // Test data
  sampleData: {
    templateCourse: {
      title: "Inglés A2-B1",
      description: "Curso de inglés nivel A2 a B1",
      tags: ["inglés", "básico", "intermedio"],
      estimatedDuration: 40
    },
    
    templateModule: {
      title: "Gramática Básica",
      description: "Módulo de gramática fundamental",
      tags: ["gramática", "básico"],
      estimatedDuration: 120
    },
    
    templateExercise: {
      title: "Present Simple vs Present Continuous",
      content: "Completa las frases con la forma correcta del verbo",
      type: "grammar",
      tags: ["present simple", "present continuous"],
      estimatedTime: 15
    }
  },
  
  // Test endpoints
  endpoints: {
    templates: {
      courses: '/template_courses',
      modules: '/template_modules',
      exercises: '/template_exercises'
    },
    courses: {
      main: '/courses',
      modules: '/course_modules',
      exercises: '/course_exercises'
    }
  }
};
