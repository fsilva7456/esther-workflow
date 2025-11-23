import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import axios from 'axios';
import { Save, MessageSquare, ArrowRight, FileText, Wand2, CheckCircle, PlayCircle, AlertCircle, Settings, X } from 'lucide-react';
import { getApiUrl } from '../config/api';

interface UseCase {
    id: string;
    title: string;
    specPath: string;
    status: 'new' | 'in_progress' | 'completed' | 'deprecated';
    version: string;
    createdAt?: string;
    updatedAt?: string;
    lastImplemented?: {
        version: string;
        timestamp: string;
    };
}

interface ProjectConfig {
    projectName: string;
    useCases: UseCase[];
}

export const UseCaseEditor: React.FC = () => {
    const { projectId, useCaseId } = useParams<{ projectId: string; useCaseId?: string }>();
    const navigate = useNavigate();
    const [config, setConfig] = useState<ProjectConfig | null>(null);
    const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);
    const [specContent, setSpecContent] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [promptType, setPromptType] = useState<'structureUseCase' | 'reviseUseCase'>('structureUseCase');
    const [promptTemplate, setPromptTemplate] = useState('');
    const [defaultTemplate, setDefaultTemplate] = useState('');

    useEffect(() => {
        if (showPromptModal) {
            fetchPromptTemplate(promptType);
        }
    }, [showPromptModal, promptType]);

    const fetchPromptTemplate = async (type: string) => {
        try {
            const res = await axios.get(getApiUrl(`/api/prompts/${type}`));
            setPromptTemplate(res.data.template);
            setDefaultTemplate(res.data.template);
        } catch (error) {
            console.error('Failed to fetch prompt template', error);
        }
    };

    const handleSaveDefaultPrompt = async () => {
        try {
            await axios.post(getApiUrl(`/api/prompts/${promptType}`), {
                template: promptTemplate
            });
            setDefaultTemplate(promptTemplate);
            alert('Default prompt updated!');
        } catch (error) {
            console.error('Failed to save default prompt', error);
            alert('Failed to save default prompt');
        }
    };

    const handleResetPrompt = () => {
        setPromptTemplate(defaultTemplate);
    };

    useEffect(() => {
        if (projectId) {
            fetchConfig();
        }
    }, [projectId, useCaseId]); // Re-run when useCaseId changes

    const fetchConfig = async () => {
        try {
            const res = await axios.get(getApiUrl(`/api/projects/${projectId}/config`));
            setConfig(res.data);

            if (res.data.useCases.length > 0) {
                let targetUseCase = null;

                if (useCaseId) {
                    targetUseCase = res.data.useCases.find((u: UseCase) => u.id === useCaseId);
                }

                if (!targetUseCase && !useCaseId) {
                    // Default to first if no ID provided
                    targetUseCase = res.data.useCases[0];
                    // Update URL to match
                    navigate(`/projects/${projectId}/use-cases/${targetUseCase.id}`, { replace: true });
                } else if (!targetUseCase && useCaseId) {
                    // ID provided but not found, maybe fallback or 404?
                    // For now, fallback to first
                    targetUseCase = res.data.useCases[0];
                }

                if (targetUseCase) {
                    setSelectedUseCase(targetUseCase);
                    // Only fetch spec if it's different or not loaded
                    fetchSpec(targetUseCase.id);
                }
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
            // Refresh config to get updated timestamp
            fetchConfig();
            alert('Spec saved!');
        } catch (error) {
            console.error('Failed to save spec', error);
        }
    };

    const handleUpdateStatus = async (newStatus: UseCase['status']) => {
        if (!selectedUseCase || !projectId) return;

        const metadataUpdates: any = { status: newStatus };

        try {
            await axios.post(getApiUrl(`/api/projects/${projectId}/use-cases/${selectedUseCase.id}/spec`), {
                content: specContent, // Send content to ensure we don't lose unsaved changes
                metadata: metadataUpdates
            });
            fetchConfig();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const handleStructureSpec = async () => {
        if (!selectedUseCase || !projectId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(getApiUrl(`/api/projects/${projectId}/use-cases/${selectedUseCase.id}/spec/structure`), {
                description,
                title: selectedUseCase.title,
                currentSpec: specContent,
                customPromptTemplate: showPromptModal && promptType === 'structureUseCase' ? promptTemplate : undefined
            });
            setSpecContent(res.data.spec);
            if (showPromptModal) setShowPromptModal(false); // Close modal if open
        } catch (error: any) {
            console.error('Failed to structure spec', error);
            setError(error.response?.data?.error || error.message || 'Failed to generate structure');
        } finally {
            setLoading(false);
        }
    };

    const handleReviseSpec = async () => {
        if (!selectedUseCase || !projectId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(getApiUrl(`/api/projects/${projectId}/use-cases/${selectedUseCase.id}/spec/revise`), {
                currentSpec: specContent,
                instructions,
                customPromptTemplate: showPromptModal && promptType === 'reviseUseCase' ? promptTemplate : undefined
            });
            setSpecContent(res.data.spec);
            setInstructions('');
            if (showPromptModal) setShowPromptModal(false); // Close modal if open
        } catch (error: any) {
            console.error('Failed to revise spec', error);
            setError(error.response?.data?.error || error.message || 'Failed to revise spec');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'deprecated': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'new': return <AlertCircle size={14} />;
            case 'in_progress': return <PlayCircle size={14} />;
            case 'completed': return <CheckCircle size={14} />;
            default: return null;
        }
    };

    if (!config) return <div>Loading...</div>;

    return (
        <div className="flex h-screen bg-gray-100 relative">
            {/* Prompt Editor Modal */}
            {showPromptModal && (
                <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-xl">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Settings size={18} />
                                Configure AI Instructions
                            </h3>
                            <button onClick={() => setShowPromptModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto">
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Prompt Type</label>
                                <select
                                    value={promptType}
                                    onChange={(e) => setPromptType(e.target.value as any)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="structureUseCase">Structure from Description</option>
                                    <option value="reviseUseCase">Revise Spec</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Prompt Template
                                    <span className="ml-2 text-xs font-normal text-gray-400">(Use {'{{variable}}'} for dynamic content)</span>
                                </label>
                                <textarea
                                    className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={promptTemplate}
                                    onChange={(e) => setPromptTemplate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between items-center">
                            <button
                                onClick={handleResetPrompt}
                                className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5"
                            >
                                Reset to Default
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveDefaultPrompt}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                                >
                                    Save as Default
                                </button>
                                <button
                                    onClick={promptType === 'structureUseCase' ? handleStructureSpec : handleReviseSpec}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <PlayCircle size={16} />
                                    Run Once
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            {config && (
                <Sidebar
                    projectId={projectId || ''}
                    projectName={config.projectName}
                    useCases={config.useCases}
                    activeUseCaseId={selectedUseCase?.id}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    {/* ... existing header left ... */}
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold text-gray-800">{selectedUseCase?.title}</h1>
                        {selectedUseCase && (
                            <div className="flex items-center gap-2">
                                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(selectedUseCase.status)}`}>
                                    {getStatusIcon(selectedUseCase.status)}
                                    {selectedUseCase.status.toUpperCase().replace('_', ' ')}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">v{selectedUseCase.version}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* ... existing header right ... */}
                        <select
                            value={selectedUseCase?.status}
                            onChange={(e) => handleUpdateStatus(e.target.value as UseCase['status'])}
                            className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="deprecated">Deprecated</option>
                        </select>

                        <div className="h-6 w-px bg-gray-300 mx-2"></div>

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

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-700 text-sm">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-xs font-medium">Dismiss</button>
                    </div>
                )}

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
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Wand2 size={18} className="text-purple-600" />
                                <span className="font-medium text-gray-700">AI Assistant</span>
                            </div>
                            <button
                                onClick={() => {
                                    setPromptType('structureUseCase');
                                    setShowPromptModal(true);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
                                title="Configure Instructions"
                            >
                                <Settings size={16} />
                            </button>
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
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-700">Revise Spec</h3>
                                    <button
                                        onClick={() => {
                                            setPromptType('reviseUseCase');
                                            setShowPromptModal(true);
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                        title="Configure Instructions"
                                    >
                                        <Settings size={14} />
                                    </button>
                                </div>
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
