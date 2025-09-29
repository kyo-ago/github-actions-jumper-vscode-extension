# GitHub Actions Jumper

![VSCode Extension](https://img.shields.io/badge/VSCode-Extension-blue)

A VSCode extension that enables Ctrl+Click (Cmd+Click on Mac) navigation to action files referenced by `uses` in GitHub Actions workflow files.

## Features

- Navigate to referenced action files by Ctrl+Click (Cmd+Click on Mac) on `uses` fields in GitHub Actions workflow files (`.github/workflows/*.yml`, `.github/workflows/*.yaml`)
- Support for direct jumps to local action files (paths starting with `./`)
- Support for links to external GitHub repository actions (opens in browser)

## Usage

1. Install the extension
2. Open a GitHub Actions workflow file (`.yml` or `.yaml` files in `.github/workflows/`)
3. Ctrl+Click (Cmd+Click on Mac) on the action path specified in `uses:`
4. The referenced file or GitHub page will open

## Supported `uses` Formats

### Local Actions
```yaml
uses: ./path/to/action
uses: ./path/to/action@v1
```
For local actions, files are searched in the following order:
1. The specified path itself
2. `path/action.yml`
3. `path/action.yaml`

### External GitHub Actions
```yaml
uses: owner/repo@v1
uses: owner/repo/path/to/action@main
```
For external actions, the GitHub repository page will open in your browser.

## Development

### Setup
```bash
npm install
npm run compile
```

### Debug
1. Open the project in VSCode
2. Press F5 to start debugging the extension
3. A new VSCode window will open with the extension loaded
