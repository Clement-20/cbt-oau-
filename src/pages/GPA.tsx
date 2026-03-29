import CGPACalculator from "../components/CGPACalculator";
import { Helmet } from "react-helmet-async";

export default function GPA({ user }: { user: any }) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Helmet>
        <title>OAU CGPA Calculator | Digital Nexus</title>
        <meta name="description" content="Advanced OAU CGPA Calculator with What-If predictor and cloud sync. Built for Great Ife." />
      </Helmet>
      <CGPACalculator />
    </div>
  );
}
