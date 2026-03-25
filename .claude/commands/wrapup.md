You are wrapping up the current session. Save everything important, then compact.

Do the following steps in order:

1. **Save the conversation log**:
   - Run: `python3 /home/main/assistant/logs/save_conversation.py`

2. **Generate today's daily summary**:
   - Run: `GEMINI_API_KEY=sk-a5734bbecd6947c3840976e4bfa2fe14 python3 /home/main/assistant/logs/generate_summaries.py daily`

3. **Check if anything needs to be committed to git**:
   - Check `assistant/` for any uncommitted changes
   - If there are changes, commit them with a descriptive message

4. **Update memories if needed**:
   - If any important decisions were made this session that aren't already in memory, save them
   - Check if any existing memories need updating

5. **Send a Telegram wrap-up message** to Johannes with:
   - Quick summary of what was done this session
   - Any open items / things to pick up next time
   - Confirmation that logs are saved

6. **Compact the conversation**:
   - Run `/compact` to compress the conversation context
   - This frees up context window for the next session

After compaction, suggest running `/catchup` if starting fresh work.

Keep it concise. This is a handoff to the next session.
