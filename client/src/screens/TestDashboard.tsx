import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Play, CheckCircle, XCircle, Clock, Terminal } from 'lucide-react';

interface TestRun {
    runId: string;
    status: 'pending' | 'passed' | 'failed';
    output: string;
    timestamp: string;
}

export const TestDashboard: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [runs, setRuns] = useState<TestRun[]>([]);
    const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
    const [running, setRunning] = useState(false);

    // In a real app, we'd poll or use websockets. Here we just fetch manually or after run.

    const handleRunTests = async () => {
        setRunning(true);
        try {
            const res = await axios.post(`/api/projects/${projectId}/test-runs`, {
                scope: 'all' // Simplified
            });
            const runId = res.data.runId;

            // Poll for result
            const interval = setInterval(async () => {
                try {
                    const runRes = await axios.get(`/api/projects/${projectId}/test-runs/${runId}`);
                    if (runRes.data.status !== 'pending') {
                        clearInterval(interval);
                        setRunning(false);
                        setRuns(prev => [runRes.data, ...prev]);
                        setSelectedRun(runRes.data);
                    }
                } catch (e) {
                    clearInterval(interval);
                    setRunning(false);
                }
            }, 1000);

        } catch (error) {
            console.error('Failed to start test run', error);
            setRunning(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 flex-col">
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                <h1 className="text-xl font-semibold text-gray-800">Test Dashboard</h1>
                <button
                    onClick={handleRunTests}
                    disabled={running}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${running ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                        }`}
                >
                    <Play size={18} /> {running ? 'Running...' : 'Run All Tests'}
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar List */}
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="font-medium text-gray-700">Recent Runs</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {runs.map(run => (
                            <button
                                key={run.runId}
                                onClick={() => setSelectedRun(run)}
                                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 flex items-center justify-between ${selectedRun?.runId === run.runId ? 'bg-blue-50' : ''
                                    }`}
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {run.status === 'passed' ? (
                                            <CheckCircle size={16} className="text-green-500" />
                                        ) : (
                                            <XCircle size={16} className="text-red-500" />
                                        )}
                                        <span className="font-medium text-gray-900">Run #{run.runId.slice(-4)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Clock size={12} />
                                        {new Date(run.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </button>
                        ))}
                        {runs.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                No runs yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Detail View */}
                <div className="flex-1 bg-gray-900 p-6 overflow-hidden flex flex-col">
                    {selectedRun ? (
                        <>
                            <div className="flex items-center justify-between mb-4 text-white">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Terminal size={20} /> Output for Run #{selectedRun.runId}
                                </h2>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedRun.status === 'passed' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                                    }`}>
                                    {selectedRun.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 bg-black rounded-lg p-4 overflow-auto font-mono text-sm text-gray-300 whitespace-pre-wrap">
                                {selectedRun.output}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            Select a run to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
