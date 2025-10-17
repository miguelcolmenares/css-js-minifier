# Issue Templates

This directory contains GitHub Issue Templates for the CSS & JS Minifier extension. These templates help users report issues, request features, and ask questions in a structured way.

## Available Templates

### 🐛 Bug Report (`bug_report.yml`)
Use this template to report bugs or unexpected behavior in the extension.

**Key sections:**
- Bug description
- Steps to reproduce
- Expected vs. actual behavior
- VS Code version and extension version
- Operating system information
- File type affected
- VS Code display language
- Extension configuration
- Error messages and logs
- Sample code that reproduces the issue

**Labels:** `bug`, `needs-triage`

### ✨ Feature Request (`feature_request.yml`)
Use this template to suggest new features or enhancements.

**Key sections:**
- Feature description
- Problem statement (what problem does this solve?)
- Proposed solution
- Alternatives considered
- Feature category
- Priority level
- Use cases and examples
- Mockups or examples from other tools

**Labels:** `enhancement`, `needs-triage`

### 📚 Documentation Issue (`documentation.yml`)
Use this template to report documentation issues or suggest improvements.

**Key sections:**
- Documentation type (README, CHANGELOG, API docs, etc.)
- Issue type (missing info, incorrect info, typo, etc.)
- Location in documentation
- Current content
- Suggested improvements
- Language affected (for internationalization)

**Labels:** `documentation`, `needs-triage`

### ❓ Question / Support (`question.yml`)
Use this template for questions about using the extension.

**Key sections:**
- Question description
- Question category
- Context and what you've tried
- Current configuration
- Code examples

**Labels:** `question`, `needs-triage`

## Configuration (`config.yml`)

The `config.yml` file configures the issue template chooser and provides helpful links:

- **Blank issues:** Enabled (users can create issues without templates)
- **Contact links:**
  - 📚 Documentation
  - 💬 Discussions
  - 🐛 Report Security Vulnerability

## Template Features

All templates include:

### Required Fields
- Clear description of the issue/request
- Relevant context information
- Pre-submission checklist

### Optional but Helpful Fields
- Configuration settings
- Code samples
- Error messages
- Screenshots/mockups
- Additional context

### Dropdowns for Common Information
- VS Code version
- Operating system
- File type (CSS/JS)
- Language (for internationalization issues)
- Priority levels
- Categories

### Validation
- Required fields are marked and enforced by GitHub
- Pre-submission checklists help ensure quality
- Placeholders guide users on what to include

## How Users Access Templates

When creating a new issue, users will see a template chooser with:

1. **🐛 Bug Report** - Report a bug or unexpected behavior
2. **✨ Feature Request** - Suggest a new feature or enhancement
3. **📚 Documentation Issue** - Report documentation issues
4. **❓ Question / Support** - Ask a question
5. **Open a blank issue** - For issues that don't fit templates

## Guidelines for Maintainers

### Processing Issues with Templates

1. **Auto-labeled:** All templates add `needs-triage` label
2. **Auto-assigned:** Bug reports and feature requests auto-assign to `miguelcolmenares`
3. **Title prefixes:** Templates add prefixes like `[Bug]:`, `[Feature]:`, `[Docs]:`, `[Question]:`

### Triage Process

1. Review the issue for completeness
2. Add additional labels as needed:
   - `priority:high`, `priority:medium`, `priority:low`
   - `good first issue` (for newcomers)
   - `help wanted` (community contributions welcome)
   - Specific component labels: `i18n`, `api`, `configuration`, etc.
3. Remove `needs-triage` label after initial review
4. Ask for clarification if needed
5. Close duplicates with reference to original issue

### Updating Templates

When updating templates:

1. Test YAML syntax:
   ```bash
   python3 -c "import yaml; yaml.safe_load(open('.github/ISSUE_TEMPLATE/bug_report.yml'))"
   ```

2. Verify all required fields make sense
3. Check that dropdowns have appropriate options
4. Ensure placeholders are helpful and clear
5. Update this README if adding new templates

## Benefits of These Templates

1. **Consistency:** All issues follow a structured format
2. **Completeness:** Required fields ensure necessary information is provided
3. **Efficiency:** Maintainers get all info needed upfront
4. **User-friendly:** Clear guidance on what to include
5. **Internationalization-aware:** Includes language-specific fields
6. **Context-rich:** Captures OS, VS Code version, extension config, etc.

## Template Schema Reference

GitHub Issue Form Schema documentation:
- [About issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
- [Form schema syntax](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema)

## Internationalization Considerations

The extension supports 7 languages:
- 🇺🇸 English (en)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇧🇷 Portuguese (pt-br)
- 🇯🇵 Japanese (ja)
- 🇨🇳 Chinese Simplified (zh-cn)

Bug report template includes a "VS Code Display Language" field to help identify language-specific issues in translations.

---

**Last Updated:** October 17, 2025
**Template Version:** 1.0
