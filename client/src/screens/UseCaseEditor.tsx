import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Save, MessageSquare, ArrowRight, FileText, Wand2 } from 'lucide-react';
import { getApiUrl } from '../config/api';

interface UseCase {
    id: string;
    title: string;
    specPath: string;
}

interface ProjectConfig {
    projectName: string;
    useCases: UseCase[];
}

export const UseCaseEditor: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [config, setConfig] = useState<ProjectConfig | null>(null);
    const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);
    const [specContent, setSpecContent] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (projectId) {
            fetchConfig();
        }
    }, [projectId]);

    useEffect(() => {
        if (selectedUseCase && projectId) {
            fetchSpec(selectedUseCase.id);
        }
    }, [selectedUseCase, projectId]);

    const fetchConfig = async () => {
        try {
            const res = await axios.get(getApiUrl(`/api/projects/${projectId}/config`));
            setConfig(res.data);
            if (res.data.useCases.length > 0) {
                setSelectedUseCase(res.data.useCases[0]);
            }
        } catch (error) {
            console.error('Failed to fetch config', error);
        }
    };

    const fetchSpec = async (useCaseId: string) => {
        try {
            const res = await axios.get(getApiUrl(`/api/projects/${projectId}/use-cases/${useCaseId}/spec`));
            setSpecContent(res.data.content);
        } catch (error) {
            console.error('Failed to fetch spec', error);
        }
    };

    const handleSaveSpec = async () => {
        if (!selectedUseCase || !projectId) return;
        try {
            await axios.post(getApiUrl(`/api/projects/${projectId}/use-cases/${selectedUseCase.id}/spec`), {
                content: specContent
            });
            alert('Spec saved!');
        } catch (error) {
            console.error('Failed to save spec', error);
        }
    };

    const handleStructureSpec = async () => {
        if (!selectedUseCase || !projectId) return;
        setLoading(true);
        try {
            const res = await axios.post(getApiUrl(`/api/projects/${projectId}/use-cases/${selectedUseCase.id}/spec/structure`), {
                description
            });
            setSpecContent(res.data.spec);
        } catch (error) {
            console.error('Failed to structure spec', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReviseSpec = async () => {
        if (!selectedUseCase || !projectId) return;
        setLoading(true);
        try {
            const res = await axios.post(getApiUrl(`/api/projects/${projectId}/use-cases/${selectedUseCase.id}/spec/revise`), {
                currentSpec: specContent,
                instructions
            });
            setSpecContent(res.data.spec);
            setInstructions('');
        } catch (error) {
            console.error('Failed to revise spec', error);
        } finally {
            setLoading(false);
        }
    };

    if (!config) return <div>Loading...</div>;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="font-bold text-gray-800">{config.projectName}</h2>
                    <p className="text-xs text-gray-500">Use Cases</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {config.useCases.map(uc => (
                        <button
                            key={uc.id}
                            onClick={() => setSelectedUseCase(uc)}
                            className={`w-full text-left p-2 rounded-lg mb-1 text-sm ${selectedUseCase?.id === uc.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {uc.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    <h1 className="text-xl font-semibold text-gray-800">{selectedUseCase?.title}</h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSaveSpec}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            <Save size={18} /> Save
                        </button>
                        <button
                            onClick={() => navigate(`/projects/${projectId}/use-cases/${selectedUseCase?.id}/tests`)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Next: Generate Tests <ArrowRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Spec Editor */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
                            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                                <FileText size={18} className="text-gray-500" />
                                <span className="font-medium text-gray-700">Specification (Markdown)</span>
                            </div>
                            <textarea
                                className="flex-1 p-4 resize-none focus:outline-none font-mono text-sm"
                                value={specContent}
                                onChange={e => setSpecContent(e.target.value)}
                                placeholder="# Use Case Specification..."
                            />
                        </div>
                    </div>

                    {/* Right: AI Assistant */}
                    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                            <Wand2 size={18} className="text-purple-600" />
                            <span className="font-medium text-gray-700">AI Assistant</span>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto space-y-6">
                            {/* Structure Spec */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Structure from Description</h3>
                                <textarea
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm mb-2 h-24"
                                    placeholder="Describe the use case..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                                <button
                                    onClick={handleStructureSpec}
                                    disabled={loading || !description}
                                    className="w-full py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 disabled:opacity-50"
                                >
                                    {loading ? 'Generating...' : 'Generate Structure'}
                                </button>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Revise Spec</h3>
                                <textarea
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm mb-2 h-24"
                                    placeholder="Instructions for revision..."
                                    value={instructions}
                                    onChange={e => setInstructions(e.target.value)}
                                />
                                <button
                                    onClick={handleReviseSpec}
                                    disabled={loading || !instructions}
                                    className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50"
                                >
                                    {loading ? 'Revising...' : 'Revise with AI'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
