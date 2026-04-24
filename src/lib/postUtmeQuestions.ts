export type Question = {
  id: number;
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
};

export const postUtmeQuestions: Question[] = [
  // Subject 1: English
  { id: 1, subject: "English", question: "Which of the following is a synonym for 'abundant'?", options: ["Scarce", "Plentiful", "Small", "Empty"], correctAnswer: 1 },
  { id: 2, subject: "English", question: "Choose the correct preposition: 'She is interested ___ music.'", options: ["in", "at", "on", "to"], correctAnswer: 0 },
  
  // Subject 2: General
  { id: 3, subject: "General", question: "Who is the current President of Nigeria?", options: ["Bola Ahmed Tinubu", "Muhammadu Buhari", "Atiku Abubakar", "Peter Obi"], correctAnswer: 0 },
  { id: 4, subject: "General", question: "In which year did Nigeria gain independence?", options: ["1950", "1960", "1970", "1980"], correctAnswer: 1 },
  
  // Subject 3: Biology
  { id: 5, subject: "Biology", question: "Which organelle is known as the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondrion", "Lysosome"], correctAnswer: 2 },
  { id: 6, subject: "Biology", question: "What is the study of plants called?", options: ["Zoology", "Botany", "Microbiology", "Ecology"], correctAnswer: 1 },
  
  // Subject 4: Chemistry
  { id: 7, subject: "Chemistry", question: "What is the chemical symbol for Gold?", options: ["Ag", "Fe", "Au", "Pb"], correctAnswer: 2 },
  { id: 8, subject: "Chemistry", question: "What is the pH of a neutral solution?", options: ["0", "7", "14", "1"], correctAnswer: 1 },
  
  // Subject 5: Physics
  { id: 9, subject: "Physics", question: "Which of these is the SI unit of force?", options: ["Joule", "Watt", "Newton", "Pascal"], correctAnswer: 2 },
  { id: 10, subject: "Physics", question: "What is the speed of light in a vacuum approximately?", options: ["3 x 10^8 m/s", "3 x 10^5 m/s", "3 x 10^6 m/s", "3 x 10^9 m/s"], correctAnswer: 0 },
];
