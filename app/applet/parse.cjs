const fs = require('fs');

const text = `
ENGLISH LANGUAGE 
1. Choose the correct sentence: 
The committee ___ divided in their opinions about the new policy. 
A. are 
B. is 
C. were 
D. have been 
E. has being 
ANS: C 
2. Identify the correctly spelt word: 
A. Occassion 
B. Occasion 
C. Ocasión 
D. Ocassion 
ANS: B 
3. Select the word nearest in meaning to "Benevolent": 
A. Kind 
B. Greedy 
C. Hostile 
D. Selfish 
ANS: A 
4. Choose the correct stress pattern for "Education": 
A. ED-u-ca-tion 
B. E-DU-ca-tion 
C. Ed-u-CA-tion 
D. Ed-u-ca-TION 
ANS: C 
5. Which sentence is grammatically correct? 
A. She don’t like apples. 
B. She doesn’t likes apples. 
C. She doesn’t like apples. 
D. She didn’t likes apples. 
ANS: C 
6. Choose the correct sentence: 
Neither the students nor the teacher ___ aware of the sudden test. 
A. was 
B. were 
C. are 
D. have been 
ANS: A (Singular verb "was" agrees with the nearest subject "teacher.") 
7. Identify the word with the wrong spelling: 
A. Embarrass 
B. Occurence 
C. Millennium 
D. Harass 
ANS: B (Correct spelling: "Occurrence.") 
8. Select the word opposite in meaning to "Ephemeral": 
A. Permanent 
B. Fragile 
C. Temporary 
D. Sudden 
ANS: A 
9. Which sentence contains a gerund? 
A. She runs daily. 
B. Running is her hobby. 
C. He will run tomorrow. 
D. They ran quickly. 
ANS: B (Gerund: "Running" functions as a noun.) 
10. Choose the correct stress pattern for the word "Photograph": 
A. PHO-to-graph 
B. pho-TO-graph 
C. pho-to-GRAPH 
D. PHO-to-graph 
ANS: B (Stress falls on the second syllable: pho-TO-graph.) 
11. Pick the odd word out: 
A. Novel 
B. Poetry 
C. Sculpture 
D. Drama 
ANS: C (Sculpture is visual art; others are literary arts.) 
12. Which is the correct passive voice of: "They built this house in 1990"? 
A. This house was built in 1990 by them. 
B. This house is built in 1990 by them. 
C. This house built them in 1990. 
D. This house has been built in 1990. 
ANS: A 
13. Identify the grammatical function of the underlined word: 
"She gave him a book." 
A. Direct object 
B. Indirect object 
C. Subject complement 
D. Adverbial phrase 
ANS: A (Direct object: "a book" receives the action.) 
14. Choose the correct idiom: 
"Don’t ___ until you cross it." 
A. burn the bridge 
B. build the bridge 
C. cross the bridge 
D. break the bridge 
ANS: A (Idiom: "Don’t burn the bridge.") 
15. Which word is not a preposition? 
A. Against 
B. Beyond 
C. Quickly 
D. Within 
ANS: C (Quickly is an adverb.) 
16. Select the synonym for "Pragmatic": 
A. Idealistic 
B. Practical 
C. Theoretical 
D. Unrealistic 
ANS: B 
17. Correct the sentence: 
"Each of the boys were given a prize." 
A. Each of the boys was given a prize. 
B. Each of the boys are given a prize. 
C. Each boys were given a prize. 
D. Each boy were given a prize. 
ANS: A (Singular verb "was" agrees with "each.") 
18. Identify the figure of speech: 
"Time is a thief." 
A. Simile 
B. Metaphor 
C. Personification 
D. Hyperbole 
ANS: B (Metaphor: direct comparison without "like" or "as.") 
19. Choose the appropriate question tag: 
"She can swim, ___?" 
A. can’t she 
B. couldn’t she 
C. isn’t it 
D. hasn’t she 
ANS: A 
20. Which sentence is punctuated correctly? 
A. "What time is it" she asked? 
B. "What time is it?" she asked. 
C. "What time is it," she asked? 
D. "What time is it? she asked." 
ANS: B 
MATHEMATICS 
21. Solve for xx: 3x+5=20  
A. 3 
B. 5 
C. 6 
D. 7 
ANS: B 
22. If log102=0.3010, what is log108? 
A. 0.9030 
B. 1.2040 
C. 0.6990 
D. 1.5050 
ANS: A 
23. The sum of the first 10 natural numbers is: 
A. 45 
B. 50 
C. 55 
D. 60 
ANS: C 
24. If x2−5x+6=0, what are the roots? 
A. 2, 3 
B. -2, -3 
C. 1, 6 
D. -1, -6 
ANS: A 
25. What is the probability of getting an even number when a die is rolled? 
A. 1/6
B. 1/3
C. 1/2
D. 2/3
ANS: C 
26. Simplify: (2x2−8)/(x−2)
A. 2x+4
B. 2x−4
C. x+4
D. x−4
ANS: A
27. If tanθ=3/4, find sinθ. 
A. 3/5
B. 4/5
C. 5/3
D. 5/4
ANS: A
28. Solve for x: log2(x)+log2(x−2)=3. 
A. 4 
B. 6 
C. 8 
D. 10 
ANS: A
29. The sum of the interior angles of a pentagon is: 
A. 360° 
B. 540° 
C. 720° 
D. 900° 
ANS: B
30. If y=x3−4x2+2x−1, find dy/dx. 
A. 3x2−8x+2
B. 3x2−4x+2
C. x2−8x+2
D. 3x2−8x−1
ANS: A
31. A bag contains 5 red and 3 blue balls. Two balls are drawn at random without replacement. What is the probability both are red? 
A. 5/14
B. 10/28
C. 3/8
D. 5/8
ANS: A
32. Find the radius of the circle: x2+y2−6x+4y−12=0. 
A. 5 
B. 6 
C. 7 
D. 8 
ANS: A
33. If a/b=2/3 and b/c=4/5, find a/c. 
A. 8/15
B. 6/15
C. 10/12
D. 12/10
ANS: A
34. The 5th term of an arithmetic sequence is 11, and the 9th term is 19. Find the common difference. 
A. 2 
B. 3 
C. 4 
D. 5 
ANS: A
35. Solve the inequality: 3x−7>5. 
A. x>4
B. x<4
C. x>2
D. x<2
ANS: A
36. Find the area of a triangle with vertices at (1,2), (4,5), and (6,3). 
A. 6 
B. 7 
C. 8 
D. 9 
ANS: A
37. If f(x)=2x2−3x+1, find f(−1). 
A. 6 
B. 4 
C. 2 
D. 0 
ANS: A
38. The mean of 5 numbers is 6. If one number is excluded, the mean becomes 5. What is the excluded number? 
A. 10 
B. 11 
C. 12 
D. 13 
ANS: A
39. Find the value of sin30°×cos60°. 
A. 1/4
B. 1/2
C. 3/2
D. 1 
ANS: A
40. The solution to (x+1)/(x−2)≥0 is: 
A. x≤−1 or x>2
B. x≥−1 or x<2
C. −1≤x<2
D. x<−1 or x≥2
ANS: A
PHYSICS 
41. What is the S.I. unit of force? 
A. Joule 
B. Newton 
C. Watt 
D. Pascal 
ANS: B 
42. A car accelerates from rest at 2 m/s² for 5 seconds. What is its final velocity? 
A. 5 m/s 
B. 10 m/s 
C. 15 m/s 
D. 20 m/s 
ANS: B 
43. Which of the following is a vector quantity? 
A. Speed 
B. Distance 
C. Velocity 
D. Temperature 
ANS: C 
44. The refractive index of water is 1.33. What is the speed of light in water? 
A. 2.25×10^8 m/s
B. 3.0×10^8 m/s
C. 1.33×10^8 m/s
D. 2.0×10^8 m/s
ANS: A 
45. Ohm’s Law states that: 
A. V=R/I
B. V=IR
C. I=R^2V
D. R=I^2V
ANS: B 
46. A projectile is fired at an angle of 30° to the horizontal with a velocity of 40 m/s. What is its time of flight? (Take g=10 m/s2) 
A. 2 s 
B. 4 s 
C. 6 s 
D. 8 s 
ANS: B
47. Which of the following is NOT a vector quantity? 
A. Force 
B. Velocity 
C. Work 
D. Acceleration 
ANS: C
48. The resistance of a wire of length 2 m and cross-sectional area 1×10^-6 m2 is 4 Ω. What is its resistivity? 
A. 2×10^-6 Ω⋅m
B. 4×10^-6 Ω⋅m
C. 6×10^-6 Ω⋅m
D. 8×10^-6 Ω⋅m
ANS: A
49. A transformer has 500 primary turns and 2500 secondary turns. If the primary voltage is 220 V, what is the secondary voltage? 
A. 1100 V 
B. 55 V 
C. 440 V 
D. 2200 V 
ANS: A
50. The S.I. unit of capacitance is: 
A. Ohm 
B. Farad 
C. Henry 
D. Tesla 
ANS: B 
51. A body of mass 5 kg moves with a velocity of 10 m/s. What is its kinetic energy? 
A. 50 J 
B. 250 J 
C. 500 J 
D. 1000 J 
ANS: B
52. A ray of light travels from air (n=1) to glass (n=1.5). If the angle of incidence is 30°, what is the angle of refraction? 
A. 19.5° 
B. 30° 
C. 45° 
D. 60° 
ANS: A
53. The wavelength of a wave with frequency 500 Hz and speed 50 m/s is: 
A. 0.1 m 
B. 0.5 m 
C. 1.0 m 
D. 10 m 
ANS: A
54. A gas occupies 2 m³ at 300 K. What volume will it occupy at 600 K if pressure is constant? 
A. 1 m³ 
B. 2 m³ 
C. 4 m³ 
D. 6 m³ 
ANS: C
55. The force between two point charges is 9 N. If the distance between them is tripled, the new force is: 
A. 1 N 
B. 3 N 
C. 9 N 
D. 27 N 
ANS: A
56. A machine has an efficiency of 80%. If the input work is 500 J, what is the output work? 
A. 400 J 
B. 500 J 
C. 600 J 
D. 800 J 
ANS: A
57. The critical angle for light passing from glass to air is 41°. What is the refractive index of the glass? 
A. 1.52 
B. 1.33 
C. 1.00 
D. 0.75 
ANS: A
58. An object is placed 20 cm from a concave mirror of focal length 10 cm. The image distance is: 
A. 10 cm 
B. 20 cm 
C. 30 cm 
D. 40 cm 
ANS: B
59. The half-life of a radioactive element is 10 days. What fraction remains after 30 days? 
A. 1/2
B. 1/4
C. 1/8
D. 1/16
ANS: C
60. A 2 kg object is lifted vertically at constant speed through a height of 5 m. The work done against gravity is: (Take g=10 m/s2) 
A. 10 J 
B. 50 J 
C. 100 J 
D. 200 J 
ANS: C
CHEMISTRY 
61. What is the atomic number of Oxygen? 
A. 6 
B. 8 
C. 10 
D. 16 
ANS: B 
62. Which gas is responsible for the smell of rotten eggs? 
A. Methane 
B. Hydrogen Sulphide 
C. Carbon Monoxide 
D. Ammonia 
ANS: B 
63. What is the pH of a neutral solution? 
A. 1 
B. 7 
C. 10 
D. 14 
ANS: B 
64. The chemical formula for table salt is: 
A. NaCl 
B. KCl 
C. CaCl₂ 
D. MgCl₂ 
ANS: A 
65. Which of the following is a halogen? 
A. Sodium 
B. Chlorine 
C. Calcium 
D. Iron 
ANS: B 
66. Which of these elements is a halogen? 
A. Sodium 
B. Magnesium 
C. Chlorine 
D. Argon 
ANS: C
67. The oxidation number of sulfur in H₂SO₄ is: 
A. +2 
B. +4 
C. +6 
D. -2 
ANS: C
68. What volume of CO₂ at STP is produced by burning 12g of carbon? (C = 12, molar volume = 22.4 dm³) 
A. 11.2 dm³ 
B. 22.4 dm³ 
C. 33.6 dm³ 
D. 44.8 dm³ 
ANS: B
69. Which compound exhibits hydrogen bonding? 
A. CH₄ 
B. HCl 
C. NH₃ 
D. NaCl 
ANS: C
70. The IUPAC name for CH₃CH₂CH₂OH is: 
A. Methanol 
B. Ethanol 
C. Propanol 
D. Butanol 
ANS: C
71. In the electrolysis of molten NaCl, the product at the cathode is: 
A. Cl₂ gas 
B. Na metal 
C. H₂ gas 
D. NaOH 
ANS: B
72. Which gas is produced when dilute HCl reacts with zinc? 
A. Cl₂ 
B. H₂ 
C. O₂ 
D. N₂ 
ANS: B
73. The pH of 0.001 mol/dm³ HCl solution is: 
A. 1 
B. 2 
C. 3 
D. 4 
ANS: C
74. Which of these is a secondary alcohol? 
A. CH₃OH 
B. CH₃CH₂OH 
C. (CH₃)₂CHOH 
D. (CH₃)₃COH 
ANS: C
75. The number of neutrons in an atom of ²³₁₁Na is: 
A. 11 
B. 12 
C. 23 
D. 34 
ANS: B
76. Which process is endothermic? 
A. Freezing water 
B. Condensation 
C. Sublimation 
D. Combustion 
ANS: C
77. The shape of a molecule of methane (CH₄) is: 
A. Linear 
B. Tetrahedral 
C. Trigonal planar 
D. Octahedral 
ANS: B
78. Which indicator turns yellow in acidic solutions? 
A. Phenolphthalein 
B. Methyl orange 
C. Litmus 
D. Universal indicator 
ANS: B
79. The empirical formula of C₆H₁₂O₆ is: 
A. CH₂O 
B. C₂H₄O₂ 
C. C₃H₆O₃ 
D. C₆H₁₂O₆ 
ANS: A
80. In the reaction: N₂ + 3H₂ ⇌ 2NH₃, increasing pressure will: 
A. Favor forward reaction 
B. Favor reverse reaction 
C. Have no effect 
D. Stop the reaction 
ANS: A
BIOLOGY 
81. Which organ is responsible for filtering blood in humans? 
A. Heart 
B. Liver 
C. Kidney 
D. Lungs 
ANS: C 
82. What is the powerhouse of the cell? 
A. Nucleus 
B. Mitochondria 
C. Ribosome 
D. Lysosome 
ANS: B 
83. Which of these is a greenhouse gas? 
A. Oxygen 
B. Nitrogen 
C. Carbon Dioxide 
D. Hydrogen 
ANS: C 
84. Photosynthesis occurs in which part of the plant? 
A. Roots 
B. Stem 
C. Leaves 
D. Flowers 
ANS: C 
85. The study of heredity is called: 
A. Ecology 
B. Genetics 
C. Zoology 
D. Botany 
ANS: B 
86. Which of these is a primary consumer in a food chain? 
A. Grass 
B. Rabbit 
C. Snake 
D. Hawk 
ANS: B
87. The process by which plants lose water vapor is called: 
A. Transpiration 
B. Photosynthesis 
C. Respiration 
D. Osmosis 
ANS: A 
88. Which blood vessels carry blood away from the heart? 
A. Veins 
B. Arteries 
C. Capillaries 
D. Venules 
ANS: B 
89. The functional unit of the kidney is the: 
A. Neuron 
B. Nephron 
C. Alveolus 
D. Villus 
ANS: B 
90. Which of these is NOT a micronutrient for plants? 
A. Iron 
B. Zinc 
C. Nitrogen 
D. Copper 
ANS: C
91. The male reproductive part of a flower is called: 
A. Pistil 
B. Stamen 
C. Sepal 
D. Petal 
ANS: B 
92. Which vitamin is produced by the human skin in sunlight? 
A. Vitamin A 
B. Vitamin B12 
C. Vitamin C 
D. Vitamin D 
ANS: D 
93. The study of insects is called: 
A. Ornithology 
B. Entomology 
C. Ichthyology 
D. Herpetology 
ANS: B 
94. Which gland regulates metabolism in humans? 
A. Pituitary 
B. Thyroid 
C. Adrenal 
D. Pancreas 
ANS: B 
95. The genetic material in bacteria is found in the: 
A. Nucleus 
B. Plasmid 
C. Nucleoid 
D. Ribosome 
ANS: C
96. Which process occurs in the mitochondria? 
A. Photosynthesis 
B. Protein synthesis 
C. Cellular respiration 
D. DNA replication 
ANS: C 
97. The largest part of the human brain is the: 
A. Cerebrum 
B. Cerebellum 
C. Medulla 
D. Hypothalamus 
ANS: A 
98. Which of these is a viral disease? 
A. Tuberculosis 
B. Malaria 
C. AIDS 
D. Cholera 
ANS: C 
99. The process of cell division that produces gametes is called: 
A. Mitosis 
B. Meiosis 
C. Binary fission 
D. Budding 
ANS: B 
100. Which biome is characterized by permafrost? 
A. Desert 
B. Tundra 
C. Savanna 
D. Rainforest 
ANS: B
\`;

const questions = [];
let subject = "";

const lines = text.split('\\n').map(l => l.trim());
let i = 0;
while (i < lines.length) {
    const line = lines[i];
    if (!line) {
        i++;
        continue;
    }
    
    if (["ENGLISH LANGUAGE", "MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY"].includes(line)) {
        const subjMap = {
            "ENGLISH LANGUAGE": "English",
            "MATHEMATICS": "Mathematics",
            "PHYSICS": "Physics",
            "CHEMISTRY": "Chemistry",
            "BIOLOGY": "Biology"
        };
        subject = subjMap[line];
        i++;
        continue;
    }
    
    const m = line.match(/^(\\d+)\\.\\s+(.*)/);
    if (m) {
        const qNum = m[1];
        let qText = m[2];
        
        i++;
        while (i < lines.length && !lines[i].match(/^[A-E]\\./) && !lines[i].startsWith("ANS:")) {
            if (lines[i]) {
                qText += " " + lines[i];
            }
            i++;
        }
        
        const options = [];
        let ansLetter = null;
        let ansIdx = 0;
        
        while (i < lines.length) {
            const optLine = lines[i];
            if (optLine.match(/^[A-E]\\./)) {
                options.push(optLine.substring(2).trim());
                i++;
            } else if (optLine.startsWith("ANS:")) {
                const ansStr = optLine.substring(4).trim();
                const ansM = ansStr.match(/^([A-E])/);
                if (ansM) {
                    ansLetter = ansM[1];
                    ansIdx = ansLetter.charCodeAt(0) - 'A'.charCodeAt(0);
                }
                i++;
                break; // done reading this question
            } else {
                i++;
            }
        }
        
        if (options.length > 0 && ansLetter) {
             const q = {
                 id: parseInt(qNum) + 1000,
                 subject: subject,
                 topic: "General",
                 question: qText,
                 options: options.slice(0, 4), // max 4 options
                 correctAnswer: ansIdx
             };
             questions.push(q);
        }
        continue;
    }
    i++;
}

// Read the original file
const originalCode = fs.readFileSync('src/lib/postUtmeQuestions.ts', 'utf-8');

let newCode = originalCode;

// Basic text replacement to inject new questions.
for (const subj of ["English", "Mathematics", "Physics", "Chemistry"]) {
    const subjQuestions = questions.filter(q => q.subject === subj);
    if (subjQuestions.length === 0) continue;
    
    // We already have existing arrays like \`  English: [\`
    const questionsStr = subjQuestions.map(q => JSON.stringify(q) + ",").join("\\n    ");
    
    const regex = new RegExp(\`(\${subj}:\\\\s*\\\\[)\\\\s*\\n\`);
    newCode = newCode.replace(regex, \`$1\\n    \${questionsStr}\\n\`);
}

// Ensure Biology subject is created
const bioQuestions = questions.filter(q => q.subject === "Biology");
if (bioQuestions.length > 0) {
    const bioStr = bioQuestions.map(q => JSON.stringify(q)).join(",\\n    ");
    const bioBlock = \`,\\n  Biology: [\\n    \${bioStr}\\n  ]\`;
    newCode = newCode.replace(/\\s*];\\s*\\n\\s*\\/\\/\s*Fallback/, bioBlock + "\\n};\\n\\n// Fallback");
}

fs.writeFileSync('src/lib/postUtmeQuestions.ts', newCode);
console.log("Successfully updated postUtmeQuestions.ts, total questions added: " + questions.length);
