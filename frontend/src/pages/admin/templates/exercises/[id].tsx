import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ExerciseTemplateEditPage() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      // Redirect to create page with the ID as a query parameter
      router.replace(`/admin/templates/exercises/create?id=${id}`);
    }
  }, [id, router]);

  return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
}
