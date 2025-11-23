import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Play, FileText, CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { getApiUrl } from '../config/api';

interface TestRunResult {
    success: boolean;
    output: string;
    error?: string;
    duration: number;
}

export const TestDashboard: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [testFiles, setTestFiles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [runningTest, setRunningTest] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, TestRunResult>>({});
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        if (projectId) {
            fetchConfig();
            fetchTestFiles();
        }
    }, [projectId]);

    const fetchConfig = async () => {
        try {
            const res = await axios.get(getApiUrl(`/api/projects/${projectId}/config`));
            setConfig(res.data);
        } catch (error) {
            console.error('Failed to fetch config', error);
        }
    };

    const fetchTestFiles = async () => {
        try {
            const res = await axios.get(getApiUrl(`/api/projects/${projectId}/tests`));
            setTestFiles(res.data.files);
        } catch (error) {
            console.error('Failed to fetch test files', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunTest = async (filePath: string) => {
        setRunningTest(filePath);
        try {
            // Start the run
            const startRes = await axios.post(getApiUrl(`/api/projects/${projectId}/test-runs`), {
                filePath
            });
            const runId = startRes.data.runId;

            // Poll for result
            pollResult(runId, filePath);

        } catch (error) {
            console.error('Failed to start test run', error);
            setRunningTest(null);
        }
    };

    const pollResult = async (runId: string, filePath: string) => {
        const interval = setInterval(async () => {
            try {
                const res = await axios.get(getApiUrl(`/api/projects/${projectId}/test-runs/${runId}`));
                if (res.data) {
                    clearInterval(interval);
                    setResults(prev => ({ ...prev, [filePath]: res.data }));
                    setRunningTest(null);
                }
            } catch (error) {
                // If 404, maybe not ready yet? Or actually failed.
            }
        }, 1000);

        // Timeout after 30s
        setTimeout(() => {
            clearInterval(interval);
            if (runningTest === filePath) {
                setRunningTest(null);
                alert('Test run timed out');
            }
        }, 30000);
    };

    return (
        <div className="flex h-screen bg-gray-100 flex-row">
            {config && (
                <Sidebar
                    projectId={projectId || ''}
                    projectName={config.projectName}
                    useCases={config.useCases}
                />
            )}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/projects/${projectId}/use-cases`)}
                            className="text-gray-500 hover:text-gray-700"
                            title="Back to Editor"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">Test Dashboard</h1>
                    </div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <h2 className="font-medium text-gray-700">Available Tests</h2>
                                <button
                                    onClick={fetchTestFiles}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Refresh
                                </button>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center text-gray-500">Loading tests...</div>
                            ) : testFiles.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    No test files found. Go to a Use Case to generate some!
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {testFiles.map(file => (
                                        <div key={file} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <FileText size={20} className="text-gray-400" />
                                                    <span className="font-medium text-gray-800">{file}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRunTest(file)}
                                                    disabled={runningTest === file}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${runningTest === file
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                                        }`}
                                                >
                                                    {runningTest === file ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                            Running...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play size={16} /> Run Test
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {results[file] && (
                                                <div className={`mt-3 p-3 rounded-lg text-sm border ${results[file].success
                                                    ? 'bg-green-50 border-green-100'
                                                    : 'bg-red-50 border-red-100'
                                                    }`}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {results[file].success ? (
                                                            <CheckCircle size={16} className="text-green-600" />
                                                        ) : (
                                                            <XCircle size={16} className="text-red-600" />
                                                        )}
                                                        <span className={`font-medium ${results[file].success ? 'text-green-800' : 'text-red-800'
                                                            }`}>
                                                            {results[file].success ? 'Passed' : 'Failed'}
                                                        </span>
                                                        <span className="text-gray-400 text-xs flex items-center gap-1 ml-auto">
                                                            <Clock size={12} /> {results[file].duration}ms
                                                        </span>
                                                    </div>
                                                    <pre className={`whitespace-pre-wrap font-mono text-xs mt-2 ${results[file].success ? 'text-green-700' : 'text-red-700'
                                                        }`}>
                                                        {results[file].output}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
