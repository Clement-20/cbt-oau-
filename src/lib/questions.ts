export interface Question {
  id: number; 
  question: string; 
  options: string[]; 
  correctAnswer: number;
  topic?: string;
}

export interface Course {
  code: string; title: string; description: string; questions: Question[];
}

export const courses: Course[] = [
  {
    code: "GST 111",
    title: "Use of English",
    description: "Communication in English for academic purposes",
    questions: [
      { id: 1, question: "Which of the following is NOT a type of sentence?", options: ["Declarative", "Interrogative", "Exclamatory", "Narrative"], correctAnswer: 3, topic: "Sentence Types" },
      { id: 2, question: "A word that modifies a verb is called a/an ___", options: ["Adjective", "Adverb", "Pronoun", "Preposition"], correctAnswer: 1, topic: "Parts of Speech" },
      // ... [100 questions per course]
    ],
  },
  {
    code: "BUS 101",
    title: "Introduction to Business",
    description: "Ownership forms, management, and marketing.",
    questions: [
      { id: 1, question: "A business owned and operated by one person is a:", options: ["Partnership", "Corporation", "Sole Proprietorship", "Cooperative"], correctAnswer: 2, topic: "Business Ownership" },
      // ... [100 questions per course]
    ],
  }
];

export const getRandomQuestions = (courseCode: string, count: number = 40): Question[] => {
  const course = courses.find((c) => c.code === courseCode);
  if (!course) return [];
  return [...course.questions].sort(() => 0.5 - Math.random()).slice(0, count);
};
