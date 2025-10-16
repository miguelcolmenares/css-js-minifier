---
applyTo: '**'
---

# GitHub CLI Usage Instructions

This document provides comprehensive guidelines for using GitHub CLI (gh) effectively in development workflows, based on actual usage patterns in this project.

## Critical Configuration

### Pager Configuration
**ALWAYS** use `PAGER=cat` or pipe to `| cat` with GitHub CLI commands to prevent terminal hanging:

```bash
# ✅ Correct usage
PAGER=cat gh pr list
gh pr list | cat
PAGER=cat gh run view <id>
gh workflow list | cat

# ❌ Avoid - may cause terminal to hang
gh pr list
gh run view <id>
gh workflow list
```

**Why this is necessary:**
- GitHub CLI uses a pager by default for long output
- In automated environments or terminal tools, this can cause commands to hang waiting for user interaction
- Using `PAGER=cat` or piping to `| cat` ensures complete output is displayed immediately

## Pull Request Management

### Creating Pull Requests
```bash
# Create PR with comprehensive description
gh pr create --title "feat: Your feature title" --body "
## Purpose
Brief description of changes

## Key Changes
- Change 1
- Change 2
- Change 3

## Testing
- Test results or verification steps
"

# Create PR with auto-fill from commits
gh pr create --fill
```

### Viewing Pull Request Information
```bash
# List all pull requests
PAGER=cat gh pr list
gh pr list | cat

# View specific PR details
PAGER=cat gh pr view 34
gh pr view 34 | cat

# View PR with specific format options
PAGER=cat gh pr view 34 --json title,body,state,mergeable
gh pr view 34 --json reviews,comments | cat

# Check PR status and checks
PAGER=cat gh pr status
gh pr checks 34 | cat
```

### Pull Request Comments and Reviews
```bash
# View PR comments
PAGER=cat gh pr view 34 --comments
gh pr view 34 --comments | cat

# Add comment to PR
gh pr comment 34 --body "Your comment text"

# Get detailed review information
PAGER=cat gh api repos/owner/repo/pulls/34/reviews
gh api repos/owner/repo/pulls/34/comments | cat
```

## Issues Management

### Viewing Issues
```bash
# List all issues
PAGER=cat gh issue list
gh issue list | cat

# View specific issue
PAGER=cat gh issue view 1
gh issue view 1 | cat

# List issues with filters
PAGER=cat gh issue list --state open --label bug
gh issue list --assignee @me | cat
```

### Creating and Managing Issues
```bash
# Create new issue
gh issue create --title "Bug: Description" --body "Detailed description"

# Close issue
gh issue close 1

# Reopen issue
gh issue reopen 1
```

## Workflow and Actions Management

### Viewing Workflows
```bash
# List all workflows
PAGER=cat gh workflow list
gh workflow list | cat

# View workflow runs
PAGER=cat gh run list
gh run list | cat

# View specific workflow run
PAGER=cat gh run view <run-id>
gh run view <run-id> | cat

# View workflow run logs
PAGER=cat gh run view <run-id> --log
gh run view <run-id> --log | cat
```

### Triggering Workflows
```bash
# Trigger workflow manually (if workflow_dispatch is enabled)
gh workflow run workflow-name.yml

# Re-run failed workflow
gh run rerun <run-id>
```

## Repository Information

### Repository Status
```bash
# View repository information
PAGER=cat gh repo view
gh repo view | cat

# View repository statistics
PAGER=cat gh repo view --json stargazerCount,forkCount,openIssues
gh api repos/owner/repo | cat
```

### Branch Management
```bash
# List branches
PAGER=cat gh api repos/owner/repo/branches
gh api repos/owner/repo/branches | cat

# View branch protection rules
PAGER=cat gh api repos/owner/repo/branches/master/protection
gh api repos/owner/repo/branches/master/protection | cat
```

## API Usage Patterns

### Direct API Calls
```bash
# Get specific API endpoints
PAGER=cat gh api repos/owner/repo/pulls/34/reviews
gh api repos/owner/repo/pulls/comments | cat

# Use jq for JSON processing
PAGER=cat gh api repos/owner/repo/pulls/34 | jq '.title'
gh api repos/owner/repo/issues | jq '.[] | .title' | cat

# Get paginated results
PAGER=cat gh api repos/owner/repo/issues --paginate
gh api repos/owner/repo/pulls --paginate | cat
```

### Authentication and Configuration
```bash
# Check authentication status
gh auth status

# Login to GitHub
gh auth login

# Set default repository
gh repo set-default owner/repo
```

## Error Handling and Debugging

### Common Issues and Solutions

**Terminal Hanging:**
```bash
# Problem: Command appears to hang
gh pr list

# Solution: Use PAGER=cat or pipe to cat
PAGER=cat gh pr list
gh pr list | cat
```

**Permission Errors:**
```bash
# Check current authentication
gh auth status

# Re-authenticate if needed
gh auth logout
gh auth login
```

**API Rate Limiting:**
```bash
# Check rate limit status
PAGER=cat gh api rate_limit
gh api rate_limit | cat
```

## Best Practices

### For Development Workflows
1. **Always use pager control** in scripts and automated environments
2. **Pipe complex JSON output** through `jq` for parsing
3. **Use specific PR/issue numbers** instead of relative references
4. **Check authentication status** before running sensitive commands

### For CI/CD Integration
```bash
# Example CI script with proper pager handling
#!/bin/bash
set -e

# Check PR status
PR_STATUS=$(PAGER=cat gh pr view $PR_NUMBER --json state | jq -r '.state')

# Get workflow status
WORKFLOW_STATUS=$(PAGER=cat gh run list --limit 1 --json status | jq -r '.[0].status')

# Comment on PR with results
gh pr comment $PR_NUMBER --body "Build status: $WORKFLOW_STATUS"
```

### For Code Review Process
```bash
# Review workflow
PAGER=cat gh pr list --assignee @me
gh pr view 34 --comments | cat
gh pr checks 34 | cat
gh pr comment 34 --body "LGTM! ✅"
```

## Common Command Patterns

### Investigation and Debugging
```bash
# Full PR investigation
PAGER=cat gh pr view 34
PAGER=cat gh pr view 34 --comments
PAGER=cat gh pr checks 34
gh api repos/owner/repo/pulls/34/reviews | cat

# Workflow debugging
PAGER=cat gh run list --limit 5
PAGER=cat gh run view <run-id> --log
gh workflow list | cat

# Issue tracking
PAGER=cat gh issue list --state open
PAGER=cat gh issue view 1
gh issue list --label bug | cat
```

### Repository Management
```bash
# Repository overview
PAGER=cat gh repo view
PAGER=cat gh pr list
PAGER=cat gh issue list
gh workflow list | cat

# Branch and release management
gh api repos/owner/repo/branches | cat
gh release list | cat
gh tag list | cat
```

## Security Considerations

### Token Management
- Never expose GitHub tokens in logs or scripts
- Use environment variables for sensitive operations
- Regularly rotate authentication tokens
- Use minimal required scopes for tokens

### Safe API Usage
```bash
# Read-only operations are safe
PAGER=cat gh pr list
gh issue list | cat

# Write operations should be confirmed
gh pr comment 34 --body "Confirmed action"
gh issue close 1  # Only when intentional
```

---

**Last Updated**: October 16, 2025
**Next Review**: When GitHub CLI is updated or new patterns emerge