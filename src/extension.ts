import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'yaml';

export function activate(context: vscode.ExtensionContext) {
    const provider = new GitHubActionsLinkProvider();
    const disposable = vscode.languages.registerDocumentLinkProvider(
        { scheme: 'file', pattern: '**/.github/workflows/*.{yml,yaml}' },
        provider
    );
    context.subscriptions.push(disposable);
}

export function deactivate() {}

class GitHubActionsLinkProvider implements vscode.DocumentLinkProvider {
    provideDocumentLinks(document: vscode.TextDocument): vscode.DocumentLink[] {
        const links: vscode.DocumentLink[] = [];
        const text = document.getText();

        try {
            const yamlContent = yaml.parse(text);
            if (yamlContent && yamlContent.jobs) {
                this.findUsesInJobs(document, yamlContent.jobs, links);
            }
        } catch (error) {
            console.error('Failed to parse YAML:', error);
        }

        return links;
    }

    private findUsesInJobs(document: vscode.TextDocument, jobs: any, links: vscode.DocumentLink[]) {
        for (const jobName in jobs) {
            const job = jobs[jobName];
            if (job.steps) {
                for (const step of job.steps) {
                    if (step.uses) {
                        this.processUsesField(document, step.uses, links);
                    }
                }
            }
        }
    }

    private processUsesField(document: vscode.TextDocument, usesValue: string, links: vscode.DocumentLink[]) {
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
    }

    private resolveUsesPath(document: vscode.TextDocument, usesValue: string): vscode.Uri | null {
        if (usesValue.startsWith('./')) {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
            if (!workspaceFolder) {
                return null;
            }

            let relativePath = usesValue.substring(2);

            const atIndex = relativePath.indexOf('@');
            if (atIndex !== -1) {
                relativePath = relativePath.substring(0, atIndex);
            }

            const possiblePaths = [
                path.join(workspaceFolder.uri.fsPath, relativePath),
                path.join(workspaceFolder.uri.fsPath, relativePath, 'action.yml'),
                path.join(workspaceFolder.uri.fsPath, relativePath, 'action.yaml')
            ];

            for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                    return vscode.Uri.file(possiblePath);
                }
            }
        } else if (!usesValue.includes('@') || usesValue.split('@')[0].includes('/')) {
            const parts = usesValue.split('@');
            const repoPath = parts[0];
            const ref = parts[1] || 'main';

            if (repoPath.includes('/')) {
                const [owner, repo, ...pathParts] = repoPath.split('/');
                let actionPath = pathParts.join('/');

                const githubUrl = actionPath
                    ? `https://github.com/${owner}/${repo}/tree/${ref}/${actionPath}`
                    : `https://github.com/${owner}/${repo}/tree/${ref}`;

                return vscode.Uri.parse(githubUrl);
            }
        }

        return null;
    }
}