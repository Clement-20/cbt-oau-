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
      { id: 1, question: "Which of the following is NOT a type of sentence?", options: ["Declarative", "Interrogative", "Exclamatory", "Narrative"], correctAnswer: 3, topic: "Sentence Types" },
      { id: 2, question: "A word that modifies a verb is called a/an ___", options: ["Adjective", "Adverb", "Pronoun", "Preposition"], correctAnswer: 1, topic: "Parts of Speech" },
      { id: 3, question: "Which of these is a common mistake in note-taking during lectures?", options: ["Summarizing key points", "Overemphasizing trivial details", "Organizing notes clearly", "Writing down questions"], correctAnswer: 1, topic: "Study Skills" },
      { id: 4, question: "Which of the following is a function of an effective introduction?", options: ["Disinterest in the topic", "Tone and direction of discussion", "Unrelated ideas", "Conclusion of the work"], correctAnswer: 1, topic: "Essay Writing" },
      { id: 5, question: "Which punctuation mark is used to show possession?", options: ["Comma", "Apostrophe", "Colon", "Semicolon"], correctAnswer: 1, topic: "Punctuation" },
      { id: 6, question: "Which of these communication styles fosters mutual understanding?", options: ["Aggressive", "Passive", "Respectful", "Complicated"], correctAnswer: 2, topic: "Communication Styles" },
      { id: 7, question: "What should you do when confused by a speaker’s message?", options: ["Ignore the confusion", "Ask clarifying questions", "Leave the discussion", "Change the topic"], correctAnswer: 1, topic: "Listening Skills" },
      { id: 8, question: "Which of the following is NOT a part of speech?", options: ["Noun", "Verb", "Article", "Clause"], correctAnswer: 3, topic: "Grammar Basics" },
      { id: 9, question: "Which of these is an example of a complex sentence?", options: ["I came, I saw.", "She sings beautifully.", "Although it rained, we played football.", "Stop talking!"], correctAnswer: 2, topic: "Sentence Structure" },
      { id: 10, question: "Which of the following is a barrier to effective communication?", options: ["Active listening", "Noise", "Feedback", "Clarity"], correctAnswer: 1, topic: "Communication Barriers" },
      { id: 11, question: "Which of the following is NOT a function of language?", options: ["Communication", "Expression of thought", "Entertainment", "Cooking"], correctAnswer: 3, topic: "Functions of Language" },
      { id: 12, question: "Which of these is an example of a compound sentence?", options: ["She reads and he writes.", "Although it rained, we stayed indoors.", "Stop talking!", "The boy runs fast."], correctAnswer: 0, topic: "Sentence Structure" },
      { id: 13, question: "Which of the following is a synonym for 'happy'?", options: ["Sad", "Joyful", "Angry", "Tired"], correctAnswer: 1, topic: "Vocabulary" },
      { id: 14, question: "Which of these is NOT a barrier to effective communication?", options: ["Noise", "Feedback", "Language differences", "Distractions"], correctAnswer: 1, topic: "Communication Barriers" },
      { id: 15, question: "Which tense is used in the sentence: 'She has finished her work'?", options: ["Present Perfect", "Past Continuous", "Future Simple", "Past Perfect"], correctAnswer: 0, topic: "Verb Tenses" },
      { id: 16, question: "Which of the following is a correct plural form?", options: ["Childs", "Children", "Childes", "Child"], correctAnswer: 1, topic: "Grammar Basics" },
      { id: 17, question: "Which of these is an example of direct speech?", options: ["He said he was tired.", "He said, 'I am tired.'", "He said that he is tired.", "He said to be tired."], correctAnswer: 1, topic: "Reported Speech" },
      { id: 18, question: "Which punctuation mark is used to end an interrogative sentence?", options: ["Period", "Exclamation mark", "Question mark", "Comma"], correctAnswer: 2, topic: "Punctuation" },
      { id: 19, question: "Which of the following is a homophone?", options: ["Write/Right", "Book/Notebook", "Fast/Quick", "Run/Walk"], correctAnswer: 0, topic: "Vocabulary" },
      { id: 20, question: "Which of these is NOT a listening skill?", options: ["Maintaining eye contact", "Interrupting frequently", "Taking notes", "Asking questions"], correctAnswer: 1, topic: "Listening Skills" },
      { id: 21, question: "Which of the following is a type of essay?", options: ["Narrative", "Descriptive", "Expository", "All of the above"], correctAnswer: 3, topic: "Essay Types" },
      { id: 22, question: "Which of these is an antonym of 'increase'?", options: ["Rise", "Grow", "Expand", "Reduce"], correctAnswer: 3, topic: "Vocabulary" },
      { id: 23, question: "Which of the following is NOT a function of a conclusion in an essay?", options: ["Summarizing points", "Introducing new ideas", "Restating thesis", "Providing closure"], correctAnswer: 1, topic: "Essay Writing" },
      { id: 24, question: "Which of these is a correct example of subject-verb agreement?", options: ["The boy run fast.", "The boys runs fast.", "The boy runs fast.", "The boys runs fast."], correctAnswer: 2, topic: "Grammar Basics" },
      { id: 25, question: "Which of the following is NOT a type of paragraph development?", options: ["Illustration", "Comparison", "Narration", "Cooking"], correctAnswer: 3, topic: "Paragraph Development" },
      { id: 26, question: "Which of these is an example of a preposition?", options: ["Quickly", "Under", "Beautiful", "Run"], correctAnswer: 1, topic: "Parts of Speech" },
      { id: 27, question: "Which of the following is a function of feedback in communication?", options: ["Clarifies message", "Creates noise", "Blocks understanding", "Ends communication"], correctAnswer: 0, topic: "Communication Process" },
      { id: 28, question: "Which of these is NOT a type of non-verbal communication?", options: ["Gestures", "Facial expressions", "Written notes", "Body language"], correctAnswer: 2, topic: "Non-Verbal Communication" },
      { id: 29, question: "Which of the following is a correct example of a complex sentence?", options: ["I like tea.", "She sings and dances.", "Although it was late, he continued working.", "Stop talking!"], correctAnswer: 2, topic: "Sentence Structure" },
      { id: 30, question: "Which of these is an example of an adjective?", options: ["Run", "Beautiful", "Quickly", "Under"], correctAnswer: 1, topic: "Parts of Speech" },
      { id: 31, question: "Which of the following is NOT a function of communication?", options: ["Information sharing", "Persuasion", "Entertainment", "Cooking"], correctAnswer: 3, topic: "Communication Functions" },
      { id: 32, question: "Which of these is an example of a declarative sentence?", options: ["What is your name?", "Stop talking!", "She is a student.", "How are you?"], correctAnswer: 2, topic: "Sentence Types" },
      { id: 33, question: "Which of the following is a barrier caused by language differences?", options: ["Noise", "Semantic problems", "Feedback", "Clarity"], correctAnswer: 1, topic: "Communication Barriers" },
      { id: 34, question: "Which of these is an example of passive voice?", options: ["The boy kicked the ball.", "The ball was kicked by the boy.", "She sings beautifully.", "They are playing football."], correctAnswer: 1, topic: "Voice" },
      { id: 35, question: "Which of the following is NOT a type of essay?", options: ["Narrative", "Descriptive", "Expository", "Cooking"], correctAnswer: 3, topic: "Essay Types" },
      { id: 36, question: "Which of these is an example of a conjunction?", options: ["And", "Run", "Quickly", "Beautiful"], correctAnswer: 0, topic: "Parts of Speech" },
      { id: 37, question: "Which of the following is a correct example of a compound sentence?", options: ["She sings.", "He dances.", "She sings and he dances.", "Stop talking!"], correctAnswer: 2, topic: "Sentence Structure" },
      { id: 38, question: "Which of these is NOT a function of punctuation?", options: ["Clarifying meaning", "Separating ideas", "Showing possession", "Cooking"], correctAnswer: 3, topic: "Punctuation" },
      { id: 39, question: "Which of the following is an example of a pronoun?", options: ["He", "Run", "Quickly", "Beautiful"], correctAnswer: 0, topic: "Parts of Speech" },
      { id: 40, question: "Which of these is NOT a barrier to listening?", options: ["Noise", "Prejudice", "Feedback", "Distractions"], correctAnswer: 2, topic: "Listening Skills" },
      { id: 41, question: "Which of the following is an antonym of 'strong'?", options: ["Weak", "Powerful", "Mighty", "Tough"], correctAnswer: 0, topic: "Vocabulary" },
      { id: 42, question: "Which of these is an example of an imperative sentence?", options: ["She sings beautifully.", "Stop talking!", "He is a student.", "What is your name?"], correctAnswer: 1, topic: "Sentence Types" },
      { id: 43, question: "Which of the following is NOT a type of communication?", options: ["Verbal", "Non-verbal", "Written", "Cooking"], correctAnswer: 3, topic: "Communication Types" },
      { id: 44, question: "Which of these is an example of an interjection?", options: ["Wow!", "Run", "Quickly", "Beautiful"], correctAnswer: 0, topic: "Parts of Speech" },
      { id: 45, question: "Which of the following is NOT a function of note-taking?", options: ["Recording key points", "Organizing ideas", "Improving memory", "Cooking"], correctAnswer: 3, topic: "Study Skills" },
      { id: 46, question: "Which of these is an example of a simple sentence?", options: ["She sings.", "She sings and he dances.", "Although it rained, we played football.", "Stop talking!"], correctAnswer: 0, topic: "Sentence Structure" },
      { id: 47, question: "Which of the following is NOT a barrier to effective communication?", options: ["Noise", "Feedback", "Distractions", "Prejudice"], correctAnswer: 1, topic: "Communication Barriers" },
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
