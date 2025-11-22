import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectSelector } from './screens/ProjectSelector';
import { UseCaseEditor } from './screens/UseCaseEditor';
import { TestGenerator } from './screens/TestGenerator';
import { AgentHandoff } from './screens/AgentHandoff';
import { TestDashboard } from './screens/TestDashboard';

function App() {
    return (
import React from 'react';
    import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
    import { ProjectSelector } from './screens/ProjectSelector';
    import { UseCaseEditor } from './screens/UseCaseEditor';
    import { TestGenerator } from './screens/TestGenerator';
    import { AgentHandoff } from './screens/AgentHandoff';
    import { TestDashboard } from './screens/TestDashboard';

    function App() {
        return (
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/projects" replace />} />
                    <Route path="/projects" element={<ProjectSelector />} />
                    <Route path="/projects/:projectId/use-cases" element={<UseCaseEditor />} />
                    <Route path="/projects/:projectId/use-cases/:useCaseId/tests" element={<TestGenerator />} />
                    <Route path="/projects/:projectId/use-cases/:useCaseId/agent" element={<AgentHandoff />} />
                    <Route path="/projects/:projectId/tests" element={<TestDashboard />} />
                </Routes>
            </Router>
        );
    }

    export default App;
