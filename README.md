# MINDCHAT — AI-Powered Messaging Platform

> **"Chat freely. Remember what matters."**

MindChat is an intelligent messaging platform built with an original visual identity and a unique AI-powered memory and privacy system. It helps users avoid searching through thousands of old messages by automatically understanding conversations, flagging important deadlines, events, and action items for user approval, and storing them in an organized AI Memory bank.

---

## 🌐 Live Website Access

The application is currently compiled, running, and accessible at:

* **Local Development URL:** [http://localhost:5173/](http://localhost:5173/)
* **Network Host URL:** Accessible over your local network as reported by Vite (e.g. `http://172.16.28.75:5173/`)

---

## ⚡ Core Concept & Workflow

```
NORMAL CONVERSATION
       ↓
AI UNDERSTANDS CONVERSATION
       ↓
CASUAL INFORMATION  →  Temporary / Optional Smart Cleanup
IMPORTANT DETAILS   →  "✦ Potentially Important" User Review
       ↓
USER APPROVES
       ↓
AI MEMORY (Tasks, Deadlines, Events, Decisions)
```

**"AI understands. You decide."** — MindChat never takes control away from the user. AI suggests, classifies, translates, and summarizes, but the user decides what is saved, what is deleted, and who can see their data.

---

## 🚀 Key Features

1. **Original Visual Identity:**
   * Deep navy-indigo layered background (`#090D1C`) with subtle cyan & violet ambient glows.
   * Original MindChat AI Symbol combining conversation orbits, neural synapse nodes, and an intelligence spark.
   * Distinct surfaces for outgoing (`var(--bubble-outgoing)`) and incoming (`var(--bubble-incoming)`) messages.
   * Dark mode (primary) and custom warm off-white Light mode.

2. **Real-time Messaging & Status:**
   * One-to-one and group messaging.
   * Sent (✓), Delivered (✓✓), and Read (✓✓ in cyan/mint) receipts.
   * Typing simulation and online presence indicators (🟢 Online, Away, DND, Offline).
   * Message reactions (❤️, 👍, 🎯, 🔥, 💡), replying, copying, editing, and deleting.

3. **Message Expiration Timers:**
   * Per-message or per-chat default timers (10 seconds, 1 minute, 1 hour, 24 hours, custom).
   * Live countdown indicator (`⏱ 00:42`).
   * Automatic background expiration purge.

4. **13 Indian Languages Translation:**
   * Dedicated translation service abstraction.
   * Supports: Kannada, Hindi, Telugu, Tamil, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Odia, Assamese, Urdu, and English.
   * Original message remains intact, with translated text and language tags displayed neatly beneath.
   * Preferred translation language selector in Settings.

5. **AI Chat Analyzer & Memory Bank:**
   * Classifies messages into: *Casual*, *Important*, *Task*, *Deadline*, *Event*, *Decision*, and *Useful information*.
   * In-bubble **✦ Potentially Important** review card with `[Save to Memory]` and `[Dismiss]`.
   * Dedicated **AI Memory** section categorized by *Tasks*, *Deadlines*, *Events*, *Decisions*, *Projects*, and *Notes*.
   * Direct deep-link from any memory back to the source message.

6. **AI Chat Summarization:**
   * Summarizes chat threads for *Today*, *Last 7 Days*, or *Entire Conversation*.
   * Outputs structured topics, decisions, tasks with assignees, and deadlines.

7. **Natural-Language Chat Search:**
   * Ask plain-English questions: *"When is our project review?"* or *"What did Rahul say about the PPT?"*.
   * Searches authorized messages and provides one-click jump navigation.

8. **Smart Chat Cleanup:**
   * Identifies small-talk, expired ephemeral notes, and redundant chatter.
   * Full review and explicit user confirmation before any message is deleted.

9. **Chat Streaks:**
   * Tracks meaningful daily interactions (e.g. 🔥 12 days streak with Varsha).
   * Milestones at 7, 30, and 100 days.

10. **Custom Profile Capsule Tags:**
    * Clean capsule indicators like `[AI/ML]`, `[Student]`, `[Developer]` displayed alongside user profiles.
    * Users can add, edit, or remove custom tags.

11. **Voice & Video Calling UI:**
    * Calling interface with ringing, connected duration timers, microphone mute, camera toggle, and end call controls.

12. **Temporary 24-Hour Status Stories:**
    * Post and view status updates that expire after 24 hours.

---

## 🛠 Technology Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React icons, Canvas Confetti.
* **Backend Integration:** Supabase Client (`@supabase/supabase-js`) with full PostgreSQL schema, 22 tables, foreign keys, triggers, and Row Level Security (RLS) policies.
* **Local Reactive Store:** Full offline/demo state persistence with `LocalStorage` and `EventTarget` bus, allowing complete 100% fidelity without remote credentials.
* **AI Engine:** Secure MindChat Neural Intelligence layer for intent extraction and classification.
* **Translation:** Indic-Trans service abstraction with language script detection.

---

## 📁 Project Structure

```
project/
├── public/
│   └── favicon.svg                  # Original MindChat SVG icon
├── src/
│   ├── types/
│   │   ├── database.ts              # 22 table models and entities
│   │   ├── ai.ts                    # Intelligence and classification types
│   │   └── translation.ts           # 13 Indian languages definitions
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client connector & status
│   │   └── utils.ts                 # Formatting, timers, classnames
│   ├── services/
│   │   ├── ai/
│   │   │   ├── analyzer.ts          # Intent detection & extraction
│   │   │   ├── summarizer.ts        # Chat summarization engine
│   │   │   └── search.ts            # Natural language chat search
│   │   ├── translation/
│   │   │   └── indicTranslator.ts   # 13 Indian languages service
│   │   └── mock/
│   │       ├── seedData.ts          # Demo users & realistic chats
│   │       └── mockStore.ts         # Reactive event-driven local store
│   ├── contexts/
│   │   ├── ThemeContext.tsx         # Dark / Light theme management
│   │   ├── AuthContext.tsx          # Authentication & onboarding state
│   │   ├── ChatContext.tsx          # Conversations, timers, contacts
│   │   └── AIContext.tsx            # Memories, summaries, cleanup
│   ├── components/
│   │   ├── common/                  # Logo, AI symbol, Button, Modal
│   │   ├── landing/                 # LandingPage showcase
│   │   ├── onboarding/              # 5-step guided onboarding flow
│   │   ├── auth/                    # Sign in, Sign up & 1-click Demo
│   │   ├── sidebar/                 # Navigation and Chat list
│   │   ├── chat/                    # Header, Bubbles, Input, Smart panel
│   │   ├── ai/                      # Memory Bank, Insights, Cleanup, Search
│   │   ├── calling/                 # Voice & Video call overlay
│   │   ├── status/                  # 24-hour Status viewer & creator
│   │   ├── contacts/                # Contact manager & blocking
│   │   ├── starred/                 # Starred vs AI-suggested view
│   │   ├── notifications/           # Notification center
│   │   ├── profile/                 # Profile editor & capsule tags
│   │   └── settings/                # Privacy settings & translation prefs
│   ├── App.tsx                      # Master layout and shell
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Design tokens & ambient backgrounds
├── supabase/
│   └── migrations/
│       └── 20260101000000_mindchat_schema.sql  # 22 tables + RLS policies
├── .env.example                     # Environment configuration template
└── README.md
```

---

## 💾 Database Schema

The database migration located at `supabase/migrations/20260101000000_mindchat_schema.sql` defines all 22 required PostgreSQL tables:

1. `profiles`
2. `profile_tags`
3. `contacts`
4. `contact_blocks`
5. `chats`
6. `chat_members`
7. `messages`
8. `message_reactions`
9. `message_receipts`
10. `message_timers`
11. `attachments`
12. `statuses`
13. `status_views`
14. `notifications`
15. `chat_streaks`
16. `ai_classifications`
17. `ai_memories`
18. `chat_summaries`
19. `tasks`
20. `reminders`
21. `privacy_settings`
22. `call_records`

Row Level Security (RLS) policies are defined for all tables to guarantee strict user isolation.

---

## 🏃 Running Locally

To run the application locally:

```bash
# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev

# 3. Open in your browser:
# http://localhost:5173/
```

To build for production:

```bash
npm run build
```

---

## 🔒 Privacy & Security

* AI analysis is strictly optional and can be toggled in Settings.
* Messages are not stored permanently into AI Memory without manual approval.
* Disappearing messages have active backend/local purge timers.
* No sensitive API keys are exposed to client code.
