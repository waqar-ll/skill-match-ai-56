import { useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Users, 
  Brain, 
  FileCheck,
  AlertCircle,
  Trash2
} from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  extractedData?: {
    candidateName?: string;
    skills?: string[];
    experience?: string;
    education?: string;
  };
}

const UploadResumes = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    );

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Only PDF and DOCX files are supported.",
        variant: "destructive"
      });
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate file processing
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const fileId = `${Date.now()}-${i}`;
      
      // Add file to list
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        status: 'pending'
      };
      
      setUploadedFiles(prev => [...prev, newFile]);
      
      // Simulate processing
      setTimeout(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'processing' } : f
        ));
      }, 500);
      
      // Simulate completion with mock data
      setTimeout(() => {
        const mockExtractedData = {
          candidateName: `Candidate ${i + 1}`,
          skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'].slice(0, Math.floor(Math.random() * 5) + 1),
          experience: `${Math.floor(Math.random() * 10) + 1} years`,
          education: 'Bachelor\'s Degree'
        };
        
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: Math.random() > 0.1 ? 'completed' : 'error',
            extractedData: Math.random() > 0.1 ? mockExtractedData : undefined
          } : f
        ));
      }, 2000 + (i * 1000));
      
      setUploadProgress(((i + 1) / validFiles.length) * 100);
    }
    
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
    }, 2000 + (validFiles.length * 1000));
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
  const errorFiles = uploadedFiles.filter(f => f.status === 'error');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Upload Resumes</h1>
          <p className="text-muted-foreground mt-1">
            Build your candidate pool for AI-powered matching
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                >
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drag & drop resume files here</h3>
                  <p className="text-muted-foreground mb-4">
                    Supports PDF and DOCX files up to 10MB each
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    multiple
                    accept=".pdf,.docx,.doc"
                    onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Choose Files
                    </label>
                  </Button>
                </div>

                {isUploading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing files...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Uploaded Files ({uploadedFiles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="mt-1">
                          {getStatusIcon(file.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{file.name}</h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(file.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                          
                          {file.status === 'completed' && file.extractedData && (
                            <div className="mt-2 space-y-2">
                              <p className="text-sm font-medium">{file.extractedData.candidateName}</p>
                              <p className="text-sm text-muted-foreground">{file.extractedData.experience} • {file.extractedData.education}</p>
                              <div className="flex flex-wrap gap-1">
                                {file.extractedData.skills?.map((skill) => (
                                  <Badge key={skill} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {file.status === 'error' && (
                            <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              Failed to process file
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Upload Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Files</span>
                  <span className="font-semibold">{uploadedFiles.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Successfully Processed</span>
                  <span className="font-semibold text-green-600">{completedFiles.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <span className="font-semibold text-red-600">{errorFiles.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Processing</span>
                  <span className="font-semibold">{uploadedFiles.filter(f => f.status === 'processing').length}</span>
                </div>
              </CardContent>
            </Card>

            {/* AI Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Processing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Text Extraction</h4>
                  <p className="text-sm text-muted-foreground">
                    Extract text content from PDF and DOCX files automatically.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Skill Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    Identify and categorize technical and soft skills from resumes.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Experience Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Analyze work history and calculate relevant experience.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Profile Creation</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically create searchable candidate profiles.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* File Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>File Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium mb-1">Supported Formats</p>
                  <p className="text-muted-foreground">PDF (.pdf) and Word documents (.docx, .doc)</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium mb-1">File Size Limit</p>
                  <p className="text-muted-foreground">Maximum 10MB per file</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium mb-1">Best Results</p>
                  <p className="text-muted-foreground">Well-formatted text resumes work best for AI extraction</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium mb-1">Bulk Upload</p>
                  <p className="text-muted-foreground">Upload multiple files at once for faster processing</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UploadResumes;