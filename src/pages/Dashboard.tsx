import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import JobList from '@/components/JobList';
import CreateJobButton from '@/components/CreateJobButton';
import { useAuth } from '@/hooks/useAuth';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your job postings and candidate matches
            </p>
          </div>
          <CreateJobButton />
        </div>

        <div className="space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Job Postings</h2>
              {/* Placeholder for future AI insights */}
              <div className="text-sm text-muted-foreground">
                {/* TODO: Lovable AI - Show AI-powered insights and recommendations */}
              </div>
            </div>
            <JobList />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;