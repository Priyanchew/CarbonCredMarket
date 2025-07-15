import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import { useToast } from '../../hooks/useToast';
import { useVerification } from '../../hooks/useVerification';
import apiClient from '../../lib/api';
import type { CarbonProject } from '../../types';
import { 
  TreePine, 
  Plus, 
  MapPin, 
  Calendar, 
  Award, 
  CheckCircle, 
  Clock, 
  XCircle,
  Leaf,
  Building,
  BarChart3,
  FileText,
  Globe
} from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const statusIcons = {
  pending: Clock,
  under_review: Award,
  approved: CheckCircle,
  rejected: XCircle
};

const projectTypeIcons = {
  forestry: TreePine,
  renewable_energy: Leaf,
  energy_efficiency: Building,
  agriculture: Leaf,
  industrial: Building,
  waste_management: Building,
  methane_capture: Building,
  direct_air_capture: Building
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<CarbonProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { isVerified, requireVerification } = useVerification();

  const handleCreateProject = () => {
    if (requireVerification('create projects')) {
      navigate('/app/seller/projects/create');
    } else {
      navigate('/app/seller/verification');
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSellerProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      addToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project => 
    filter === 'all' || project.status === filter
  );

  const getStatusStats = () => {
    return {
      total: projects.length,
      pending: projects.filter(p => p.status === 'pending').length,
      approved: projects.filter(p => p.status === 'approved').length,
      rejected: projects.filter(p => p.status === 'rejected').length,
      under_review: projects.filter(p => p.status === 'under_review').length
    };
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Carbon Projects</h1>
          <p className="text-gray-600 mt-2">
            Manage your carbon offset projects and track their verification status
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={handleCreateProject}
        >
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TreePine className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-3xl font-bold text-blue-600">{stats.under_review}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-2">
          {['all', 'pending', 'under_review', 'approved', 'rejected'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'outline'}
              onClick={() => setFilter(status as typeof filter)}
              className="capitalize"
            >
              {status === 'all' ? 'All Projects' : status.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <TreePine className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't created any carbon offset projects yet."
                : `No projects with ${filter.replace('_', ' ')} status found.`
              }
            </p>
            {filter === 'all' && (
              <Button onClick={handleCreateProject}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const StatusIcon = statusIcons[project.status];
            const ProjectTypeIcon = projectTypeIcons[project.project_type] || TreePine;
            
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <ProjectTypeIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {project.project_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                      <StatusIcon className="h-3 w-3" />
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{project.location}, {project.country}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Vintage: {project.vintage_year}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BarChart3 className="h-4 w-4" />
                      <span>{project.estimated_annual_reduction?.toLocaleString()} tCO₂/year</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="h-4 w-4" />
                      <span className="uppercase">{project.standard}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe className="h-4 w-4" />
                      <span>{project.total_project_lifetime} years</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {project.status === 'approved' && (
                          <Button size="sm">
                            Create Credits
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
