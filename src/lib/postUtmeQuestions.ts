export type Question = {
  id: number;
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
};

// 10 questions per subject across various popular subjects at OAU
export const subjectQuestions: Record<string, Question[]> = {
  English: [
    { id: 101, subject: "English", question: "Antonym: The student’s insipid remark annoyed the lecturer.", options: ["Sharp", "Bold", "Tasty", "Interesting"], correctAnswer: 3 },
    { id: 102, subject: "English", question: "Synonym: His demeanour during the trial was calm.", options: ["Background", "Behaviour", "Sentence", "Evidence"], correctAnswer: 1 },
    { id: 103, subject: "English", question: "Completion: If I had heard this earlier, I ______ given him the job.", options: ["would not have", "would have not", "will not have", "will have not"], correctAnswer: 0 },
    { id: 104, subject: "English", question: "Idiom: To 'kick the bucket' means to ______.", options: ["Start a fight", "Be clumsy", "Die", "Play football"], correctAnswer: 2 },
    { id: 105, subject: "English", question: "Novel: Who is the protagonist of the recommended novel?", options: ["The King", "The Prince", "The Queen", "Subject to current year"], correctAnswer: 3 },
    { id: 106, subject: "English", question: "Grammar: She is the _____ of the two sisters.", options: ["tallest", "taller", "most tall", "more taller"], correctAnswer: 1 },
    { id: 107, subject: "English", question: "Spellings: Identify the correctly spelt word.", options: ["Accommodation", "Accomodation", "Acommodation", "Acomodation"], correctAnswer: 0 },
    { id: 108, subject: "English", question: "Lexis: The committee has submitted its ______.", options: ["report", "reports", "reporting", "reporter"], correctAnswer: 0 },
    { id: 109, subject: "English", question: "Structure: Neither the boys nor the girls ______ present.", options: ["was", "were", "is", "has been"], correctAnswer: 1 },
    { id: 110, subject: "English", question: "Register: A person who treats kidney diseases is a ______.", options: ["Neurologist", "Cardiologist", "Nephrologist", "Oncologist"], correctAnswer: 2 }
  ],
  Mathematics: [
    { id: 201, subject: "Mathematics", question: "Simplify: x^2 - y^2", options: ["(x-y)^2", "(x+y)(x-y)", "x(x-y)", "(x+y)^2"], correctAnswer: 1 },
    { id: 202, subject: "Mathematics", question: "What is the angle of a full circle?", options: ["90", "180", "270", "360"], correctAnswer: 3 },
    { id: 203, subject: "Mathematics", question: "Solve for x: 2x + 5 = 15", options: ["10", "5", "2", "8"], correctAnswer: 1 },
    { id: 204, subject: "Mathematics", question: "Find the derivative of x^3.", options: ["3x^2", "x^2", "3x", "2x^3"], correctAnswer: 0 },
    { id: 205, subject: "Mathematics", question: "What is the probability of picking a red ball from 3 red and 2 blue balls?", options: ["3/5", "2/5", "1/2", "3/2"], correctAnswer: 0 },
    { id: 206, subject: "Mathematics", question: "Integrate 2x dx.", options: ["2", "x^2", "x^2 + C", "2x + C"], correctAnswer: 2 },
    { id: 207, subject: "Mathematics", question: "The sum of angles in a triangle is?", options: ["90", "180", "360", "270"], correctAnswer: 1 },
    { id: 208, subject: "Mathematics", question: "Convert 1011 (base 2) to base 10.", options: ["9", "10", "11", "12"], correctAnswer: 2 },
    { id: 209, subject: "Mathematics", question: "Find the mean of 2, 4, 6, 8, 10.", options: ["4", "5", "6", "7"], correctAnswer: 2 },
    { id: 210, subject: "Mathematics", question: "Evaluate log10(100).", options: ["10", "2", "1", "100"], correctAnswer: 1 }
  ],
  Economics: [
    { id: 301, subject: "Economics", question: "Utility: At the point of satiety, Marginal Utility is ______.", options: ["Positive", "Increasing", "Zero", "Negative"], correctAnswer: 2 },
    { id: 302, subject: "Economics", question: "Market: A market with a single seller is a ______.", options: ["Monopoly", "Monopsony", "Oligopoly", "Perfect Market"], correctAnswer: 0 },
    { id: 303, subject: "Economics", question: "Demand: If price increases and demand remains unchanged, the demand is ______.", options: ["Elastic", "Perfectly Inelastic", "Unitary", "Plastic"], correctAnswer: 1 },
    { id: 304, subject: "Economics", question: "A centrally planned economy is also known as ______.", options: ["Mixed", "Capitalist", "Socialist", "Traditional"], correctAnswer: 2 },
    { id: 305, subject: "Economics", question: "Which is a factor of production?", options: ["Money", "Labour", "Taxes", "Banks"], correctAnswer: 1 },
    { id: 306, subject: "Economics", question: "Inflation means ____.", options: ["Falling prices", "Rising prices", "Stable prices", "Variable prices"], correctAnswer: 1 },
    { id: 307, subject: "Economics", question: "The reward for capital is ______.", options: ["Wages", "Rent", "Interest", "Profit"], correctAnswer: 2 },
    { id: 308, subject: "Economics", question: "Opportunity cost is ______.", options: ["Direct cost", "Indirect cost", "Forgone alternative", "Accounting cost"], correctAnswer: 2 },
    { id: 309, subject: "Economics", question: "Elasticity of supply relates to ____.", options: ["Price and demand", "Price and supply quantity", "Income and supply", "Cost and supply"], correctAnswer: 1 },
    { id: 310, subject: "Economics", question: "GDP stands for ______.", options: ["Gross Domestic Product", "Gross Development Product", "Grand Domestic Product", "General Domestic Plan"], correctAnswer: 0 }
  ],
  Government: [
    { id: 401, subject: "Government", question: "Republic: Nigeria became a republic in ______.", options: ["1960", "1963", "1970", "1999"], correctAnswer: 1 },
    { id: 402, subject: "Government", question: "Authority: The highest court in Nigeria is the ______.", options: ["High Court", "Court of Appeal", "Supreme Court", "Magistrate Court"], correctAnswer: 2 },
    { id: 403, subject: "Government", question: "Constitution: The 1979 Constitution introduced the ______ system.", options: ["Parliamentary", "Presidential", "Confederal", "Unitary"], correctAnswer: 1 },
    { id: 404, subject: "Government", question: "OAU was formed in primarily to ______.", options: ["Fight poverty", "Eradicate colonialism", "Promote trade", "Fight diseases"], correctAnswer: 1 },
    { id: 405, subject: "Government", question: "The principle of separation of powers prevents ______.", options: ["Democracy", "Dictatorship", "Federalism", "Unitarianism"], correctAnswer: 1 },
    { id: 406, subject: "Government", question: "An election held to fill a vacant seat is called a ______.", options: ["General election", "By-election", "Primary election", "Referendum"], correctAnswer: 1 },
    { id: 407, subject: "Government", question: "Fascism is closely associated with ______.", options: ["Karl Marx", "Adolf Hitler", "Benito Mussolini", "Joseph Stalin"], correctAnswer: 2 },
    { id: 408, subject: "Government", question: "The headquarters of ECOWAS is in ______.", options: ["Lagos", "Accra", "Abuja", "Dakar"], correctAnswer: 2 },
    { id: 409, subject: "Government", question: "Franchise means the right to ______.", options: ["Vote", "Speak", "Assemble", "Travel"], correctAnswer: 0 },
    { id: 410, subject: "Government", question: "Who was Nigeria's first Prime Minister?", options: ["Nnamdi Azikiwe", "Tafawa Balewa", "Obafemi Awolowo", "Ahmadu Bello"], correctAnswer: 1 }
  ],
  Physics: [
    { id: 501, subject: "Physics", question: "Optics: The image formed by a plane mirror is ______.", options: ["Real and Inverted", "Virtual and Erect", "Diminished", "Magnified"], correctAnswer: 1 },
    { id: 502, subject: "Physics", question: "Heat: The temperature at which water is densest is ______.", options: ["0°C", "4°C", "100°C", "-4°C"], correctAnswer: 1 },
    { id: 503, subject: "Physics", question: "Energy: The unit of electrical power is ______.", options: ["Joule", "Ampere", "Watt", "Volt"], correctAnswer: 2 },
    { id: 504, subject: "Physics", question: "Acceleration due to gravity is approximately ______.", options: ["9.8 m/s^2", "10.5 m/s^2", "8.9 m/s^2", "12 m/s^2"], correctAnswer: 0 },
    { id: 505, subject: "Physics", question: "The branch of physics dealing with motion under force is ______.", options: ["Thermodynamics", "Optics", "Mechanics", "Acoustics"], correctAnswer: 2 },
    { id: 506, subject: "Physics", question: "What is the formula for kinetic energy?", options: ["mgh", "ma", "1/2 mv^2", "F * d"], correctAnswer: 2 },
    { id: 507, subject: "Physics", question: "Sound cannot travel through ______.", options: ["Water", "Air", "Vacuum", "Steel"], correctAnswer: 2 },
    { id: 508, subject: "Physics", question: "Resistance is measured in ______.", options: ["Volts", "Ohms", "Amperes", "Coulombs"], correctAnswer: 1 },
    { id: 509, subject: "Physics", question: "Which is a vector quantity?", options: ["Speed", "Mass", "Velocity", "Distance"], correctAnswer: 2 },
    { id: 510, subject: "Physics", question: "The half-life of a radioactive element relates to its ______.", options: ["Mass", "Temperature", "Decay rate", "Density"], correctAnswer: 2 }
  ],
  Chemistry: [
    { id: 601, subject: "Chemistry", question: "Gas Laws: PV = nRT is the equation for ______.", options: ["Ideal Gas", "Boyle's Law", "Charles' Law", "Dalton's Law"], correctAnswer: 0 },
    { id: 602, subject: "Chemistry", question: "Acidity: A solution with a pH of 3 is ______.", options: ["Strongly Acidic", "Weakly Acidic", "Neutral", "Basic"], correctAnswer: 0 },
    { id: 603, subject: "Chemistry", question: "Bonding: The bond in a Sodium Chloride crystal is ______.", options: ["Covalent", "Ionic", "Metallic", "Dative"], correctAnswer: 1 },
    { id: 604, subject: "Chemistry", question: "The atomic number is the number of ______.", options: ["Neutrons", "Protons", "Electrons", "Nucleons"], correctAnswer: 1 },
    { id: 605, subject: "Chemistry", question: "An isotope has the same number of _____ but different ____.", options: ["protons, electrons", "neutrons, protons", "protons, neutrons", "electrons, neutrons"], correctAnswer: 2 },
    { id: 606, subject: "Chemistry", question: "Which is an inert gas?", options: ["Oxygen", "Nitrogen", "Neon", "Fluorine"], correctAnswer: 2 },
    { id: 607, subject: "Chemistry", question: "The formula of sulphuric acid is ______.", options: ["H2SO3", "H2S", "H2SO4", "SO2"], correctAnswer: 2 },
    { id: 608, subject: "Chemistry", question: "Reduction is the ______ of electrons.", options: ["Loss", "Gain", "Sharing", "Pairing"], correctAnswer: 1 },
    { id: 609, subject: "Chemistry", question: "Organic chemistry is primarily the study of ______ compounds.", options: ["Nitrogen", "Oxygen", "Carbon", "Hydrogen"], correctAnswer: 2 },
    { id: 610, subject: "Chemistry", question: "Which metal is liquid at standard room temperature?", options: ["Iron", "Lead", "Mercury", "Copper"], correctAnswer: 2 }
  ],
  Literature: [
    { id: 701, subject: "Literature", question: "Devices: 'The sun smiled at us' is an example of ______.", options: ["Personification", "Metaphor", "Hyperbole", "Oxymoron"], correctAnswer: 0 },
    { id: 702, subject: "Literature", question: "Drama: A play that ended in a disaster for the main character is a ______.", options: ["Comedy", "Tragedy", "Satire", "Farce"], correctAnswer: 1 },
    { id: 703, subject: "Literature", question: "Poetry: A poem of 14 lines is called a ______.", options: ["Sonnet", "Lyric", "Epic", "Ode"], correctAnswer: 0 },
    { id: 704, subject: "Literature", question: "A story within a story is called a ______.", options: ["Prologue", "Epilogue", "Frame narrative", "Soliloquy"], correctAnswer: 2 },
    { id: 705, subject: "Literature", question: "Which of these is a dramatic genre?", options: ["Prose", "Poetry", "Tragicomedy", "Sonnet"], correctAnswer: 2 },
    { id: 706, subject: "Literature", question: "A stanza of four lines is a ______.", options: ["Couplet", "Quatrain", "Sestet", "Octave"], correctAnswer: 1 },
    { id: 707, subject: "Literature", question: "The time and place of a story is its ______.", options: ["Plot", "Setting", "Theme", "Tone"], correctAnswer: 1 },
    { id: 708, subject: "Literature", question: "Simile always involves the use of ______.", options: ["Like or as", "Exaggeration", "Irony", "Rhyme"], correctAnswer: 0 },
    { id: 709, subject: "Literature", question: "A long narrative poem detailing hero's deeds is an ______.", options: ["Ode", "Elegy", "Epic", "Ballad"], correctAnswer: 2 },
    { id: 710, subject: "Literature", question: "Words that sound like their meaning signify ______.", options: ["Alliteration", "Onomatopoeia", "Assonance", "Consonance"], correctAnswer: 1 }
  ],
  CRK: [
    { id: 801, subject: "CRK", question: "Which of these was a prophet?", options: ["David", "Gideon", "Isaiah", "Samson"], correctAnswer: 2 },
    { id: 802, subject: "CRK", question: "Moses received the ten commandments at ____.", options: ["Mount Zion", "Mount Sinai", "Mount Horeb", "Mount Carmel"], correctAnswer: 1 },
    { id: 803, subject: "CRK", question: "Who was the first king of Israel?", options: ["David", "Solomon", "Saul", "Samuel"], correctAnswer: 2 },
    { id: 804, subject: "CRK", question: "Jesus was born in ____.", options: ["Nazareth", "Bethlehem", "Jerusalem", "Jericho"], correctAnswer: 1 },
    { id: 805, subject: "CRK", question: "The betrayal of Jesus was done by ____.", options: ["Peter", "Judas Iscariot", "John", "Thomas"], correctAnswer: 1 },
    { id: 806, subject: "CRK", question: "Which apostle wrote most of the Epistles?", options: ["Peter", "John", "James", "Paul"], correctAnswer: 3 },
    { id: 807, subject: "CRK", question: "The promised land is ____.", options: ["Egypt", "Canaan", "Babylon", "Assyria"], correctAnswer: 1 },
    { id: 808, subject: "CRK", question: "Who interpreted Pharaoh's dreams?", options: ["Joseph", "Moses", "Daniel", "Jacob"], correctAnswer: 0 },
    { id: 809, subject: "CRK", question: "The flood occurred during the time of ____.", options: ["Abraham", "Lot", "Noah", "Enoch"], correctAnswer: 2 },
    { id: 810, subject: "CRK", question: "The first martyr of the early church was ____.", options: ["Peter", "Stephen", "Paul", "James"], correctAnswer: 1 }
  ]
};

// Fallback for previous import
export const postUtmeQuestions: Question[] = [
  ...subjectQuestions.English,
  ...subjectQuestions.Mathematics,
  ...subjectQuestions.Physics,
  ...subjectQuestions.Chemistry
];

