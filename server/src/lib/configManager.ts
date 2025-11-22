import fs from 'fs';
import path from 'path';

interface ProjectConfig {
    projectName: string;
    testCommand: string;
    useCases: { id: string; title: string; specPath: string }[];
}

export const configManager = {
    loadProjectConfig: (repoPath: string): ProjectConfig | null => {
        const configPath = path.join(repoPath, 'workflow.config.json');
        if (!fs.existsSync(configPath)) {
            return null;
        }
        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(content) as ProjectConfig;
        } catch (error) {
            console.error(`Error reading config at ${configPath}:`, error);
            return null;
        }
    },

    saveProjectConfig: (repoPath: string, config: ProjectConfig): void => {
        const configPath = path.join(repoPath, 'workflow.config.json');
        try {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error(`Error writing config to ${configPath}:`, error);
            throw error;
        }
    }
};
