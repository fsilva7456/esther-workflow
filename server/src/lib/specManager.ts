import fs from 'fs';
import path from 'path';

export const specManager = {
    readSpec: (repoPath: string, specRelativePath: string): string | null => {
        const fullPath = path.join(repoPath, specRelativePath);
        if (!fs.existsSync(fullPath)) {
            return null;
        }
        try {
            return fs.readFileSync(fullPath, 'utf-8');
        } catch (error) {
            console.error(`Error reading spec at ${fullPath}:`, error);
            return null;
        }
    },

    writeSpec: (repoPath: string, specRelativePath: string, content: string): void => {
        const fullPath = path.join(repoPath, specRelativePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        try {
            fs.writeFileSync(fullPath, content);
        } catch (error) {
            console.error(`Error writing spec to ${fullPath}:`, error);
            throw error;
        }
    }
};
