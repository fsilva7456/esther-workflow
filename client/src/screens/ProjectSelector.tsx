import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Folder } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    repoPath: string;
    testCommand: string;
}

export const ProjectSelector: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', repoPath: '', testCommand: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await axios.get('/api/projects');
            setProjects(res.data);
        } catch (error) {
            console.error('Failed to fetch projects', error);
        }
    };

    const handleAddProject = async () => {
        try {
            await axios.post('/api/projects', newProject);
            setShowAddModal(false);
            fetchProjects();
            setNewProject({ name: '', repoPath: '', testCommand: '' });
        } catch (error) {
            console.error('Failed to add project', error);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} /> Add Project
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project) => (
                    <div
                        key={project.id}
                        onClick={() => navigate(`/projects/${project.id}/use-cases`)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                                <Folder size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{project.name}</h2>
                                <p className="text-sm text-gray-500">{project.repoPath}</p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            Test Command: <code className="text-blue-600">{project.testCommand}</code>
                        </div>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New Project</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2"
                                    value={newProject.name}
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Repo Path</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2"
                                    value={newProject.repoPath}
                                    onChange={e => setNewProject({ ...newProject, repoPath: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Test Command</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2"
                                    value={newProject.testCommand}
                                    onChange={e => setNewProject({ ...newProject, testCommand: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddProject}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Add Project
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
