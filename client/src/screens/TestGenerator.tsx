import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Save, RefreshCw, Code2, AlertTriangle, CheckCircle, Info, ArrowLeft } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { getApiUrl } from '../config/api';

interface UseCase {
    id: string;
    title: string;
    version: string;
    testFiles?: {
        unit?: string;
        integration?: string;
        lastAlignedVersion?: string;
    };
}

export const TestGenerator: React.FC = () => {
    const { projectId, useCaseId } = useParams<{ projectId: string; useCaseId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'unit' | 'integration'>('unit');
    const [testContent, setTestContent] = useState('');
    const [specContent, setSpecContent] = useState('');
    const [useCase, setUseCase] = useState<UseCase | null>(null);
    const [instructions, setInstructions] = useState('');
    const [loading, setLoading] = useState(false);
    const [filePath, setFilePath] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isOutdated, setIsOutdated] = useState(false);
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        if (projectId && useCaseId) {
            fetchData();
        }
    }, [projectId, useCaseId]);

    useEffect(() => {
        // Update file path and content when tab or useCase changes
        if (useCase && useCase.testFiles) {
            const path = activeTab === 'unit' ? useCase.testFiles.unit : useCase.testFiles.integration;
            setFilePath(path || '');
            if (path) {
                fetchTestContent(path);
            } else {
                setTestContent('');
            }
        }
    }, [activeTab, useCase]);

    const fetchData = async () => {
        try {
            const [configRes, specRes] = await Promise.all([
                axios.get(getApiUrl(`/api/projects/${projectId}/config`)),
                axios.get(getApiUrl(`/api/projects/${projectId}/use-cases/${useCaseId}/spec`))
            ]);

            const uc = configRes.data.useCases.find((u: UseCase) => u.id === useCaseId);
            setConfig(configRes.data);
            setUseCase(uc);
            setSpecContent(specRes.data.content);

            // Check version alignment
            if (uc && uc.testFiles && uc.testFiles.lastAlignedVersion) {
                if (uc.version !== uc.testFiles.lastAlignedVersion) {
                    setIsOutdated(true);
                }
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
            setError('Failed to load use case data.');
        }
    };

    const fetchTestContent = async (path: string) => {
        try {
            const res = await axios.get(getApiUrl(`/api/projects/${projectId}/use-cases/${useCaseId}/tests`), {
                params: { path }
            });
            setTestContent(res.data.content);
        } catch (error) {
            console.error('Failed to fetch test content', error);
        }
    };

    const handleGenerateTests = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await axios.post(getApiUrl(`/api/projects/${projectId}/use-cases/${useCaseId}/tests/generate`), {
                spec: specContent,
                type: activeTab
            });
            setTestContent(res.data.tests);
            setSuccess('Tests generated successfully! Review and save.');
            // Suggest a filename if empty
            if (!filePath) {
                setFilePath(`tests/${activeTab}/${useCaseId}.${activeTab === 'unit' ? 'spec' : 'test'}.ts`);
            }
        } catch (error: any) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTests = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await axios.post(getApiUrl(`/api/projects/${projectId}/use-cases/${useCaseId}/tests/update-from-spec`), {
                currentTests: testContent,
                newSpec: specContent
            });
            setTestContent(res.data.tests);
            setSuccess('Tests updated based on new spec! Review and save.');
        } catch (error: any) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleReviseTests = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await axios.post(getApiUrl(`/api/projects/${projectId}/use-cases/${useCaseId}/tests/revise`), {
                currentTests: testContent,
                instructions
            });
            setTestContent(res.data.tests);
            setInstructions('');
            setSuccess('Tests revised successfully!');
        } catch (error: any) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        if (!filePath) {
            setError('Please specify a file path to save the tests.');
            return;
        }
        setError(null);
        setSuccess(null);
        try {
            await axios.post(getApiUrl(`/api/projects/${projectId}/use-cases/${useCaseId}/tests/sync`), {
                filePath,
                content: testContent,
                type: activeTab,
                version: useCase?.version // Update alignment version
            });
            setSuccess(`Tests saved to ${filePath}`);
            setIsOutdated(false); // Assume aligned after save
            fetchData(); // Refresh config
        } catch (error) {
            console.error('Failed to sync tests', error);
            setError('Failed to save tests to repo.');
        }
    };

    const handleError = (error: any) => {
        console.error('Operation failed', error);
        const msg = error.response?.data?.error || error.message;
        if (msg.includes('429') || msg.includes('quota')) {
            setError('AI quota exceeded. Please try again in a minute.');
        } else {
            setError(`Operation failed: ${msg}`);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 flex-row">
            {config && (
                <Sidebar
                    projectId={projectId || ''}
                    projectName={config.projectName}
                    useCases={config.useCases}
                    activeUseCaseId={useCaseId}
                />
            )}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/projects/${projectId}/use-cases/${useCaseId}`)}
                            className="text-gray-500 hover:text-gray-700"
                            title="Back to Editor"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-800">Test Cases</h1>
                            <p className="text-xs text-gray-500">
                                Spec v{useCase?.version} • {isOutdated ? <span className="text-amber-600 font-medium">Tests Outdated</span> : <span className="text-green-600">Aligned</span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/projects/${projectId}/use-cases/${useCaseId}/agent`)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Next: Agent Handoff <ArrowRight size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Main Content */}
                    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                        {/* Status Messages */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200">
                                <AlertTriangle size={18} />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 border border-green-200">
                                <CheckCircle size={18} />
                                {success}
                            </div>
                        )}

                        {/* Version Warning */}
                        {isOutdated && testContent && (
                            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                                <Info className="text-amber-600 mt-0.5" size={20} />
                                <div>
                                    <h3 className="font-medium text-amber-800">Tests may be outdated</h3>
                                    <p className="text-sm text-amber-700 mt-1">
                                        These tests were aligned with spec v{useCase?.testFiles?.lastAlignedVersion}, but the spec is now v{useCase?.version}.
                                    </p>
                                    <button
                                        onClick={handleUpdateTests}
                                        disabled={loading}
                                        className="mt-2 px-3 py-1.5 bg-amber-100 text-amber-800 text-sm font-medium rounded hover:bg-amber-200"
                                    >
                                        {loading ? 'Updating...' : 'Update Tests with AI'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="flex gap-4 mb-4">
                            <button
                                onClick={() => setActiveTab('unit')}
                                className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'unit' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Unit Tests
                            </button>
                            <button
                                onClick={() => setActiveTab('integration')}
                                className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'integration' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Integration Tests
                            </button>
                        </div>

                        {/* Editor */}
                        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Code2 size={18} className="text-gray-500" />
                                    <span className="font-medium text-gray-700">Test Code (TypeScript)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Path (e.g. tests/unit/foo.test.ts)"
                                        className="border border-gray-300 rounded px-2 py-1 text-sm w-64"
                                        value={filePath}
                                        onChange={e => setFilePath(e.target.value)}
                                    />
                                    <button
                                        onClick={handleSync}
                                        className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        <Save size={14} /> Sync & Align
                                    </button>
                                </div>
                            </div>
                            {testContent ? (
                                <textarea
                                    className="flex-1 p-4 resize-none focus:outline-none font-mono text-sm"
                                    value={testContent}
                                    onChange={e => setTestContent(e.target.value)}
                                    placeholder="// Generated tests will appear here..."
                                />
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                    <Code2 size={48} className="mb-4 opacity-20" />
                                    <p>No tests found for this use case.</p>
                                    <button
                                        onClick={handleGenerateTests}
                                        disabled={loading}
                                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Generating...' : `Generate ${activeTab} Tests`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                            <RefreshCw size={18} className="text-blue-600" />
                            <span className="font-medium text-gray-700">Test Assistant</span>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Actions</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={handleGenerateTests}
                                        disabled={loading}
                                        className="w-full py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 border border-gray-200 disabled:opacity-50"
                                    >
                                        Regenerate from Scratch
                                    </button>
                                    <button
                                        onClick={handleUpdateTests}
                                        disabled={loading || !testContent}
                                        className="w-full py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 border border-amber-200 disabled:opacity-50"
                                    >
                                        Update from Spec
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Revise Tests</h3>
                                <textarea
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm mb-2 h-24"
                                    placeholder="e.g. Add a test case for invalid input..."
                                    value={instructions}
                                    onChange={e => setInstructions(e.target.value)}
                                />
                                <button
                                    onClick={handleReviseTests}
                                    disabled={loading || !instructions}
                                    className="w-full py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 disabled:opacity-50"
                                >
                                    {loading ? 'Revising...' : 'Revise Tests'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
