import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Download, 
  Users, 
  Star, 
  Eye, 
  Mail, 
  Phone,
  MapPin,
  Calendar,
  Trophy,
  Briefcase,
  GraduationCap,
  Plus,
  Filter,
  MoreVertical,
  Trash2
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  title: string;
  experience: string;
  education: string;
  skills: string[];
  avatar?: string;
  matchScore: number;
  addedDate: string;
  jobRole: string;
  status: 'new' | 'contacted' | 'interviewed' | 'rejected' | 'hired';
}

interface Shortlist {
  id: string;
  name: string;
  jobTitle: string;
  candidateCount: number;
  createdDate: string;
  candidates: Candidate[];
}

const Shortlists = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShortlist, setSelectedShortlist] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');

  // Mock data
  const [shortlists] = useState<Shortlist[]>([
    {
      id: '1',
      name: 'Senior Frontend Engineers',
      jobTitle: 'Senior Frontend Developer',
      candidateCount: 8,
      createdDate: '2024-01-15',
      candidates: [
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          phone: '+1 (555) 123-4567',
          location: 'San Francisco, CA',
          title: 'Senior Frontend Developer',
          experience: '6 years',
          education: 'BS Computer Science',
          skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL'],
          matchScore: 95,
          addedDate: '2024-01-15',
          jobRole: 'Senior Frontend Developer',
          status: 'interviewed',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b90e4e5c?w=32&h=32&fit=crop&crop=face'
        },
        {
          id: '2',
          name: 'Michael Chen',
          email: 'michael.chen@email.com',
          location: 'New York, NY',
          title: 'Full Stack Developer',
          experience: '5 years',
          education: 'MS Software Engineering',
          skills: ['React', 'Node.js', 'Python', 'AWS', 'Docker'],
          matchScore: 88,
          addedDate: '2024-01-14',
          jobRole: 'Senior Frontend Developer',
          status: 'contacted',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
        },
        {
          id: '3',
          name: 'Emily Davis',
          email: 'emily.davis@email.com',
          location: 'Austin, TX',
          title: 'UI/UX Developer',
          experience: '4 years',
          education: 'BS Design + CS Minor',
          skills: ['Vue.js', 'JavaScript', 'Figma', 'CSS', 'HTML'],
          matchScore: 82,
          addedDate: '2024-01-13',
          jobRole: 'Senior Frontend Developer',
          status: 'new'
        }
      ]
    },
    {
      id: '2',
      name: 'Backend Developers',
      jobTitle: 'Senior Backend Engineer',
      candidateCount: 5,
      createdDate: '2024-01-12',
      candidates: []
    },
    {
      id: '3',
      name: 'DevOps Engineers',
      jobTitle: 'DevOps Engineer',
      candidateCount: 3,
      createdDate: '2024-01-10',
      candidates: []
    }
  ]);

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

  const handleExportShortlist = (shortlistId: string) => {
    toast({
      title: "Export Started",
      description: "Your shortlist is being exported to CSV format."
    });
  };

  const getStatusColor = (status: Candidate['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'contacted': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'interviewed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'hired': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const currentShortlist = shortlists.find(s => s.id === selectedShortlist);
  const filteredCandidates = currentShortlist?.candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    const matchesSkill = skillFilter === 'all' || candidate.skills.includes(skillFilter);
    return matchesSearch && matchesStatus && matchesSkill;
  }) || [];

  const allSkills = Array.from(new Set(currentShortlist?.candidates.flatMap(c => c.skills) || []));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Candidate Shortlists</h1>
          <p className="text-muted-foreground mt-1">
            Manage your selected candidates and export lists
          </p>
        </div>

        <Tabs defaultValue="shortlists" className="space-y-6">
          <TabsList>
            <TabsTrigger value="shortlists">My Shortlists</TabsTrigger>
            <TabsTrigger value="candidates">All Candidates</TabsTrigger>
          </TabsList>

          <TabsContent value="shortlists" className="space-y-6">
            {selectedShortlist ? (
              // Detailed shortlist view
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Button 
                      variant="ghost" 
                      onClick={() => setSelectedShortlist(null)}
                      className="mb-2"
                    >
                      ← Back to Shortlists
                    </Button>
                    <h2 className="text-2xl font-bold">{currentShortlist?.name}</h2>
                    <p className="text-muted-foreground">{currentShortlist?.jobTitle} • {filteredCandidates.length} candidates</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExportShortlist(selectedShortlist)}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Candidates
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search candidates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="interviewed">Interviewed</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={skillFilter} onValueChange={setSkillFilter}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Filter by skill" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Skills</SelectItem>
                          {allSkills.map(skill => (
                            <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Candidates List */}
                <div className="grid gap-4">
                  {filteredCandidates.map((candidate) => (
                    <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={candidate.avatar} />
                              <AvatarFallback>{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{candidate.name}</h3>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="text-sm font-medium">{candidate.matchScore}%</span>
                                </div>
                              </div>
                              
                              <p className="text-muted-foreground mb-2">{candidate.title}</p>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                                {candidate.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {candidate.location}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-4 w-4" />
                                  {candidate.experience}
                                </div>
                                <div className="flex items-center gap-1">
                                  <GraduationCap className="h-4 w-4" />
                                  {candidate.education}
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mb-3">
                                {candidate.skills.slice(0, 5).map((skill) => (
                                  <Badge key={skill} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {candidate.skills.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{candidate.skills.length - 5} more
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Badge className={getStatusColor(candidate.status)}>
                                    {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Added {new Date(candidate.addedDate).toLocaleDateString()}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                  {candidate.phone && (
                                    <Button variant="ghost" size="icon">
                                      <Phone className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredCandidates.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' || skillFilter !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Start adding candidates to this shortlist'
                        }
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              // Shortlists overview
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {shortlists.map((shortlist) => (
                  <Card 
                    key={shortlist.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedShortlist(shortlist.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{shortlist.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{shortlist.jobTitle}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Candidates</span>
                          <span className="font-semibold">{shortlist.candidateCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Created</span>
                          <span>{new Date(shortlist.createdDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportShortlist(shortlist.id);
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                          <Button size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Create New Shortlist Card */}
                <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-center h-full min-h-[200px]">
                    <div className="text-center">
                      <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <h3 className="font-semibold mb-1">Create New Shortlist</h3>
                      <p className="text-sm text-muted-foreground">Start organizing candidates for a specific role</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="candidates">
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Candidates View</h3>
                <p className="text-muted-foreground">
                  This section will show all candidates across all shortlists with advanced filtering and search capabilities.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Shortlists;