export const clementQuotes = [
  "Consistency is the currency of champions.",
  "Your potential is only limited by your excuses.",
  "The portal might be down, but your grind shouldn't be.",
  "A 5.0 GPA starts with the first page you read today.",
  "Don't just pass through OAU, let OAU pass through you.",
  "The difference between a pass and an A is the extra hour.",
  "You are the architect of your own academic destiny.",
  "Code your future, one line at a time.",
  "Excellence is not an act, but a habit.",
  "Stay Cold, stay focused. ❄️🧊"
];

export const aiTips = [
  "Study Hack: Use the Pomodoro technique (25 mins focus, 5 mins rest) to maximize retention.",
  "Career Tip: Build a portfolio of projects, not just a transcript of grades.",
  "Study Hack: Teach what you've learned to an imaginary student to solidify your understanding.",
  "Career Tip: Networking is just making friends in your industry. Start now.",
  "Study Hack: Active recall is 3x more effective than passive reading.",
  "Career Tip: Soft skills get you the interview, hard skills get you the job.",
  "Study Hack: Sleep is when your brain consolidates memory. Don't skip it before an exam.",
  "Career Tip: Learn to read documentation. It's the ultimate developer superpower."
];

export const getRandomMotivation = () => {
  const isQuote = Math.random() > 0.5;
  if (isQuote) {
    return {
      type: "quote",
      content: clementQuotes[Math.floor(Math.random() * clementQuotes.length)],
      author: "Clement IfeOluwa ❄️🧊"
    };
  } else {
    return {
      type: "tip",
      content: aiTips[Math.floor(Math.random() * aiTips.length)],
      author: "AI Nexus"
    };
  }
};
