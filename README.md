<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1XNmeOcH_cAXejRbbelPwq6gWzdntyzyT

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Documentation

- **[SPECIFICATION.md](SPECIFICATION.md)**: 詳細な仕様書（Mermaidシーケンス図を含むUML）
- **[TESTING.md](TESTING.md)**: テストガイドとテスト仕様

## Testing

テストを実行：

```bash
# 全テストを実行
npm test

# UIモードでテストを実行
npm run test:ui

# カバレッジレポートを生成
npm run test:coverage
```

詳細は [TESTING.md](TESTING.md) をご覧ください。
