# ⚔️ Battle Spirits Eternal

**Battle Spirits Eternal** is a full-featured web-based digital implementation of the official *Battle Spirits* trading card game. It features an interactive, rule-compliant 3D battlefield arena, a deck builder, card collection browser, universal card effect engine, Grandwalker Nexus system, Burst and Advent mechanics, Soul Core management, and an intelligent AI opponent.

---

## 🌟 Key Features

- **Official Battle Steps & Mechanics**:
  - Full turn progression: *Start Step → Core Step → Draw Step → Refresh Step → Main Step → Attack Step (Flash Timings & Block Prompts) → End Step*.
  - Strict timing enforcement: Main-Step only deployments vs. Flash combat timings.
- **Grandwalker Nexus & Core Charge Engine**:
  - Center Field Nexus Zone with individual core management and zone modal inspector.
  - Official Core Charge mechanics (milling deck-top cards to charge cores on deploy and summon).
  - On-field `[Grand Skill: X]` Flash activations and `[Grand Field]` passive domain triggers.
- **Soul Core Mechanics & Strict Depletion**:
  - Accurate Soul Core tracking across Reserve, Field Spirits, and Trash.
  - Automatic identification of Soul Core in Reserve to pay costs.
  - Strict 0-Core depletion: spirits reduced to 0 cores upon transferring or removing Soul Cores immediately deplete to Trash.
- **Advent (`[煌臨]`) & Burst (`[バースト]`) Systems**:
  - Multi-condition Advent requirements (Cost, Family, Color, Soul Core sacrifice to Trash).
  - Burst set slot with secret face-down traps, trigger verification, and post-battle burst discarding.
- **Separated Core Trash & Card Graveyard**:
  - Distinct HUD counters for **🔮 Core Trash** (used core pool that refreshes to Reserve) and **🪦 Card Graveyard** (defeated/discarded cards pile).
- **Interactive Field Controls**:
  - Native Drag-and-Drop spirit repositioning on the battlefield.
  - Contained, smooth horizontal mouse wheel scrolling across battle lines without layout shift.
- **Universal Card Effect Engine**:
  - NLP-powered database covering 11,515 official Battle Spirits cards with over 22,600 parsed actions across 26 operational categories.

---

## 📂 Project Structure & Folders Used

This system incorporates architectures, data pipelines, and toolkits across several key directories:

1. **`BSP/` (Core Application)**
   - **Main Game Platform**: Houses the core server (`server.py`), battle arena engine (`battle_arena.js`), arena interface (`arena.html`), deck builder (`deck_builder.js` / `deck.html`), global styling (`styles.css`), and the SQLite database (`battle_spirits.db`).
2. **`BSP_backup/` (Backup Archive)**
   - **Secondary Archive**: Standalone safety backup directory synchronized with all modified source files, assets, and packaged project backups.
3. **`nlp/` (Card Effect NLP Engine)**
   - **NLP & Text Mining Engine**: Document analysis and natural language processing pipelines used for parsing complex Japanese/English Battle Spirits card effect text into actionable JSON rule trees.
4. **`Game-AI-Development-Toolkit/` (Game AI Architecture)**
   - **Game AI Toolkit**: Referenced for Monte Carlo decision modeling, heuristic state evaluation, and AI weight training.

---

## 🔗 External GitHub Repositories Referenced

During the development and enhancement of **Battle Spirits Eternal**, the following open-source GitHub repositories were utilized:

- **[duoergun0729/nlp](https://github.com/duoergun0729/nlp)**
  - Natural Language Processing architectures, tokenization algorithms, and classification pipelines adapted for rule parsing and card effect classification.
- **[Junkai-Lu/Game-AI-Development-Toolkit](https://github.com/Junkai-Lu/Game-AI-Development-Toolkit)**
  - Reinforcement learning concepts, game AI search trees, and decision weighting utilized for the AI Champion opponent.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js (for running the automated test suite)

### Running the Game Server
From the root directory:
```bash
python server.py
```
The server will start at `http://127.0.0.1:8000/`.
- Open **`http://127.0.0.1:8000/`** to view the home portal.
- Open **`http://127.0.0.1:8000/arena.html`** to enter the Battle Arena.
- Open **`http://127.0.0.1:8000/deck.html`** to build and manage your decks.

### Running Test Suites
To verify all mechanics across the 17 comprehensive test suites:
```bash
node scratch/run_all_master_tests.js
```

---

## 📜 License
Developed for educational and recreational gameplay preservation of the *Battle Spirits* TCG. All card imagery and trademark rights belong to Bandai.
