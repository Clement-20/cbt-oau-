import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const useQuestionCache = (courseId: string) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      const cacheKey = `nexus_cache_${courseId}`;
      const cacheTimeKey = `nexus_cache_time_${courseId}`;
      const cacheExpiry = 1000 * 60 * 60 * 24; // 24 hours

      const cachedData = localStorage.getItem(cacheKey);
      const cachedTime = localStorage.getItem(cacheTimeKey);

      if (cachedData && cachedTime && Date.now() - parseInt(cachedTime) < cacheExpiry) {
        setQuestions(JSON.parse(cachedData));
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedQuestions = data.questions || [];
          localStorage.setItem(cacheKey, JSON.stringify(fetchedQuestions));
          localStorage.setItem(cacheTimeKey, Date.now().toString());
          setQuestions(fetchedQuestions);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [courseId]);

  return { questions, loading };
};
