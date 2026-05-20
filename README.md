# ToneDraft AI

**An AI-powered email composition platform** built with a Chrome extension, React frontend, and Spring Boot backend. Integrates Google's Gemini API to generate contextually aware email replies with configurable tone.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Solution & Approach](#solution--approach)
- [System Architecture](#system-architecture)
- [Component Breakdown](#component-breakdown)
- [Data Flow](#data-flow)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Key Engineering Decisions](#key-engineering-decisions)
- [Learnings & Challenges](#learnings--challenges)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)

---

## Project Overview

ToneDraft AI removes the cognitive overhead of composing professional emails. By injecting directly into Gmail via a Chrome extension, it reads the existing email thread context and generates a reply in the tone the user selects — formal, professional, casual, or empathetic — with a single click.

The project is structured as a three-layer system:

```
email-writer-ext/      Chrome Extension (content script injected into Gmail)
email-writer-react/    Standalone React Web App (Vite)
email-writer-sb/       Spring Boot REST API (Java 21)
```

---

## Problem Statement

Writing emails — especially professional ones — is time-consuming and context-dependent. Tone mismatches are a common source of miscommunication. Existing AI tools require switching tabs or copying content manually, breaking the user's workflow.

The core challenge was: **how do you inject an AI assistant directly into Gmail without disrupting the native UI, while keeping the backend stateless and the AI responses coherent with the existing thread?**

---

## Solution & Approach

The solution is a three-tier architecture that decouples the AI logic (backend), the user interaction surface (extension + web app), and the LLM provider (Google Gemini):

1. **Chrome Extension** — A content script that detects Gmail's compose/reply window, reads the active email thread from the DOM, and injects a floating UI panel with tone controls and an AI reply button.

2. **Spring Boot API** — A thin, stateless REST layer that receives the email context + tone preference, constructs a structured prompt, and calls Google Gemini's `generateContent` endpoint. The response is cleaned and returned as plain text.

3. **React Web App** — A standalone interface for users who prefer not to use the extension. Accepts an email body and tone selection, then displays the AI-generated reply with copy-to-clipboard functionality.

---

## System Architecture

```
+---------------------------+          +----------------------------+
|      User's Browser       |          |      Spring Boot API       |
|                           |          |    (email-writer-sb)       |
|  +-----------------------+|          |                            |
|  |   Gmail Web Interface ||          |  +----------------------+  |
|  |                       ||          |  |  EmailController     |  |
|  |  +------------------+ ||  HTTP    |  |  POST /api/email/    |  |
|  |  | Chrome Extension |---------->  |  |  generate            |  |
|  |  | (Content Script) | ||          |  +----------+-----------+  |
|  |  |                  | ||          |             |              |
|  |  | - Reads email    | ||          |  +----------v-----------+  |
|  |  |   thread from DOM| ||          |  |  EmailService        |  |
|  |  | - Injects AI     | ||          |  |                      |  |
|  |  |   reply panel    | ||          |  | - Prompt engineering |  |
|  |  | - Sends context  | ||          |  | - Tone injection     |  |
|  |  |   + tone to API  | ||          |  | - Response cleaning  |  |
|  |  +------------------+ ||          |  +----------+-----------+  |
|  +-----------------------+|          |             |              |
|                           |          |  +----------v-----------+  |
|  +-----------------------+|          |  |  GeminiClient        |  |
|  |  React Web App        ||          |  |  (WebClient/         |  |
|  |  (email-writer-react) ||  HTTP    |  |   RestTemplate)      |  |
|  |                       |---------->|  +----------+-----------+  |
|  | - Standalone UI       ||          |             |              |
|  | - Tone selector       ||          +-------------|-------------+|
|  | - Copy to clipboard   ||                        |
|  +-----------------------+|          +-------------v--------------+
+---------------------------+          |   Google Gemini API        |
                                       |   (generativelanguage      |
                                       |    .googleapis.com)        |
                                       |                            |
                                       |  Model: gemini-pro         |
                                       |  Endpoint: v1beta/         |
                                       |  generateContent           |
                                       +----------------------------+
```

---

## Component Breakdown

### Chrome Extension (`email-writer-ext`)

The extension uses a **content script** that is injected into Gmail pages. It:

- Observes DOM mutations to detect when a reply/compose window is opened
- Scrapes the email thread subject and body from Gmail's DOM
- Injects a custom toolbar button ("AI Reply") adjacent to Gmail's native send button
- Renders a popup panel with tone selection (Professional, Casual, Formal, Empathetic)
- On submit, sends a `POST` request to the Spring Boot API and populates Gmail's compose area with the response

```
Gmail DOM
   |
   +-- Mutation Observer watches for compose window
         |
         +-- Inject "AI Reply" button into compose toolbar
               |
               +-- User selects tone + clicks button
                     |
                     +-- Extract thread text from DOM
                           |
                           +-- POST /api/email/generate { emailContent, tone }
                                 |
                                 +-- Insert AI reply into Gmail compose box
```

### Spring Boot Backend (`email-writer-sb`)

A lightweight REST API with a single responsibility: receive email context, produce a prompt, call Gemini, return the reply.

Key classes:

| Class | Responsibility |
|---|---|
| `EmailGenerationRequest` | DTO for incoming email content and tone |
| `EmailController` | REST endpoint, input validation |
| `EmailGeneratorService` | Prompt construction, Gemini API call, response parsing |
| `GeminiConfig` | API key + endpoint configuration via `application.yml` |

The prompt template follows a structured format:

```
You are an AI email assistant.
Generate a reply to the following email in a [TONE] tone.
Be concise, clear, and contextually appropriate.

Email content:
[EMAIL_BODY]

Reply only with the email text. No subject line. No explanations.
```

### React Web App (`email-writer-react`)

A Vite-based React app for users who want to use the AI assistant outside of Gmail. Features:

- Textarea for pasting an email
- Dropdown for tone selection
- Live loading state during API call
- Output panel with formatted reply and copy button
- Responsive layout built with Material UI

---

## Data Flow

```
[1] User opens Gmail reply window
         |
[2] Extension content script detects compose DOM element
         |
[3] User clicks "AI Reply" button in injected toolbar
         |
[4] Extension extracts email thread content from DOM
         |
[5] User selects tone (e.g., "Professional")
         |
[6] POST request sent to Spring Boot API:
    {
      "emailContent": "Hi, can we reschedule tomorrow's meeting?",
      "tone": "professional"
    }
         |
[7] EmailGeneratorService constructs prompt and calls Gemini API
         |
[8] Gemini returns generated text
         |
[9] Service strips markdown artifacts, trims whitespace
         |
[10] API returns plain text reply to extension
         |
[11] Extension inserts reply text into Gmail's compose textarea
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Chrome Extension | JavaScript, HTML, CSS, Manifest V3 | Gmail integration via content script |
| Frontend | React 18, Vite, Material UI | Standalone web interface |
| Backend | Java 21, Spring Boot 3, Spring WebFlux | REST API, Gemini integration |
| AI Model | Google Gemini Pro (v1beta) | Email generation |
| Build | Maven (backend), npm (frontend) | Dependency management |
| HTTP Client | WebClient (reactive) | Non-blocking Gemini API calls |

---

## Getting Started

### Prerequisites

- Java 21+
- Node.js 18+ and npm
- Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Chrome or Chromium browser

### Backend Setup

```bash
cd email-writer-sb

# Configure your API key
# In src/main/resources/application.yml:
# gemini:
#   api-key: YOUR_API_KEY_HERE
#   api-url: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

mvn clean install
mvn spring-boot:run
# Server starts at http://localhost:8080
```

### React Web App Setup

```bash
cd email-writer-react
npm install
npm run dev
# App available at http://localhost:5173
```

### Chrome Extension Setup

```
1. Open Chrome and navigate to chrome://extensions
2. Enable "Developer mode" (toggle, top right)
3. Click "Load unpacked"
4. Select the email-writer-ext/ directory
5. Navigate to Gmail — the extension activates automatically
```

### Environment Configuration

| Variable | Location | Description |
|---|---|---|
| `gemini.api-key` | `application.yml` | Google Gemini API key |
| `gemini.api-url` | `application.yml` | Gemini endpoint URL |
| `VITE_API_BASE_URL` | `.env` (React) | Backend base URL for the web app |

---

## API Reference

### POST /api/email/generate

Generates an AI email reply given the original email content and desired tone.

**Request Body:**

```json
{
  "emailContent": "String — the original email or thread text",
  "tone": "String — one of: professional, casual, formal, empathetic"
}
```

**Response:**

```json
{
  "generatedReply": "String — the AI-generated reply text"
}
```

**Status Codes:**

| Code | Meaning |
|---|---|
| 200 | Reply generated successfully |
| 400 | Missing or invalid request body |
| 500 | Gemini API error or internal failure |

**Example:**

```bash
curl -X POST http://localhost:8080/api/email/generate \
  -H "Content-Type: application/json" \
  -d '{
    "emailContent": "Hi, can we push the 3pm standup to 4pm?",
    "tone": "professional"
  }'
```

---

## Key Engineering Decisions

**Stateless backend.** The Spring Boot API holds no session or conversation state. Every request is self-contained (email content + tone), which simplifies horizontal scaling and removes the need for a database entirely.

**Content script over browser extension popup.** A content script injected directly into the Gmail page gives the extension access to the live DOM, allowing it to read the email thread and write the reply back into Gmail's compose box — something a popup-only extension cannot do.

**Prompt engineering over fine-tuning.** Rather than fine-tuning a model for tone-specific email generation, a carefully structured zero-shot prompt with explicit tone and formatting instructions achieves consistent results. This avoids the cost and complexity of model training while remaining adjustable.

**Reactive HTTP client.** Spring WebFlux's `WebClient` is used instead of `RestTemplate` for the Gemini API call, keeping the request thread non-blocking. This matters at scale when many users trigger API calls concurrently.

**DOM mutation observer pattern.** Gmail is a single-page app that dynamically renders compose windows without full page reloads. A `MutationObserver` watching the Gmail DOM is necessary to reliably detect when to inject the extension UI.

---

## Learnings & Challenges

**Chrome Extension Manifest V3 restrictions.** Manifest V3 deprecated background pages in favor of service workers, which are ephemeral and cannot hold persistent state. Adapting to this required restructuring how the extension manages its lifecycle and message passing between content scripts and the background service worker.

**Gmail DOM instability.** Gmail frequently changes its internal class names and structure. Rather than relying on brittle class selectors, the extension uses attribute-based and structural selectors to target stable DOM landmarks (e.g., the compose toolbar's ARIA role). This improved resilience across Gmail updates.

**CORS configuration for local development.** The Spring Boot backend requires explicit CORS headers to allow requests from the Chrome extension's `chrome-extension://` origin, which is a non-standard origin not covered by typical CORS wildcard rules.

**Prompt response noise.** Early versions of the Gemini response included prefixes like "Here is a professional reply:" or markdown formatting. Post-processing in `EmailGeneratorService` strips these artifacts before returning the reply to the client, ensuring clean output.

**Tone boundary definition.** Distinguishing "formal" from "professional" in the prompt was non-trivial. After testing, the prompts were refined: "formal" produces structured, impersonal language (suitable for legal or institutional contexts), while "professional" produces warm but business-appropriate language.

---

## Future Improvements

- **Streaming responses** — Use Gemini's streaming API to render the reply word-by-word in the UI, reducing perceived latency.
- **Thread-aware context** — Pass the full email thread (not just the last message) to improve contextual accuracy of long conversations.
- **Custom tone profiles** — Allow users to define and save their own tone descriptions.
- **Firefox support** — Port the extension to use WebExtensions API for Firefox compatibility.
- **Rate limiting** — Add per-IP rate limiting on the Spring Boot API to prevent abuse of the Gemini API quota.
- **Metrics and observability** — Integrate Micrometer and a Prometheus/Grafana stack to monitor API latency and error rates.

---

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit with clear messages (`git commit -m "Add streaming response support"`)
4. Push and open a pull request against `main`

---

## License

MIT License. See `LICENSE` for details.