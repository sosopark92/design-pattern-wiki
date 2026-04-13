import subprocess
import os
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def has_changes():
    result = subprocess.run(
        ["git", "diff", "--quiet", "daily/", "knowledge/"],
        capture_output=True,
        cwd=ROOT
    )
    return result.returncode != 0  # non-zero = there are changes


def git_commit():
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    subprocess.run(["git", "add", "daily/", "knowledge/"], cwd=ROOT)
    result = subprocess.run(
        ["git", "commit", "-m", f"study: session {timestamp}"],
        capture_output=True,
        text=True,
        cwd=ROOT
    )
    return result.returncode == 0


# Guard: don't run if called recursively from within Claude
if os.environ.get("CLAUDE_INVOKED_BY"):
    exit(0)

if not os.path.exists(os.path.join(ROOT, ".git")):
    print("Git not initialized — skipping commit. Run: git init")
    exit(0)

if has_changes():
    success = git_commit()
    if success:
        print("✅ Wiki changes committed to git.")
    else:
        print("⚠️  Git commit failed — check git status manually.")
else:
    print("Nothing new to commit.")