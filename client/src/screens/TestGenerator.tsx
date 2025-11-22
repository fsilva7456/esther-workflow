import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Save, RefreshCw, Code2, FileCode } from 'lucide-react';

export const TestGenerator: React.FC = () => {
    const { projectId, useCaseId } = useParams<{ projectId: string; useCaseId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'unit' | 'integration'>('unit');
    const [testContent, setTestContent] = useState('');
    const [specContent, setSpecContent] = useState('');
    const [instructions, setInstructions] = useState('');
    const [loading, setLoading] = useState(false);
    const [filePath, setFilePath] = useState(''); // In a real app, this would be determined by config/convention

    useEffect(() => {
        if (projectId && useCaseId) {
            fetchSpec();
            // Try to load existing tests if file path is known (simplified here)
        }
    }, [projectId, useCaseId]);

    const fetchSpec = async () => {
        try {
            const res = await axios.get(`/api/projects/${projectId}/use-cases/${useCaseId}/spec`);
            setSpecContent(res.data.content);
        } catch (error) {
            console.error('Failed to fetch spec', error);
        }
    };

    const handleGenerateTests = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`/api/projects/${projectId}/use-cases/${useCaseId}/tests/generate`, {
                spec: specContent,
                type: activeTab
            });
            setTestContent(res.data.tests);
        } catch (error) {
            console.error('Failed to generate tests', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReviseTests = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`/api/projects/${projectId}/use-cases/${useCaseId}/tests/revise`, {
                currentTests: testContent,
                instructions
            });
            setTestContent(res.data.tests);
            setInstructions('');
        } catch (error) {
            console.error('Failed to revise tests', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        if (!filePath) {
            alert('Please specify a file path to save the tests.');
            return;
        }
        try {
            await axios.post(`/api/projects/${projectId}/use-cases/${useCaseId}/tests/sync`, {
                filePath,
                content: testContent
            });
            alert('Tests saved to repo!');
        } catch (error) {
            console.error('Failed to sync tests', error);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 flex-col">
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                <h1 className="text-xl font-semibold text-gray-800">Test Generator</h1>
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
                                    <Save size={14} /> Sync to Repo
                                </button>
                            </div>
                        </div>
                        <textarea
                            className="flex-1 p-4 resize-none focus:outline-none font-mono text-sm"
                            value={testContent}
                            onChange={e => setTestContent(e.target.value)}
                            placeholder="// Generated tests will appear here..."
                        />
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
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Generate from Spec</h3>
                            <p className="text-xs text-gray-500 mb-3">
                                Uses the current spec to generate {activeTab} tests.
                            </p>
                            <button
                                onClick={handleGenerateTests}
                                disabled={loading}
                                className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50"
                            >
                                {loading ? 'Generating...' : `Generate ${activeTab} Tests`}
                            </button>
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
    );
};
