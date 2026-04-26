# nagai-kana

Markdown ドキュメントが用紙サイズで印刷した時に何ページになるかを測定する CLI ツール兼ライブラリです。

実際のブラウザレンダリングで描画高さを計測するため、見た目どおりのページ数を正確に計算できます。

## 機能

- 📄 Markdown から正確なページ数を計算
- 📋 複数のファイルをまとめて処理可能
- 📐 複数の用紙サイズに対応（B5, A4, A3）
- ⚡ 複数ファイル処理時はセッション再利用で高速化
- 📊 シンプルな数値出力または詳細な JSON 出力

## インストール・実行

npm に未登録のため、GitHub から直接実行します。

### npx で実行（GitHub から）

```bash
npx github:moritalous/nagai-kana <file.md> [options]
```

例：

```bash
npx github:moritalous/nagai-kana README.md
# 出力: 1.233
```

### ローカルインストール

```bash
git clone https://github.com/moritalous/nagai-kana.git
cd nagai-kana
bun install
bun run src/cli.ts <file.md> [options]
```

## 使い方

### 基本的な使用方法

```bash
# シンプルなページ数を出力
npx github:moritalous/nagai-kana README.md

# 複数ファイルを処理
npx github:moritalous/nagai-kana doc1.md doc2.md doc3.md
```

### オプション

| オプション | 説明 | デフォルト |
|-----------|------|----------|
| `--paper <size>` | 用紙サイズ（b5, a4, a3） | a4 |
| `--detail` | 詳細情報を JSON で出力 | - |
| `--help` | ヘルプを表示 | - |

### 出力形式

**デフォルト（シンプル）：**

実質的なページ数を 1 つの数値で出力します。

```bash
$ npx github:moritalous/nagai-kana README.md
0.055
```

数値の意味：
- `1.0` = ちょうど 1 ページ
- `1.5` = 1 ページ + 半分
- `2.233` = 2 ページ + 23.3%

**詳細出力（`--detail`）：**

全ての計測情報を JSON で返します。

```bash
$ npx github:moritalous/nagai-kana README.md --detail
{
  "pages": 1,
  "renderHeight": 51,
  "contentHeight": 931,
  "lastPageFill": 0.055,
  "presets": {
    "paper": {
      "width": 794,
      "height": 1123,
      "marginH": 120,
      "marginV": 96
    }
  }
}
```

| フィールド | 説明 |
|-----------|------|
| `pages` | 必要なページ数（切り上げ） |
| `renderHeight` | Markdown の実描画高さ（px） |
| `contentHeight` | 1 ページあたりのコンテンツ高さ（px） |
| `lastPageFill` | 最後のページの埋まり具合（0～1） |
| `presets` | 使用した用紙設定 |

## 使用例

### 例 1: A4 用紙でドキュメントのページ数を確認

```bash
npx github:moritalous/nagai-kana README.md --paper a4
```

### 例 2: B5 用紙で複数ファイルを処理

```bash
npx github:moritalous/nagai-kana chapter1.md chapter2.md chapter3.md --paper b5
```

### 例 3: 詳細情報を取得して JSON 処理

```bash
npx github:moritalous/nagai-kana report.md --detail | jq '.pages'
```

## ライブラリとして使用

Node.js アプリケーションから利用できます。

```typescript
import { countPages } from "nagai-kana";

const markdown = "# Hello\n\nThis is content...";
const result = await countPages(markdown, { paper: "a4" });

console.log(`ページ数: ${result.renderHeight / result.contentHeight}`);
```

## 対応環境

- Node.js 18+（`npx` 実行時）
- Bun（開発時）
- macOS, Linux

## ライセンス

MIT

## 開発

このプロジェクトは TypeScript + Bun で構築されています。

```bash
git clone https://github.com/moritalous/nagai-kana.git
cd nagai-kana
bun install
bun test          # テスト実行
bun run src/cli.ts <file.md>  # CLI 実行
```
