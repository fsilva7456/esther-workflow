import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const specManager = {
    readSpec: (repoPath: string, specRelativePath: string): string | null => {
        const fullPath = path.join(repoPath, specRelativePath);
        if (!fs.existsSync(fullPath)) {
            return null;
        }
        try {
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            // Parse frontmatter, but for now we just return the raw content 
            // because the frontend expects the full markdown including frontmatter.
            // In the future, we might want to return { content, data } separately.
            return fileContent;
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
            // content is expected to be the full markdown string (potentially with frontmatter already)
            // If we need to inject metadata, we should do it before calling this or parse/stringify here.
            // For now, we assume the content passed in is what should be written.
            fs.writeFileSync(fullPath, content);
        } catch (error) {
            console.error(`Error writing spec to ${fullPath}:`, error);
            throw error;
        }
    },

    // Helper to extract metadata if needed
    parseSpec: (content: string) => {
        return matter(content);
    },

    // Helper to stringify content with metadata
    stringifySpec: (content: string, metadata: any) => {
        return matter.stringify(content, metadata);
    }
};
