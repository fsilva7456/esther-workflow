import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, PlayCircle, CheckCircle } from 'lucide-react';

interface UseCase {
    id: string;
    title: string;
    status: 'new' | 'in_progress' | 'completed' | 'deprecated';
}

interface SidebarProps {
    projectId: string;
    projectName: string;
    useCases: UseCase[];
    activeUseCaseId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ projectId, projectName, useCases, activeUseCaseId }) => {
    const navigate = useNavigate();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'deprecated': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0">
            <div className="p-4 border-b border-gray-200">
                <h2 className="font-bold text-gray-800 truncate" title={projectName}>{projectName}</h2>
                <p className="text-xs text-gray-500">Use Cases</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {useCases.map(uc => (
                    <button
                        key={uc.id}
                        onClick={() => navigate(`/projects/${projectId}/use-cases/${uc.id}`)}
                        className={`w-full text-left p-2 rounded-lg mb-1 text-sm flex items-center justify-between group ${activeUseCaseId === uc.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <span className="truncate flex-1 mr-2">{uc.title}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${getStatusColor(uc.status)}`}>
                            {uc.status === 'in_progress' ? 'WIP' : uc.status}
                        </span>
                    </button>
                ))}
            </div>
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={() => navigate(`/projects`)}
                    className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                    Back to Projects
                </button>
            </div>
        </div>
    );
};
