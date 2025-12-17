# Podcaster Persona - Production-Focused Analysis

## Overview

The **Podcaster Persona** is an analysis mode designed specifically for content creators who need to transform their podcast episodes into production-ready assets. Unlike the learning-focused `deep_dive` persona, the podcaster persona focuses on **content extraction and repurposing** rather than educational insights.

## Philosophy

### Core Principle: Production Over Education

**Traditional Analysis (Deep Dive):**

- "What can a listener learn from this content?"
- Actionable takeaways for personal growth
- Quiz questions to test understanding
- Reflective prompts for deeper thinking

**Podcaster Analysis:**

- "What content can I create from this episode?"
- Production-ready show notes
- Shareable social media content
- Discoverability through timestamps and chapters

### Key Differences

| Aspect           | Deep Dive (Learner)                 | Podcaster (Creator)             |
| ---------------- | ----------------------------------- | ------------------------------- |
| **Primary User** | Content consumer                    | Content creator                 |
| **Goal**         | Extract insights to apply           | Extract assets to publish       |
| **Outputs**      | Quizzes, reflections, mental models | Show notes, clips, social posts |
| **Timestamps**   | Reference points for learning       | Production editing markers      |
| **Quotes**       | Supporting evidence for concepts    | Shareable soundbites            |

## What Makes Great Podcaster Analysis?

### 1. **Speaker-Agnostic Design**

- Works for solo podcasts (1 speaker)
- Works for interview podcasts (2+ speakers)
- Automatically detects format and adapts
- No assumptions about guest presence

### 2. **Production-Ready Outputs**

All content should be:

- **Copy-pasteable**: Ready to use without editing
- **SEO-optimized**: Includes keywords and searchable terms
- **Platform-specific**: Formatted for different channels
- **Time-stamped**: Linked to exact moments in the episode

### 3. **Focus on Discoverability**

Help podcasters answer:

- "What's this episode about?" (Description)
- "Where do I find [topic]?" (Chapters/timestamps)
- "What are the best moments?" (Notable quotes)
- "How do I promote this?" (Social content)

## Core Features

### Feature 1: Launch Asset Generator (formerly Show Notes)

**Purpose**: Auto-generate professional assets that help listeners discover and navigate content.

**Components:**

### 🆕 NEW: Title Strategy Variations

Instead of generating one title, the AI provides **3-4 distinct marketing angles**:

- **The Curiosity Gap**: "Why Your 'Comfort Zone' is Actually Dangerous"
- **The Benefit-Driven**: "How to Use Mortality to Stop Fearing Judgment"
- **The Contrarian**: "Stop Pursuing Happiness: Why You Should Chase Regret Instead"
- **The Direct**: "Mastering Decisions, Anxiety Cost, and The 3-Generation Rule"

**Standard Components:**

- **Episode Description**: 2-3 paragraph SEO-optimized summary
- **Key Points**: 5-8 main topics/insights covered
- **Notable Quotes**: 3-5 shareable soundbites with timestamps
- **Chapters**: Timestamp-based navigation for major topic shifts

**Design Principles:**

- Neutral language (works for solo or multi-speaker format)
- Focus on content, not delivery
- Timestamps are critical for editing and navigation
- Quotes are verbatim, not paraphrased

---

### Feature 2: Clip Finder (Planned)

**Purpose**: Identify viral-worthy moments for social media clips.

**Will Include:**

- Start/end timestamps for clip boundaries
- Viral potential scoring (high/medium/low)
- Suggested clip titles
- Platform recommendations (TikTok, YouTube Shorts, Instagram Reels)

---

### Feature 3: Social Content Pack (Planned)

**Purpose**: Generate **platform-native** promotional content.

### 🆕 NEW: Platform-Native Strategy

The AI must not simply summarize the episode. It must write in the **style and format** native to the platform.

**1. LinkedIn Generator ("The Story/Insight")**

- **Style:** "Bro-etry" / Storytelling.
- **Mechanism:** Identifies _one_ specific Mental Model or Story from the episode and writes a standalone post about it.
- **Structure:** Hook -> Story/Context -> The Lesson -> "Link in comments".

**2. X (Twitter) Thread Generator ("The Breakdown")**

- **Style:** Educational/List-based.
- **Mechanism:** Takes a complex concept from the episode and breaks it down.
- **Structure:**
  - Tweet 1: The Hook (Counter-intuitive fact).
  - Tweet 2-5: The Breakdown (The "Meat").
  - Tweet 6: The CTA ("Listen to full episode").

**3. YouTube Description**

- **Style:** SEO & Navigation heavy.
- **Mechanism:** Includes Timestamps (Chapters) and Links.

---

## Technical Architecture

### How It Works

1. **Content Ingestion**: Same as deep_dive (audio, video, text)
2. **Transcript Sectioning**: Same chunking logic
3. **Section Analysis**: Different prompts focused on production value
4. **Synthesis**: Generates assets instead of quizzes
5. **Output**: Production-ready JSON structure

### Data Flow
