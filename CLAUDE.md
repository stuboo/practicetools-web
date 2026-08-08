# Agent Instructions

## Project Structure

This is the **frontend** React/TypeScript application for PracticeTools.

The **backend** API (FastAPI/Python) is located at:
`/Users/jrs/Library/CloudStorage/Dropbox/ryan/Projects/@inprogress_proj/practicetoolsapi`

When working on features that require both frontend and backend changes, coordinate updates across both repositories.

## Issue Tracking

This project uses **GitHub Issues** (`stuboo/practicetools-web`) via the `gh` CLI.

## Quick Reference

```bash
gh issue list                                  # Open issues
gh issue view <number>                         # Issue details
gh issue create --title "..." --body "..."     # File work
gh issue close <number>                        # Complete work
```

The `.beads/` directory holds the retired bd (beads) tracker's history. It is
kept for reference only; do not file new work there.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

