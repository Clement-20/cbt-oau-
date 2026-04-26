export type Question = {
  id: number;
  subject: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswer: number;
};

// Expanded question bank for OAU Post-UTME
export const subjectQuestions: Record<string, Question[]> = {
  English: [
    { id: 101, subject: "English", topic: "Lexis", question: "Antonym: The student’s insipid remark annoyed the lecturer.", options: ["Sharp", "Bold", "Tasty", "Interesting"], correctAnswer: 3 },
    { id: 102, subject: "English", topic: "Lexis", question: "Synonym: His demeanour during the trial was calm.", options: ["Background", "Behaviour", "Sentence", "Evidence"], correctAnswer: 1 },
    { id: 103, subject: "English", topic: "Structure", question: "Completion: If I had heard this earlier, I ______ given him the job.", options: ["would not have", "would have not", "will not have", "will have not"], correctAnswer: 0 },
    { id: 104, subject: "English", topic: "Idioms", question: "From the options provided, choose the one nearest in meaning to the idiom: To 'kick the bucket' means to ______.", options: ["Start a fight", "Be clumsy", "Pass away", "Play football"], correctAnswer: 2 },
    { id: 105, subject: "English", topic: "Structure", question: "Choose the correct option: By the time the rainy season ended, the bridge ___________ .", options: ["has been completed", "was completed", "had been completed", "is completed"], correctAnswer: 2 },
    { id: 106, subject: "English", topic: "Structure", question: "Grammar: She is the _____ of the two sisters.", options: ["tallest", "taller", "most tall", "more taller"], correctAnswer: 1 },
    { id: 107, subject: "English", topic: "Lexis", question: "Choose the word that is correctly spelled.", options: ["Accommodation", "Accomodation", "Acommodation", "Acomodation"], correctAnswer: 0 },
    { id: 108, subject: "English", topic: "Structure", question: "Lexis: The committee has submitted its ______.", options: ["report", "reports", "reporting", "reporter"], correctAnswer: 0 },
    { id: 109, subject: "English", topic: "Structure", question: "Structure: Neither the boys nor the girls ______ present.", options: ["was", "were", "is", "has been"], correctAnswer: 1 },
    { id: 110, subject: "English", topic: "Oral English", question: "Choose the word with the same vowel sound as the capitalized letter(s): wOmen", options: ["Woman", "Money", "Village", "Police"], correctAnswer: 2 },
    { id: 111, subject: "English", topic: "Lexis", question: "Synonym: The king was known for his benevolence.", options: ["Cruelty", "Kindness", "Wealth", "Power"], correctAnswer: 1 },
    { id: 112, subject: "English", topic: "Lexis", question: "Antonym: The instructions were quite explicit.", options: ["Clear", "Vague", "Long", "Simple"], correctAnswer: 1 },
    { id: 113, subject: "English", topic: "Idioms", question: "In the sentence, 'The boy turned a deaf ear to his mother's advice', 'turned a deaf ear' means:", options: ["Listened carefully", "Ignored", "Understood", "Paid attention"], correctAnswer: 1 },
    { id: 114, subject: "English", topic: "Structure", question: "Choose the correct option: Neither James nor his friends ___ coming.", options: ["is", "are", "was", "were"], correctAnswer: 1 },
    { id: 115, subject: "English", topic: "Lexis", question: "Identify the correctly spelt word.", options: ["Embarassment", "Embarrasment", "Embarrassment", "Embarasment"], correctAnswer: 2 },
    { id: 116, subject: "English", topic: "Lexis", question: "Synonym: The smell was very pungent.", options: ["Sweet", "Strong", "Faint", "Pleasant"], correctAnswer: 1 },
    { id: 117, subject: "English", topic: "Oral English", question: "Select the word that rhymes with the given word: BOUGH", options: ["Tough", "Dough", "How", "Cough"], correctAnswer: 2 },
    { id: 118, subject: "English", topic: "Structure", question: "Completion: He has been working here ___ 1990.", options: ["for", "since", "from", "at"], correctAnswer: 1 },
    { id: 119, subject: "English", topic: "Structure", question: "Lexis: One of the boys ___ missing.", options: ["is", "are", "were", "have"], correctAnswer: 0 },
    { id: 120, subject: "English", topic: "Structure", question: "Structure: I prefer tea ___ coffee.", options: ["than", "more than", "to", "for"], correctAnswer: 2 }
  ],
  Mathematics: [
    { id: 201, subject: "Mathematics", topic: "Algebra", question: "If x - y = 4 and x + y = 10, find the value of x^2 - y^2", options: ["14", "40", "60", "24"], correctAnswer: 1 },
    { id: 202, subject: "Mathematics", topic: "Calculus", question: "Evaluate the limit of (x^2 - 4)/(x - 2) as x approaches 2", options: ["0", "2", "4", "Undefined"], correctAnswer: 2 },
    { id: 203, subject: "Mathematics", topic: "Coordinate Geometry", question: "What is the distance between the points (2, 3) and (-1, -1)?", options: ["3", "4", "5", "7"], correctAnswer: 2 },
    { id: 204, subject: "Mathematics", topic: "Calculus", question: "Find the derivative of y = sin(3x) with respect to x.", options: ["cos(3x)", "3sin(3x)", "3cos(3x)", "-3cos(3x)"], correctAnswer: 2 },
    { id: 205, subject: "Mathematics", topic: "Probability", question: "What is the probability of obtaining a total of 7 when two fair dice are thrown?", options: ["1/6", "1/12", "1/3", "1/4"], correctAnswer: 0 },
    { id: 206, subject: "Mathematics", topic: "Calculus", question: "Integrate 2x dx.", options: ["2", "x^2", "x^2 + C", "2x + C"], correctAnswer: 2 },
    { id: 207, subject: "Mathematics", topic: "Geometry", question: "The interior angles of a regular polygon are 120 degrees each. How many sides does it have?", options: ["6", "5", "8", "10"], correctAnswer: 0 },
    { id: 208, subject: "Mathematics", topic: "Number Systems", question: "Convert 1011 (base 2) to base 10.", options: ["9", "10", "11", "12"], correctAnswer: 2 },
    { id: 209, subject: "Mathematics", topic: "Statistics", question: "Find the mean of 2, 4, 6, 8, 10.", options: ["4", "5", "6", "7"], correctAnswer: 2 },
    { id: 210, subject: "Mathematics", topic: "Logarithms", question: "If log3(x) = -2, find the value of x.", options: ["-6", "1/9", "9", "3/2"], correctAnswer: 1 },
    { id: 211, subject: "Mathematics", topic: "Matrix", question: "Find the determinant of the matrix [[2, 3], [1, 4]].", options: ["5", "8", "6", "11"], correctAnswer: 0 },
    { id: 212, subject: "Mathematics", topic: "Algebra", question: "Solve the inequality: 3 - 2x > 7", options: ["x < -2", "x > -2", "x < 2", "x > 2"], correctAnswer: 0 },
    { id: 213, subject: "Mathematics", topic: "Sequence", question: "Find the 5th term of an AP whose first term is 2 and common difference is 3.", options: ["11", "14", "17", "12"], correctAnswer: 1 },
    { id: 214, subject: "Mathematics", topic: "Geometry", question: "How many sides has a heptagon?", options: ["6", "7", "8", "9"], correctAnswer: 1 },
    { id: 215, subject: "Mathematics", topic: "Permutation", question: "In how many ways can 5 people be seated on a bench?", options: ["60", "120", "240", "10"], correctAnswer: 1 },
    { id: 216, subject: "Mathematics", topic: "Statistics", question: "The median of 1, 3, 5, 7, 9 is?", options: ["3", "5", "7", "9"], correctAnswer: 1 },
    { id: 217, subject: "Mathematics", topic: "Polynomials", question: "Find the remainder when x^3 - 2x^2 + x - 1 is divided by x - 1", options: ["-1", "0", "1", "2"], correctAnswer: 0 },
    { id: 218, subject: "Mathematics", topic: "Mensuration", question: "Calculate the volume of a cylinder of base radius 7cm and height 10cm. (Take pi = 22/7)", options: ["1540 cm^3", "140 cm^3", "770 cm^3", "3080 cm^3"], correctAnswer: 0 },
    { id: 219, subject: "Mathematics", topic: "Geometry", question: "What is the slope of y = 2x + 1?", options: ["1", "2", "-2", "0"], correctAnswer: 1 },
    { id: 220, subject: "Mathematics", topic: "Algebra", question: "Solve for x: x^2 = 144", options: ["12", "144", "24", "10"], correctAnswer: 0 }
  ],
  Economics: [
    { id: 301, subject: "Economics", topic: "Theory of Utility", question: "Utility: At the point of satiety, Marginal Utility is ______.", options: ["Positive", "Increasing", "Zero", "Negative"], correctAnswer: 2 },
    { id: 302, subject: "Economics", topic: "Market Structures", question: "Market: A market with a single seller is a ______.", options: ["Monopoly", "Monopsony", "Oligopoly", "Perfect Market"], correctAnswer: 0 },
    { id: 303, subject: "Economics", topic: "Price Theory", question: "Demand: If price increases and demand remains unchanged, the demand is ______.", options: ["Elastic", "Perfectly Inelastic", "Unitary", "Plastic"], correctAnswer: 1 },
    { id: 304, subject: "Economics", topic: "Economic Systems", question: "A centrally planned economy is also known as ______.", options: ["Mixed", "Capitalist", "Socialist", "Traditional"], correctAnswer: 2 },
    { id: 305, subject: "Economics", topic: "Factors of Production", question: "Which is a factor of production?", options: ["Money", "Labour", "Taxes", "Banks"], correctAnswer: 1 },
    { id: 306, subject: "Economics", topic: "Money and Banking", question: "Inflation means ____.", options: ["Falling prices", "Rising prices", "Stable prices", "Variable prices"], correctAnswer: 1 },
    { id: 307, subject: "Economics", topic: "Factors of Production", question: "The reward for capital is ______.", options: ["Wages", "Rent", "Interest", "Profit"], correctAnswer: 2 },
    { id: 308, subject: "Economics", topic: "Basic Concepts", question: "Opportunity cost is ______.", options: ["Direct cost", "Indirect cost", "Forgone alternative", "Accounting cost"], correctAnswer: 2 },
    { id: 309, subject: "Economics", topic: "Price Theory", question: "Elasticity of supply relates to ____.", options: ["Price and demand", "Price and supply quantity", "Income and supply", "Cost and supply"], correctAnswer: 1 },
    { id: 310, subject: "Economics", topic: "National Income", question: "GDP stands for ______.", options: ["Gross Domestic Product", "Gross Development Product", "Grand Domestic Product", "General Domestic Plan"], correctAnswer: 0 },
    { id: 311, subject: "Economics", topic: "History of Thought", question: "Who is the 'Father of Modern Economics'?", options: ["John Locke", "Adam Smith", "David Ricardo", "John Hicks"], correctAnswer: 1 },
    { id: 312, subject: "Economics", topic: "Public Finance", question: "A deficit budget exists when ____.", options: ["Exp > Rev", "Rev > Exp", "Exp = Rev", "None"], correctAnswer: 0 },
    { id: 313, subject: "Economics", topic: "Price Theory", question: "Price floor is also known as ______.", options: ["Min Price", "Max Price", "Equilibrium", "Shadow Price"], correctAnswer: 0 },
    { id: 314, subject: "Economics", topic: "Market Structures", question: "Which is a characteristic of a perfect market?", options: ["Few sellers", "Many buyers", "Unique products", "Price makers"], correctAnswer: 1 },
    { id: 315, subject: "Economics", topic: "Money and Banking", question: "Money is a medium of ______.", options: ["Exchange", "Savings", "Value", "Wealth"], correctAnswer: 0 }
  ],
  Government: [
    { id: 401, subject: "Government", topic: "History", question: "Republic: Nigeria became a republic in ______.", options: ["1960", "1963", "1970", "1999"], correctAnswer: 1 },
    { id: 402, subject: "Government", topic: "Organs of Govt", question: "Authority: The highest court in Nigeria is the ______.", options: ["High Court", "Court of Appeal", "Supreme Court", "Magistrate Court"], correctAnswer: 2 },
    { id: 403, subject: "Government", topic: "Constitution", question: "Constitution: The 1979 Constitution introduced the ______ system.", options: ["Parliamentary", "Presidential", "Confederal", "Unitary"], correctAnswer: 1 },
    { id: 404, subject: "Government", topic: "International Organizations", question: "OAU was formed in primarily to ______.", options: ["Fight poverty", "Eradicate colonialism", "Promote trade", "Fight diseases"], correctAnswer: 1 },
    { id: 405, subject: "Government", topic: "Political Ideology", question: "The principle of separation of powers prevents ______.", options: ["Democracy", "Dictatorship", "Federalism", "Unitarianism"], correctAnswer: 1 },
    { id: 406, subject: "Government", topic: "Electoral Process", question: "An election held to fill a vacant seat is called a ______.", options: ["General election", "By-election", "Primary election", "Referendum"], correctAnswer: 1 },
    { id: 407, subject: "Government", topic: "Political Ideology", question: "Fascism is closely associated with ______.", options: ["Karl Marx", "Adolf Hitler", "Benito Mussolini", "Joseph Stalin"], correctAnswer: 2 },
    { id: 408, subject: "Government", topic: "International Organizations", question: "The headquarters of ECOWAS is in ______.", options: ["Lagos", "Accra", "Abuja", "Dakar"], correctAnswer: 2 },
    { id: 409, subject: "Government", topic: "Political Concepts", question: "Franchise means the right to ______.", options: ["Vote", "Speak", "Assemble", "Travel"], correctAnswer: 0 },
    { id: 410, subject: "Government", topic: "History", question: "Who was Nigeria's first Prime Minister?", options: ["Nnamdi Azikiwe", "Tafawa Balewa", "Obafemi Awolowo", "Ahmadu Bello"], correctAnswer: 1 },
    { id: 411, subject: "Government", topic: "Political Concepts", question: "The rule of law means ______.", options: ["The king is law", "Equality before law", "Law is optional", "Military rule"], correctAnswer: 1 },
    { id: 412, subject: "Government", topic: "Electoral Process", question: "Gerrymandering is a term in ______.", options: ["Law", "Medicine", "Politics", "Science"], correctAnswer: 2 },
    { id: 413, subject: "Government", topic: "History", question: "The first military coup in Nigeria was in ______.", options: ["1966", "1975", "1983", "1993"], correctAnswer: 0 },
    { id: 414, subject: "Government", topic: "Political Concepts", question: "Power shared between central and state govts is ______.", options: ["Federalism", "Unitarianism", "Confederalism", "Monarchy"], correctAnswer: 0 },
    { id: 415, subject: "Government", topic: "History", question: "Who is the 'father of Nigerian Nationalism'?", options: ["Nnamdi Azikiwe", "Herbert Macaulay", "Obafemi Awolowo", "Ahmadu Bello"], correctAnswer: 1 }
  ],
  Physics: [
    { id: 501, subject: "Physics", topic: "Optics", question: "Optics: The image formed by a plane mirror is ______.", options: ["Real and Inverted", "Virtual and Erect", "Diminished", "Magnified"], correctAnswer: 1 },
    { id: 502, subject: "Physics", topic: "Heat", question: "Heat: The temperature at which water is densest is ______.", options: ["0°C", "4°C", "100°C", "-4°C"], correctAnswer: 1 },
    { id: 503, subject: "Physics", topic: "Electricity", question: "Energy: The unit of electrical power is ______.", options: ["Joule", "Ampere", "Watt", "Volt"], correctAnswer: 2 },
    { id: 504, subject: "Physics", topic: "Mechanics", question: "Acceleration due to gravity is approximately ______.", options: ["9.8 m/s^2", "10.5 m/s^2", "8.9 m/s^2", "12 m/s^2"], correctAnswer: 0 },
    { id: 505, subject: "Physics", topic: "Mechanics", question: "The branch of physics dealing with motion under force is ______.", options: ["Thermodynamics", "Optics", "Mechanics", "Acoustics"], correctAnswer: 2 },
    { id: 506, subject: "Physics", topic: "Mechanics", question: "What is the formula for kinetic energy?", options: ["mgh", "ma", "1/2 mv^2", "F * d"], correctAnswer: 2 },
    { id: 507, subject: "Physics", topic: "Waves", question: "Sound cannot travel through ______.", options: ["Water", "Air", "Vacuum", "Steel"], correctAnswer: 2 },
    { id: 508, subject: "Physics", topic: "Electricity", question: "Resistance is measured in ______.", options: ["Volts", "Ohms", "Amperes", "Coulombs"], correctAnswer: 1 },
    { id: 509, subject: "Physics", topic: "Mechanics", question: "Which is a vector quantity?", options: ["Speed", "Mass", "Velocity", "Distance"], correctAnswer: 2 },
    { id: 510, subject: "Physics", topic: "Modern Physics", question: "The half-life of a radioactive element relates to its ______.", options: ["Mass", "Temperature", "Decay rate", "Density"], correctAnswer: 2 },
    { id: 511, subject: "Physics", topic: "Measurements", question: "Instrument used to measure humidity is ______.", options: ["Barometer", "Hygrometer", "Thermometer", "Ammeter"], correctAnswer: 1 },
    { id: 512, subject: "Physics", topic: "Mechanics", question: "Newton's First Law is also known as of ______.", options: ["Inertia", "Force", "Action", "Gravity"], correctAnswer: 0 },
    { id: 513, subject: "Physics", topic: "Heat", question: "The boiling point of water in Kelvin is ______.", options: ["273 K", "373 K", "100 K", "0 K"], correctAnswer: 1 },
    { id: 514, subject: "Physics", topic: "Optics", question: "Which lens corrects myopia?", options: ["Concave", "Convex", "Bifocal", "Cylindrical"], correctAnswer: 0 },
    { id: 515, subject: "Physics", topic: "Optics", question: "Primary colors of light are ______.", options: ["Red, Blue, Green", "Red, Yellow, Blue", "Orange, Violet, Green", "Black, White, Grey"], correctAnswer: 0 }
  ],
  Chemistry: [
    { id: 601, subject: "Chemistry", topic: "Gas Laws", question: "Gas Laws: PV = nRT is the equation for ______.", options: ["Ideal Gas", "Boyle's Law", "Charles' Law", "Dalton's Law"], correctAnswer: 0 },
    { id: 602, subject: "Chemistry", topic: "Acids and Bases", question: "Acidity: A solution with a pH of 3 is ______.", options: ["Strongly Acidic", "Weakly Acidic", "Neutral", "Basic"], correctAnswer: 0 },
    { id: 603, subject: "Chemistry", topic: "Chemical Bonding", question: "Bonding: The bond in a Sodium Chloride crystal is ______.", options: ["Covalent", "Ionic", "Metallic", "Dative"], correctAnswer: 1 },
    { id: 604, subject: "Chemistry", topic: "Atomic Structure", question: "The atomic number is the number of ______.", options: ["Neutrons", "Protons", "Electrons", "Nucleons"], correctAnswer: 1 },
    { id: 605, subject: "Chemistry", topic: "Atomic Structure", question: "An isotope has the same number of _____ but different ____.", options: ["protons, electrons", "neutrons, protons", "protons, neutrons", "electrons, neutrons"], correctAnswer: 2 },
    { id: 606, subject: "Chemistry", topic: "Periodic Table", question: "Which is an inert gas?", options: ["Oxygen", "Nitrogen", "Neon", "Fluorine"], correctAnswer: 2 },
    { id: 607, subject: "Chemistry", topic: "Compounds", question: "The formula of sulphuric acid is ______.", options: ["H2SO3", "H2S", "H2SO4", "SO2"], correctAnswer: 2 },
    { id: 608, subject: "Chemistry", topic: "Redox", question: "Reduction is the ______ of electrons.", options: ["Loss", "Gain", "Sharing", "Pairing"], correctAnswer: 1 },
    { id: 609, subject: "Chemistry", topic: "Organic Chemistry", question: "Organic chemistry is primarily the study of ______ compounds.", options: ["Nitrogen", "Oxygen", "Carbon", "Hydrogen"], correctAnswer: 2 },
    { id: 610, subject: "Chemistry", topic: "Elements", question: "Which metal is liquid at standard room temperature?", options: ["Iron", "Lead", "Mercury", "Copper"], correctAnswer: 2 },
    { id: 611, subject: "Chemistry", topic: "Elements", question: "What is the most abundant element in the universe?", options: ["Oxygen", "Carbon", "Hydrogen", "Nitrogen"], correctAnswer: 2 },
    { id: 612, subject: "Chemistry", topic: "Atomic Structure", question: "Valency of Carbon is ______.", options: ["2", "3", "4", "5"], correctAnswer: 2 },
    { id: 613, subject: "Chemistry", topic: "Periodic Table", question: "Which of these is a halogen?", options: ["Neon", "Chlorine", "Argon", "Helium"], correctAnswer: 1 },
    { id: 614, subject: "Chemistry", topic: "Physical States", question: "The process of a solid turning into a gas is ______.", options: ["Evaporation", "Melting", "Sublimation", "Condensation"], correctAnswer: 2 },
    { id: 615, subject: "Chemistry", topic: "Physical States", question: "Rusting of iron requires ______.", options: ["Water only", "Oxygen only", "Water and Oxygen", "Nitrogen"], correctAnswer: 2 }
  ],
  Literature: [
    { id: 701, subject: "Literature", topic: "Figures of Speech", question: "Devices: 'The sun smiled at us' is an example of ______.", options: ["Personification", "Metaphor", "Hyperbole", "Oxymoron"], correctAnswer: 0 },
    { id: 702, subject: "Literature", topic: "Drama", question: "Drama: A play that ended in a disaster for the main character is a ______.", options: ["Comedy", "Tragedy", "Satire", "Farce"], correctAnswer: 1 },
    { id: 703, subject: "Literature", topic: "Poetry", question: "Poetry: A poem of 14 lines is called a ______.", options: ["Sonnet", "Lyric", "Epic", "Ode"], correctAnswer: 0 },
    { id: 704, subject: "Literature", topic: "Prose", question: "A story within a story is called a ______.", options: ["Prologue", "Epilogue", "Frame narrative", "Soliloquy"], correctAnswer: 2 },
    { id: 705, subject: "Literature", topic: "Drama", question: "Which of these is a dramatic genre?", options: ["Prose", "Poetry", "Tragicomedy", "Sonnet"], correctAnswer: 2 },
    { id: 706, subject: "Literature", topic: "Poetry", question: "A stanza of four lines is a ______.", options: ["Couplet", "Quatrain", "Sestet", "Octave"], correctAnswer: 1 },
    { id: 707, subject: "Literature", topic: "Prose", question: "The time and place of a story is its ______.", options: ["Plot", "Setting", "Theme", "Tone"], correctAnswer: 1 },
    { id: 708, subject: "Literature", topic: "Figures of Speech", question: "Simile always involves the use of ______.", options: ["Like or as", "Exaggeration", "Irony", "Rhyme"], correctAnswer: 0 },
    { id: 709, subject: "Literature", topic: "Poetry", question: "A long narrative poem detailing hero's deeds is an ______.", options: ["Ode", "Elegy", "Epic", "Ballad"], correctAnswer: 2 },
    { id: 710, subject: "Literature", topic: "Figures of Speech", question: "Words that sound like their meaning signify ______.", options: ["Alliteration", "Onomatopoeia", "Assonance", "Consonance"], correctAnswer: 1 },
    { id: 711, subject: "Literature", topic: "Drama", question: "A protagonist's fatal flaw is called Hamartia.", options: ["Hamartia", "Catharsis", "Hubris", "Anagnorisis"], correctAnswer: 0 },
    { id: 712, subject: "Literature", topic: "Figures of Speech", question: "A reference to a historical or literary figure is an Allusion.", options: ["Illusion", "Allusion", "Allegory", "Analogy"], correctAnswer: 1 },
    { id: 713, subject: "Literature", topic: "Poetry", question: "Rhyme scheme ABAB is called Alternate rhyme.", options: ["Couplet", "Alternate rhyme", "Monorhyme", "Limerick"], correctAnswer: 1 },
    { id: 714, subject: "Literature", topic: "Poetry", question: "A poem mourning a dead person is an Elegy.", options: ["Ode", "Elegy", "Sonnet", "Epic"], correctAnswer: 1 },
    { id: 715, subject: "Literature", topic: "Figures of Speech", question: "Which of these is a figure of sound?", options: ["Oxymoron", "Simile", "Alliteration", "Irony"], correctAnswer: 2 }
  ],
  CRK: [
    { id: 801, subject: "CRK", topic: "Biblical Characters", question: "Which of these was a prophet?", options: ["David", "Gideon", "Isaiah", "Samson"], correctAnswer: 2 },
    { id: 802, subject: "CRK", topic: "Exodus", question: "Moses received the ten commandments at ____.", options: ["Mount Zion", "Mount Sinai", "Mount Horeb", "Mount Carmel"], correctAnswer: 1 },
    { id: 803, subject: "CRK", topic: "Kingdom of Israel", question: "Who was the first king of Israel?", options: ["David", "Solomon", "Saul", "Samuel"], correctAnswer: 2 },
    { id: 804, subject: "CRK", topic: "Gospels", question: "Jesus was born in ____.", options: ["Nazareth", "Bethlehem", "Jerusalem", "Jericho"], correctAnswer: 1 },
    { id: 805, subject: "CRK", topic: "Gospels", question: "The betrayal of Jesus was done by ____.", options: ["Peter", "Judas Iscariot", "John", "Thomas"], correctAnswer: 1 },
    { id: 806, subject: "CRK", topic: "Acts and Epistles", question: "Which apostle wrote most of the Epistles?", options: ["Peter", "John", "James", "Paul"], correctAnswer: 3 },
    { id: 807, subject: "CRK", topic: "Old Testament", question: "The promised land is ____.", options: ["Egypt", "Canaan", "Babylon", "Assyria"], correctAnswer: 1 },
    { id: 808, subject: "CRK", topic: "Old Testament", question: "Who interpreted Pharaoh's dreams?", options: ["Joseph", "Moses", "Daniel", "Jacob"], correctAnswer: 0 },
    { id: 809, subject: "CRK", topic: "Old Testament", question: "The flood occurred during the time of ____.", options: ["Abraham", "Lot", "Noah", "Enoch"], correctAnswer: 2 },
    { id: 810, subject: "CRK", topic: "Early Church", question: "The first martyr of the early church was ____.", options: ["Peter", "Stephen", "Paul", "James"], correctAnswer: 1 },
    { id: 811, subject: "CRK", topic: "Gospels", question: "How many disciples did Jesus have initially?", options: ["10", "11", "12", "13"], correctAnswer: 2 },
    { id: 812, subject: "CRK", topic: "Biblical General Knowledge", question: "The last book of the Bible is ______.", options: ["Genesis", "Exodus", "Proverbs", "Revelation"], correctAnswer: 3 },
    { id: 813, subject: "CRK", topic: "Biblical Characters", question: "Who was swallowed by a big fish?", options: ["Jonah", "Peter", "Paul", "Moses"], correctAnswer: 0 },
    { id: 814, subject: "CRK", topic: "Biblical General Knowledge", question: "The first book of the Bible is ______.", options: ["Genesis", "Exodus", "Matthew", "John"], correctAnswer: 0 },
    { id: 815, subject: "CRK", topic: "Biblical Characters", question: "Who killed Goliath?", options: ["Saul", "David", "Samson", "Jonathan"], correctAnswer: 1 }
  ]
};

// Fallback for previous import
export const postUtmeQuestions: Question[] = [
  ...subjectQuestions.English,
  ...subjectQuestions.Mathematics,
  ...subjectQuestions.Physics,
  ...subjectQuestions.Chemistry
];
