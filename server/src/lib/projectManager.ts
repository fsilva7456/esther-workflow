import fs from 'fs';
import path from 'path';
import { configManager, UseCase } from './configManager';

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
        if (!fs.existsSync(PROJECTS_FILE)) {
            return DEFAULT_PROJECTS;
        }
        try {
            const content = fs.readFileSync(PROJECTS_FILE, 'utf-8');
            const projects = JSON.parse(content);
            // Merge defaults with saved projects, avoiding duplicates by ID
            const savedIds = new Set(projects.map((p: Project) => p.id));
            const defaultsToAdd = DEFAULT_PROJECTS.filter(p => !savedIds.has(p.id));
            return [...defaultsToAdd, ...projects];
        } catch (error) {
            console.error('Error reading projects file:', error);
            return DEFAULT_PROJECTS;
        }
    },

    addProject: (project: Omit<Project, 'id'>): Project => {
        const projects = projectManager.listProjects();
        const newProject = {
            ...project,
            id: Date.now().toString()
        };

        // Filter out defaults from the file save to keep it clean
        const projectsToSave = [...projects.filter(p => !DEFAULT_PROJECTS.some(dp => dp.id === p.id)), newProject];

        try {
            fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projectsToSave, null, 2));
        } catch (error) {
            console.error('Error writing projects file:', error);
            throw error;
        }
        return newProject;
    },

    getProjectById: (id: string): Project | undefined => {
        const projects = projectManager.listProjects();
        return projects.find(p => p.id === id);
    }
};
