# EnglishStudyShelf

EnglishStudyShelf 是一个本地优先的英语电子书学习工具 / a local-first English ebook study tool.

你可以上传自己的 PDF，在本地阅读，选中单词或句子让 AI 解释，保存生词，并查看学习进度。  
You can upload your own PDFs, read them locally, ask AI to explain selected words or sentences, save vocabulary, and track progress.

## 隐私与安全 / Privacy Model

- 仓库只放代码 / Code only. It does not include textbook PDFs or book resources.
- 用户上传的 PDF 保存在本地 `data/books/`，不会提交到 Git / Uploaded PDFs stay in ignored local storage.
- 学习记录和 AI 缓存保存在本地 SQLite 数据库 / Study records and AI cache are stored locally.
- AI 请求只发送你选中的文本和解释模式 / AI requests send only selected text and explanation mode.
- 默认不会把整本书发送给 AI / The full PDF is not sent to AI by default.
- `.env` 会被忽略 / `.env` is ignored. Use `.env.example` as a local template.

## 第一版功能 / First Version Features

- 书架页面 / Book shelf
- 上传 PDF / PDF upload
- PDF 阅读页 / PDF reader
- 选中单词或句子后 AI 解释 / AI explanation for selected text
- 生词本 / Vocabulary notebook
- 学习进度可视化 / Progress visualization
- AI 结果本地缓存，减少重复 token 花费 / Local AI result cache

## 本地安装 / Local Setup

```powershell
npm.cmd install
Copy-Item .env.example .env
```

如果需要真实 AI 解释，把 `OPENAI_API_KEY` 填到 `.env`。  
For real AI explanations, fill `OPENAI_API_KEY` in `.env`.

本地运行 / Run locally:

```powershell
npm.cmd run dev
```

API 默认运行在 `http://localhost:3333`。网页地址看终端里的 Vite 输出，通常是 `http://localhost:5173`。  
The API runs on `http://localhost:3333`; the web app uses the Vite URL printed in the terminal.

## Windows 一键启动 / One-Click Start

双击项目目录里的 `start-english-study-shelf.cmd`。  
Double-click `start-english-study-shelf.cmd` in the project folder.

启动器会自动创建 `.env`、安装依赖、启动本地服务并打开浏览器。使用时请保持启动窗口打开。  
The launcher creates `.env`, installs dependencies when needed, starts the local app, and opens the browser. Keep the launcher window open while using the app.

## 仓库规则 / Repository Rules

- 不提交 PDF 文件 / Do not commit PDF files.
- 不提交 `.env` / Do not commit `.env`.
- 不提交 `data/` / Do not commit `data/`.
- 不添加“默认整本书发送给 AI”的功能 / Do not add full-book AI sending without explicit user action and a clear warning.
