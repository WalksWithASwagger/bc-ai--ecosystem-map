'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  Plus, 
  Settings, 
  Activity, 
  Calendar,
  Users,
  BarChart3,
  ChevronDown,
  Check
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
  pipelinesEnabled: string[];
  recordCount: number;
}

interface ProjectSelectorProps {
  currentProject?: string;
  onProjectChange: (projectId: string) => void;
  className?: string;
}

export default function ProjectSelector({ 
  currentProject, 
  onProjectChange, 
  className = "" 
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/research/projects');
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
        
        // Auto-select first project if none selected
        if (!currentProject && data.projects.length > 0) {
          onProjectChange(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find(p => p.id === currentProject);

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'funding': return '💰';
      case 'competitive': return '🏆';
      case 'ecosystem': return '🌱';
      default: return '📊';
    }
  };

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case 'funding': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'competitive': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'ecosystem': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="w-6 h-6 bg-gray-700 rounded animate-pulse" />
        <div className="w-48 h-8 bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Project Selector Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 hover:bg-gray-800/70 transition-all duration-200 min-w-[280px]"
        >
          <Database className="w-5 h-5 text-gray-400" />
          {selectedProject ? (
            <div className="flex-1 text-left">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{getProjectTypeIcon(selectedProject.type)}</span>
                <span className="font-medium text-white">{selectedProject.name}</span>
                <span className={`px-2 py-0.5 text-xs rounded border ${getProjectTypeColor(selectedProject.type)}`}>
                  {selectedProject.type}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {selectedProject.recordCount.toLocaleString()} records • {selectedProject.pipelinesEnabled.length} pipelines
              </div>
            </div>
          ) : (
            <span className="text-gray-400">Select a project...</span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
            >
              {/* Project List */}
              <div className="p-2">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      onProjectChange(project.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors text-left group"
                  >
                    <div className="flex-shrink-0">
                      <span className="text-lg">{getProjectTypeIcon(project.type)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white group-hover:text-blue-400 transition-colors">
                          {project.name}
                        </span>
                        {project.id === currentProject && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={`px-2 py-0.5 text-xs rounded border ${getProjectTypeColor(project.type)}`}>
                          {project.type}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center space-x-1">
                          <BarChart3 className="w-3 h-3" />
                          <span>{project.recordCount.toLocaleString()}</span>
                        </span>
                        <span className="text-xs text-gray-400 flex items-center space-x-1">
                          <Activity className="w-3 h-3" />
                          <span>{project.pipelinesEnabled.length}</span>
                        </span>
                      </div>
                      
                      {project.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Create New Project Button */}
              <div className="border-t border-gray-700 p-2">
                <button
                  onClick={() => {
                    setShowCreateForm(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors text-blue-400 hover:text-blue-300"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create New Project</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <CreateProjectModal
            onClose={() => setShowCreateForm(false)}
            onSuccess={(project) => {
              setProjects(prev => [project, ...prev]);
              onProjectChange(project.id);
              setShowCreateForm(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface CreateProjectModalProps {
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'ecosystem',
    description: '',
    notionDatabaseId: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/research/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess(data.project);
      } else {
        console.error('Error creating project:', data.error);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white mb-4">Create New Research Project</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Project ID</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              placeholder="funding-database"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              placeholder="Funding Database"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Project Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="ecosystem">Ecosystem Mapping</option>
              <option value="funding">Funding Intelligence</option>
              <option value="competitive">Competitive Analysis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white h-20 resize-none"
              placeholder="Brief description of this project..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notion Database ID (Optional)</label>
            <input
              type="text"
              value={formData.notionDatabaseId}
              onChange={(e) => setFormData(prev => ({ ...prev, notionDatabaseId: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              placeholder="notion-database-id"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.id || !formData.name}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}