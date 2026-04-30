# 目指せ優勝！アプリ

このアプリは `Next.js` で作られています。  
ローカル保存（`data/store.json`）でも動きますが、本番運用は `Supabase` 連携を推奨します。

## 1. ローカル起動

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## 2. Supabase を使う準備

1. Supabaseで新規プロジェクトを作成
2. SQL Editorで `supabase/schema.sql` を実行
3. `Project Settings -> API` から下記を取得
   - `Project URL`
   - `service_role key`
4. `.env.local` を作成し、下記を設定

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

環境変数が入ると、アプリは自動でSupabase保存に切り替わります。

## 3. Vercel デプロイ

1. GitHubにpush
2. VercelでGitHubリポジトリをImport
3. VercelのEnvironment Variablesに以下を設定
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

これでPC/スマホの外部アクセス運用ができます。
