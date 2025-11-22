import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Copy, Check, ArrowRight, Bot } from 'lucide-react';

export const AgentHandoff: React.FC = () => {
    const { projectId, useCaseId } = useParams<{ projectId: string; useCaseId: string }>();
    const navigate = useNavigate();
    const [instructions, setInstructions] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [specContent, setSpecContent] = useState('');
    // In a real app, we'd track which test files are associated with this use case
    const [testPaths, setTestPaths] = useState<string[]>([]);

    useEffect(() => {
        if (projectId && useCaseId) {
            fetchSpec();
            // Mock fetching test paths
            setTestPaths(['tests/unit/example.test.ts', 'tests/integration/example.api.test.ts']);
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

    const handleGenerateInstructions = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`/api/projects/${projectId}/use-cases/${useCaseId}/agent-instructions`, {
                spec: specContent,
                testPaths
            });
            setInstructions(res.data.instructions);
        } catch (error) {
            console.error('Failed to generate instructions', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(instructions);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex h-screen bg-gray-100 flex-col">
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                <h1 className="text-xl font-semibold text-gray-800">Agent Handoff</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/projects/${projectId}/tests`)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Next: Test Dashboard <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <Bot size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Agent Instructions</h2>
                                    <p className="text-sm text-gray-500">Generate a prompt to guide your AI coding agent.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleGenerateInstructions}
                                disabled={loading}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {loading ? 'Generating...' : 'Generate Instructions'}
                            </button>
                        </div>

                        <div className="flex gap-2 text-sm text-gray-600">
                            <span className="font-medium">Context:</span>
                            <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">Spec Loaded</span>
                            <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">{testPaths.length} Test Files</span>
                        </div>
                    </div>

                    <div className="flex-1 p-6 relative bg-gray-900 overflow-hidden">
                        <textarea
                            className="w-full h-full bg-transparent text-gray-300 font-mono text-sm resize-none focus:outline-none"
                            value={instructions}
                            readOnly
                            placeholder="// Instructions will appear here..."
                        />
                        {instructions && (
                            <button
                                onClick={handleCopy}
                                className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur text-white rounded-lg hover:bg-white/20 transition-colors"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
