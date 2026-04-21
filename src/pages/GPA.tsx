import CGPACalculator from "../components/CGPACalculator";
import { Helmet } from "react-helmet-async";

export default function GPA({ user }: { user: any }) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Helmet>
        <title>OAU CGPA Calculator & GPA Predictor | ICEPAB Digital Nexus</title>
        <meta name="description" content="Calculate your OAU CGPA with the ICEPAB Digital Nexus calculator. Feature-rich GPA predictor for Great Ife students, supporting 5.0 and 4.0 scales." />
        <meta name="keywords" content="OAU CGPA calculator, OAU GPA predictor, calculate OAU grades, OAU grading system, ICEPAB, Clement IfeOluwa, OAU student portal results" />
      </Helmet>
      <CGPACalculator />
    </div>
  );
}
