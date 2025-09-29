import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'yaml';

export function activate(context: vscode.ExtensionContext) {
    const provider = new GitHubActionsLinkProvider();

    // Register for all YAML files in .github directory
    const githubDisposable = vscode.languages.registerDocumentLinkProvider(
        { scheme: 'file', pattern: '**/.github/**/*.{yml,yaml}' },
        provider
    );

    context.subscriptions.push(githubDisposable);
}

export function deactivate() {}

class GitHubActionsLinkProvider implements vscode.DocumentLinkProvider {
    provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
        const text = document.getText();
        const links: vscode.DocumentLink[] = [];

        try {
            const yamlContent = yaml.parse(text);
            console.log('Parsed YAML content:', JSON.stringify(yamlContent, null, 2));

            // Handle workflow files (with jobs)
            if (yamlContent?.jobs) {
                console.log('Processing workflow file with jobs');
                for (const jobName in yamlContent.jobs) {
                    const job = yamlContent.jobs[jobName];
                    if (job?.steps && Array.isArray(job.steps)) {
                        console.log(`Processing job: ${jobName}, steps count: ${job.steps.length}`);
                        for (const step of job.steps) {
                            if (step?.uses) {
                                console.log(`Found uses in job ${jobName}: ${step.uses}`);
                                links.push(...this.processUsesField(document, step.uses));
                            }
                        }
                    }
                }
            }

            // Handle action files (with runs.steps)
            if (yamlContent?.runs?.steps && Array.isArray(yamlContent.runs.steps)) {
                console.log('Processing action file with runs.steps');
                for (const step of yamlContent.runs.steps) {
                    if (step?.uses) {
                        console.log(`Found uses in action: ${step.uses}`);
                        links.push(...this.processUsesField(document, step.uses));
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing YAML:', error);
        }

        console.log(`Total links found: ${links.length}`);
        return links;
    }

    private processUsesField(document: vscode.TextDocument, usesValue: string): vscode.DocumentLink[] {
        const links: vscode.DocumentLink[] = [];
        const text = document.getText();
        let index = 0;
        const searchPattern = `uses: ${usesValue}`;

        while ((index = text.indexOf(searchPattern, index)) !== -1) {
            const startPos = document.positionAt(index + 'uses: '.length);
            const endPos = document.positionAt(index + searchPattern.length);
            const range = new vscode.Range(startPos, endPos);

            const targetUri = this.resolveUsesPath(document, usesValue);
            if (targetUri) {
                const link = new vscode.DocumentLink(range, targetUri);
                links.push(link);
            }

            index += searchPattern.length;
        }
        return links;
    }

    private resolveUsesPath(document: vscode.TextDocument, usesValue: string): vscode.Uri | null {
        console.log(`Resolving uses path: ${usesValue}`);

        // Handle local actions (starting with ./)
        if (usesValue.startsWith('./')) {
            return this.resolveLocalAction(document, usesValue);
        }

        // Handle external GitHub actions (org/repo format)
        if (usesValue.includes('/')) {
            return this.resolveGitHubAction(usesValue);
        }

        console.log(`Unknown action format: ${usesValue}`);
        return null;
    }

    private resolveLocalAction(document: vscode.TextDocument, usesValue: string): vscode.Uri | null {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            console.log('No workspace folder found');
            return null;
        }

        let relativePath = usesValue.substring(2);

        const atIndex = relativePath.indexOf('@');
        if (atIndex !== -1) {
            relativePath = relativePath.substring(0, atIndex);
            console.log(`Stripped version tag, path: ${relativePath}`);
        }

        // Check if the path already ends with .yml or .yaml
        const hasYamlExtension = relativePath.endsWith('.yml') || relativePath.endsWith('.yaml');

        if (hasYamlExtension) {
            console.log(`Path already has YAML extension, skipping: ${relativePath}`);
            return null;
        }

        // If no YAML extension, add /action.yml or /action.yaml
        const possiblePaths = [
            path.join(workspaceFolder.uri.fsPath, relativePath, 'action.yml'),
            path.join(workspaceFolder.uri.fsPath, relativePath, 'action.yaml'),
        ];

        console.log('Checking possible paths:', possiblePaths);

        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                console.log(`Found action file: ${possiblePath}`);
                return vscode.Uri.file(possiblePath);
            }
        }

        console.log(`No action file found for: ${usesValue}`);
        return null;
    }

    private resolveGitHubAction(usesValue: string): vscode.Uri | null {
        // Remove version tag if present
        const atIndex = usesValue.indexOf('@');
        let actionPath = atIndex !== -1 ? usesValue.substring(0, atIndex) : usesValue;

        // Split into parts: org/repo or org/repo/subpath
        const parts = actionPath.split('/');
        if (parts.length < 2) {
            console.log(`Invalid GitHub action format: ${usesValue}`);
            return null;
        }

        const org = parts[0];
        const repo = parts[1];
        const subPath = parts.slice(2).join('/');

        // Construct GitHub URL
        let githubUrl: string;
        if (subPath) {
            // Action is in a subdirectory
            githubUrl = `https://github.com/${org}/${repo}/tree/main/${subPath}`;
            console.log(`GitHub action with subpath: ${githubUrl}`);
        } else {
            // Action is at repository root
            githubUrl = `https://github.com/${org}/${repo}`;
            console.log(`GitHub action at repo root: ${githubUrl}`);
        }

        return vscode.Uri.parse(githubUrl);
    }
}