import os
import json
import re
import shutil
from datetime import datetime

# Define directories
HOME_DIR = os.path.expanduser("~")
APP_DATA_DIR = os.path.join(HOME_DIR, ".gemini", "antigravity-ide")
BRAIN_DIR = os.path.join(APP_DATA_DIR, "brain")

# Source and target folders
CURRENT_DIR = os.path.abspath(os.path.dirname(__file__))
TARGET_LOGS_DIR = os.path.join(CURRENT_DIR, "ai-logs")

# GUID regex pattern
GUID_PATTERN = re.compile(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$', re.IGNORECASE)

def parse_jsonl_to_markdown(jsonl_path, md_path, conv_id):
    """Parses a transcript JSONL file and writes a readable Markdown version."""
    if not os.path.exists(jsonl_path):
        return False
        
    try:
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading {jsonl_path}: {e}")
        return False

    md_content = []
    md_content.append(f"# Antigravity Conversation Log - {conv_id}\n")
    md_content.append(f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    md_content.append("---\n")

    for line in lines:
        if not line.strip():
            continue
        try:
            step = json.loads(line)
            source = step.get("source", "UNKNOWN")
            step_type = step.get("type", "")
            content = step.get("content", "")
            created_at = step.get("created_at", "")
            
            # Format header
            md_content.append(f"### [Step {step.get('step_index', 0)}] {source} ({step_type}) - *{created_at}*\n")
            
            # Format content based on source
            if source == "USER_EXPLICIT" or source == "USER":
                md_content.append(f"**User:**\n\n```markdown\n{content}\n```\n")
            elif source == "MODEL":
                md_content.append(f"**Agent:**\n\n{content}\n")
                tool_calls = step.get("tool_calls", [])
                if tool_calls:
                    md_content.append("**Tool Calls:**\n")
                    for tc in tool_calls:
                        args_str = json.dumps(tc.get("args", {}), indent=2)
                        md_content.append(f"- Tool: `{tc.get('name')}`\n  Arguments:\n  ```json\n{args_str}\n  ```\n")
            elif source == "SYSTEM":
                md_content.append(f"**System Notification:**\n\n{content}\n")
            else:
                md_content.append(f"**Content:**\n\n{content}\n")
                
            md_content.append("\n---\n")
        except Exception as e:
            # Skip invalid lines
            continue
            
    try:
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(md_content))
        return True
    except Exception as e:
        print(f"Error writing markdown to {md_path}: {e}")
        return False

def sync():
    if not os.path.exists(TARGET_LOGS_DIR):
        os.makedirs(TARGET_LOGS_DIR)
        
    if not os.path.exists(BRAIN_DIR):
        print(f"Brain directory not found at {BRAIN_DIR}")
        return

    print("Syncing Antigravity conversations...")
    count = 0
    
    # Iterate through all directories in brain
    for entry in os.listdir(BRAIN_DIR):
        entry_path = os.path.join(BRAIN_DIR, entry)
        if os.path.isdir(entry_path) and GUID_PATTERN.match(entry):
            transcript_path = os.path.join(entry_path, ".system_generated", "logs", "transcript.jsonl")
            if os.path.exists(transcript_path):
                # Target paths
                dest_jsonl = os.path.join(TARGET_LOGS_DIR, f"{entry}.jsonl")
                dest_md = os.path.join(TARGET_LOGS_DIR, f"{entry}.md")
                
                # Copy raw JSONL
                shutil.copy2(transcript_path, dest_jsonl)
                
                # Parse to Markdown
                parse_jsonl_to_markdown(transcript_path, dest_md, entry)
                count += 1
                
    print(f"Successfully synced {count} conversation logs to {TARGET_LOGS_DIR}")

if __name__ == "__main__":
    sync()
