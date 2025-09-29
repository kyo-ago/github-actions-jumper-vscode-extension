# GitHub Actions Jumper

![VSCode Extension](https://img.shields.io/badge/VSCode-Extension-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

GitHub ActionsのワークフローファイルでCtrl+クリック（Cmd+クリック）により、`uses`で参照されているアクションファイルにジャンプできるVSCode拡張機能です。

## 機能

- GitHub Actionsワークフローファイル（`.github/workflows/*.yml`、`.github/workflows/*.yaml`）内の`uses`フィールドでCtrl+クリック（MacではCmd+クリック）すると、参照先のファイルにジャンプできます
- ローカルのアクションファイル（`./`で始まるパス）への直接ジャンプをサポート
- 外部GitHubリポジトリのアクションへのリンクもサポート（ブラウザで開きます）

## 使い方

1. 拡張機能をインストールします
2. GitHub Actionsのワークフローファイル（`.github/workflows/`内の`.yml`または`.yaml`ファイル）を開きます
3. `uses:`で指定されているアクションのパス上でCtrl+クリック（MacではCmd+クリック）します
4. 参照先のファイルまたはGitHubページが開きます

## サポートされる`uses`形式

### ローカルアクション
```yaml
uses: ./path/to/action
uses: ./path/to/action@v1
```
ローカルアクションの場合、以下の順序でファイルを検索します：
1. 指定されたパス自体
2. `path/action.yml`
3. `path/action.yaml`

### 外部GitHubアクション
```yaml
uses: owner/repo@v1
uses: owner/repo/path/to/action@main
```
外部アクションの場合、GitHubのリポジトリページをブラウザで開きます。

## 開発

### セットアップ
```bash
npm install
npm run compile
```

### デバッグ
1. VSCodeでプロジェクトを開く
2. F5キーを押して拡張機能のデバッグを開始
3. 新しいVSCodeウィンドウが開き、拡張機能がロードされます

## ライセンス

MIT