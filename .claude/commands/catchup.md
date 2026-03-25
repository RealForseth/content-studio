You are starting a new session. Get caught up on what's been happening by reading the most recent conversation summaries and system status.

Do the following steps:

1. **Read today's daily summary** (if it exists):
   - `assistant/logs/summaries/daily/{today's date YYYY-MM-DD}.md`
   - If it doesn't exist, read yesterday's

2. **Read the most recent weekly summary** (if it exists):
   - Check `assistant/logs/summaries/weekly/` for the latest file

3. **Check system status**:
   - Run `crontab -l` to verify cron jobs are running
   - Run `tmux ls` to check active sessions
   - Check if any background processes are running

4. **Check for new Slack debriefs**:
   - Look at the latest file in `assistant/profile/dev-sessions/`

5. **Send a Telegram summary** to Johannes with:
   - What happened in the last session (from the summary)
   - Current system status (what's running, what's not)
   - Any issues or things that need attention

Keep it concise. Don't read full conversation logs — summaries only.
