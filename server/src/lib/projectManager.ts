import fs from 'fs';
import path from 'path';

export interface Project {
    id: string;
    name: string;
    repoPath: string;
    testCommand: string;
}

const PROJECTS_FILE = path.join(__dirname, '../../projects.json');

// Default projects that are always available (for Vercel deployment)
const DEFAULT_PROJECTS: Project[] = [
    {
        id: 'rad-project-default',
        name: 'RAD Project',
        repoPath: 'c:\\Users\\FrancisSilva\\Desktop\\RAD',
        testCommand: 'npm test'
    }
];

export const projectManager = {
    listProjects: (): Project[] => {
        // Always include default projects
        let projects = [...DEFAULT_PROJECTS];
        
        // Try to load additional projects from file
        if (fs.existsSync(PROJECTS_FILE)) {
            try {
                const content = fs.readFileSync(PROJECTS_FILE, 'utf-8');
                const fileProjects = JSON.parse(content) as Project[];
                // Merge, avoiding duplicates by ID
                const defaultIds = new Set(DEFAULT_PROJECTS.map(p => p.id));
                const additionalProjects = fileProjects.filter(p => !defaultIds.has(p.id));
                projects = [...projects, ...additionalProjects];
            } catch (error) {
                console.error('Error reading projects file:', error);
            }
        }
        
        return projects;
    },

    addProject: (project: Omit<Project, 'id'>): Project => {
        const projects = projectManager.listProjects();
        const newProject: Project = {
            ...project,
            id: Date.now().toString(), // Simple ID generation
        };
        projects.push(newProject);
        projectManager.saveProjects(projects);
        return newProject;
    },

    getProjectById: (id: string): Project | undefined => {
        const projects = projectManager.listProjects();
        return projects.find(p => p.id === id);
    },

    saveProjects: (projects: Project[]): void => {
        try {
            fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
        } catch (error) {
            console.error('Error saving projects file:', error);
            throw error;
        }
    }
};
