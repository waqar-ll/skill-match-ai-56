import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const CreateJobButton = () => {
  return (
    <Link to="/upload-job">
      <Button size="lg" className="shadow-lg">
        <Plus className="h-4 w-4 mr-2" />
        Create New Job
      </Button>
    </Link>
  );
};

export default CreateJobButton;