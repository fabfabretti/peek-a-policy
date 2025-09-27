<div align="center" style="position: relative;">
<img src="TBA" align="center" width="30%" style="margin: -20px 0 0 20px;">
<h1>Peek-a-Policy</h1>
<p align="center">
	<img src="https://img.shields.io/github/license/fabfabretti/peek-a-policy?style=default&logo=opensourceinitiative&logoColor=white&color=403e80" alt="license">
	<img src="https://img.shields.io/github/last-commit/fabfabretti/peek-a-policy?style=default&logo=git&logoColor=white&color=403e80" alt="last-commit">
	<img src="https://img.shields.io/github/languages/top/fabfabretti/peek-a-policy?style=default&color=403e80" alt="repo-top-language">
</p>
</div>


## Overview

**Peek-a-Policy** is a browser extension designed to let users easily understand privacy policies while browsing. It leverages configurable LLMs to generate a structured summary based on GDPR requirements and evaluations of how good each indicator is for the final user.

* **Self-hostable**: no third-party server dependency; model calls are made using the user’s own API key (OpenAI-compatible) set in Settings.
* **Universal**: works with any site by attempting automatic retrieval of the policy or manually pasting the policy content.
* **Transparent**: produces short summaries in a simple language, and indicators with colors, scores and explanation for each item's meaning.
* **Customizable**: users can choose what parts of a policy they're interested in and output sumamries tailored to their preferences.

## Features

* **Automatic policy retrieval** (scans footer links, parses & cleans content).
* **Summarizer & Scorer**: GDPR-based summary and indicators with explanations.
* **Local caching** of results to view past analyses.
* **Customizable**: choose LLM, GDPR aspects to analyze, enable/disable caching.
* **Reactive UI**: Home, Settings, and Result pages with tooltips and colors/icons to improve understanding.


## Tech stack

* **Extension framework**: WXT — chosen for single codebase (Chrome/Firefox), hot reload, unified APIs, and strong community support.
* **Frontend**: React + Tailwind; UI components from HeroUI.
* **Build system**: Vite (integrates seamlessly with WXT).
* **Storage**: Local Storage (persistent, no external backend required).
* **LLM client**: wrapper on openai npm package (works with ChatGPT, DeepSeek, Gemini, or Ollama self-hosted).

## Architecture
* **Manifest** (JSON): defines permissions, resources, and metadata.
* **Popup script** (UI): entry point (Home/Settings/Result pages).
* **Content script** (Retrieval): runs in page context; locates policy links and sends extracted text.
* **Summarizer & Scorer**:
  * **PromptUtils**: builds GDPR-based prompts.
  * **LLMApiManager**: singleton wrapper with sendGenPrompt(prompt) (handles errors/timeouts).
  * **PolicyRequestManager**: orchestrates the flow (policy → prompt → LLM response → structured summary & indicators).
  * **readabilityUtils**: adds Flesch–Kincaid readability scores.


## Getting Started

### Prerequisites

* Node.js ≥ 18
* npm
* Chrome or Firefox installed

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/fabsfabretti/peek-a-policy.git
cd peek-a-policy

npm install
```
Run the extension in Chrome or Firefox:
```bash
npm run dev
npm run dev:firefox
```

