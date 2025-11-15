# テストガイド

このドキュメントでは、リアルタイム文字起こし＆翻訳アプリのテストについて説明します。

## テストフレームワーク

- **Vitest**: 高速で最新のテストフレームワーク
- **@testing-library/react**: Reactコンポーネントのテスト
- **jsdom**: ブラウザ環境のシミュレーション

## セットアップ

テストに必要な依存関係をインストールします：

```bash
npm install
```

## テストの実行

### 全テストを実行

```bash
npm test
```

または、watchモードで実行（ファイル変更時に自動再実行）：

```bash
npm test -- --watch
```

### UIモードでテストを実行

視覚的なインターフェースでテストを確認できます：

```bash
npm run test:ui
```

### カバレッジレポートの生成

コードカバレッジを確認します：

```bash
npm run test:coverage
```

カバレッジレポートは `coverage/` ディレクトリに生成されます。

## テストファイルの構成

```
__tests__/
├── setup.ts                      # テスト環境のセットアップ
├── constants.test.ts             # constants.ts のテスト
├── types.test.ts                 # types.ts のテスト
├── services/
│   └── geminiService.test.ts     # geminiService.ts のテスト
└── utils/
    └── audio.test.ts             # audio.ts のテスト
```

## テスト内容

### 1. audio.test.ts

**テスト対象**: `utils/audio.ts`

- `encode()` 関数
  - Uint8ArrayをBase64文字列にエンコード
  - 空配列の処理
  - 単一バイトの処理
  - 長い配列の処理

- `createBlob()` 関数
  - 正しいmimeTypeを持つBlobの作成
  - Float32ArrayをBase64エンコードデータに変換
  - 空のFloat32Arrayの処理
  - Float32からInt16への適切なスケーリング
  - 負の値の正しい処理
  - 典型的な音声バッファサイズ（4096サンプル）の処理

### 2. geminiService.test.ts

**テスト対象**: `services/geminiService.ts`

- `identifyLanguage()` 関数
  - 言語の正しい識別
  - 結果の空白文字のトリミング
  - エラー時に「不明」を返す
  - 空のテキストの処理

- `translateText()` 関数
  - テキストの正しい翻訳
  - 翻訳されたテキストの空白文字のトリミング
  - 翻訳失敗時のエラーメッセージ
  - 空のテキストの翻訳
  - 正しいモデルとフォーマットの使用

### 3. constants.test.ts

**テスト対象**: `constants.ts`

- `LANGUAGE_LIMIT`
  - 値が3であること
  - 数値型であること

- `SUPPORTED_LANGUAGES`
  - 配列であること
  - 12の言語を含むこと
  - すべてのエントリが有効なLanguage構造を持つこと
  - 最初の言語が日本語であること
  - Englishを含むこと
  - すべての期待される言語を含むこと
  - 一意な言語コードを持つこと
  - 一意な言語名を持つこと
  - コードが正しいロケール形式（xx-XX）であること

### 4. types.test.ts

**テスト対象**: `types.ts`

- `Language` インターフェース
  - 有効なLanguageオブジェクトを受け入れる
  - 必須プロパティを持つ

- `Transcription` インターフェース
  - 必須フィールドのみを持つ有効なTranscriptionを受け入れる
  - すべてのフィールドを持つTranscriptionを受け入れる
  - 翻訳フィールドなしのTranscriptionを受け入れる
  - 有効なISO 8601タイムスタンプ形式を持つ
  - 部分的な翻訳を受け入れる

- 型の互換性
  - 配列内でLanguageを許可
  - 配列内でTranscriptionを許可

## モックについて

### Gemini API のモック

`geminiService.test.ts` では、`@google/genai` ライブラリをモックしています：

```typescript
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn()
  };
});
```

これにより、実際のAPI呼び出しを行わずにテストを実行できます。

### 環境変数

テストセットアップ（`__tests__/setup.ts`）で、テスト用のAPI キーを設定しています：

```typescript
process.env.API_KEY = 'test-api-key';
```

## カバレッジ目標

- **関数カバレッジ**: 80%以上
- **行カバレッジ**: 80%以上
- **分岐カバレッジ**: 70%以上

除外ファイル：
- `node_modules/`
- `__tests__/`
- `*.config.ts`
- `index.tsx`
- `vite.config.ts`

## CI/CD統合

GitHub ActionsやCircleCIなどのCI/CDパイプラインでテストを実行する場合：

```yaml
# .github/workflows/test.yml の例
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## トラブルシューティング

### テストが失敗する場合

1. **依存関係の問題**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **環境変数が設定されていない**
   - `__tests__/setup.ts` で `API_KEY` が正しく設定されているか確認

3. **モックが正しく動作しない**
   - `vi.clearAllMocks()` と `vi.restoreAllMocks()` が適切に呼ばれているか確認

### カバレッジが低い場合

特定のファイルのカバレッジを確認：

```bash
npm run test:coverage -- audio.test.ts
```

## ベストプラクティス

1. **各テストは独立している**: テスト間で状態を共有しない
2. **テストは高速である**: モックを使用して外部依存を排除
3. **テストは読みやすい**: 明確な説明とアサーション
4. **エッジケースをテストする**: 空の入力、エラー状態など
5. **AAA パターン**: Arrange（準備）、Act（実行）、Assert（検証）

## 今後の拡張

- **E2Eテスト**: Playwright や Cypress を使用したエンドツーエンドテスト
- **Reactコンポーネントテスト**: App.tsx のコンポーネントテスト
- **パフォーマンステスト**: 大量のデータ処理のベンチマーク
- **統合テスト**: 複数のモジュール間の相互作用をテスト

## 参考資料

- [Vitest 公式ドキュメント](https://vitest.dev/)
- [Testing Library 公式ドキュメント](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
