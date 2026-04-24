import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loader2 } from "lucide-react";

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "resources"));
      const resourcesObj: any = {};
      querySnapshot.docs.forEach(doc => {
        const course = doc.data().course || "Unknown";
        resourcesObj[course] = (resourcesObj[course] || 0) + 1;
      });
      const dataArr = Object.keys(resourcesObj).map(course => ({ name: course, total: resourcesObj[course] }));
      setData(dataArr);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" fontSize={12} interval={0} />
          <YAxis label={{ value: 'Resources Count', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Bar dataKey="total" fill="#3B82F6" name="No. of Resources" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
