import fs from 'fs';
import path from 'path';

export interface Project {
    id: string;
    name: string;
    repoPath: string;
    testCommand: string;
}

const PROJECTS_FILE = path.join(__dirname, '../../projects.json');

export const projectManager = {
    listProjects: (): Project[] => {
        if (!fs.existsSync(PROJECTS_FILE)) {
            return [];
        }
        try {
            const content = fs.readFileSync(PROJECTS_FILE, 'utf-8');
            return JSON.parse(content) as Project[];
        } catch (error) {
            console.error('Error reading projects file:', error);
            return [];
        }
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
