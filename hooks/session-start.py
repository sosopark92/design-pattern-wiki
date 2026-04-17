import os
import json
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KNOWLEDGE = os.path.join(ROOT, "knowledge")
DAILY = os.path.join(ROOT, "daily")


def count_files(directory):
    if not os.path.exists(directory):
        return 0
    return len([f for f in os.listdir(directory) if f.endswith(".md")])


def get_last_session():
    if not os.path.exists(DAILY):
        return None
    logs = sorted([f for f in os.listdir(DAILY) if f.endswith(".md")], reverse=True)
    if not logs:
        return None
    return logs[0].replace(".md", "")


def read_index_summary():
    index_path = os.path.join(KNOWLEDGE, "index.md")
    if not os.path.exists(index_path):
        return "(index not yet created)"
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()
    # Return first 2000 chars — enough for Claude to orient
    return content[:2000]


concepts = count_files(os.path.join(KNOWLEDGE, "concepts"))
reviews = count_files(os.path.join(KNOWLEDGE, "reviews"))
connections = count_files(os.path.join(KNOWLEDGE, "connections"))
antipatterns = count_files(os.path.join(KNOWLEDGE, "antipatterns"))
last_session = get_last_session()
index_summary = read_index_summary()

context = f"""
=== Design Pattern Study Wiki — {date.today()} ===

Knowledge base status:
  Concepts:     {concepts}
  Reviews:      {reviews}
  Connections:  {connections}
  Antipatterns: {antipatterns}

Last session: {last_session or 'none yet'}

--- knowledge/index.md (first 2000 chars) ---
{index_summary}
---

Read CLAUDE.md before starting any operation.
""".strip()

output = {
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": context
    }
}

print(json.dumps(output))