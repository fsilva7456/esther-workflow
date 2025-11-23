import fs from 'fs';
import path from 'path';

export interface UseCase {
    id: string;
    title: string;
    specPath: string;
    status: 'new' | 'in_progress' | 'completed' | 'deprecated';
    version: string;
    createdAt?: string;
    updatedAt?: string;
    lastImplemented?: {
        version: string;
        timestamp: string;
    };
    testFiles?: {
        unit?: string;
        integration?: string;
        lastAlignedVersion?: string;
    };
}

interface ProjectConfig {
    projectName: string;
    testCommand: string;
    useCases: UseCase[];
}

export const configManager = {
    loadProjectConfig: (repoPath: string): ProjectConfig | null => {
        const configPath = path.join(repoPath, 'workflow.config.json');
        if (!fs.existsSync(configPath)) {
            return null;
        }
        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            const config = JSON.parse(content) as ProjectConfig;

            // Ensure defaults for existing use cases
            config.useCases = config.useCases.map(uc => ({
                ...uc,
                status: uc.status || 'new',
                version: uc.version || '1.0.0',
                createdAt: uc.createdAt || new Date().toISOString(),
                updatedAt: uc.updatedAt || new Date().toISOString()
            }));

            return config;
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
