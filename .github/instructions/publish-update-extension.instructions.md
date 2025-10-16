---
applyTo: '**'
---

# VS Code Extension Publishing Instructions

This document outlines the complete process for publishing updates to the CSS & JS Minifier extension on the Visual Studio Code Marketplace.

## Prerequisites

### 1. Install VSCE (Visual Studio Code Extension Manager)
```bash
npm install -g @vscode/vsce
```

### 2. Azure DevOps Personal Access Token (PAT)
You need a Personal Access Token from Azure DevOps with Marketplace permissions:

1. Go to https://dev.azure.com
2. Click on your profile → User Settings → Personal Access Tokens
3. Create new token with:
   - **Name**: VS Code Extension Publishing
   - **Organization**: All accessible organizations
   - **Scopes**: Custom defined → Marketplace (Manage)
   - **Expiration**: Set appropriate duration (recommend 1 year)
4. **IMPORTANT**: Copy the token immediately (only shown once)
5. Store securely (password manager recommended)

### 3. Login to VSCE
```bash
vsce login miguel-colmenares
# Enter your PAT token when prompted
```

## Publishing Process

### Step 1: Complete Development Work
1. ✅ Ensure all code changes are complete
2. ✅ All tests pass: `npm test`
3. ✅ Update version in `package.json` following Semantic Versioning:
   - **PATCH** (x.x.1): Bug fixes, small improvements
   - **MINOR** (x.1.x): New features, backward compatible
   - **MAJOR** (1.x.x): Breaking changes, architecture changes
4. ✅ Update `CHANGELOG.md` with release date and changes
5. ✅ Commit version changes: `git commit -m "chore: Release version X.X.X"`

### Step 2: Create Pull Request and Merge
1. Create PR from feature branch to `master`
2. Review and merge PR
3. Switch to master branch: `git checkout master`
4. Pull latest changes: `git pull origin master`

### Step 3: Create Git Tag
```bash
# Create annotated tag (replace X.X.X with actual version)
git tag -a vX.X.X -m "Release version X.X.X"

# Push tag to remote
git push origin vX.X.X

# Verify tag was created
git tag -l
```

### Step 4: Build for Production
The extension has automated build configuration:
```bash
# This runs automatically during publish, but you can test it:
npm run vscode:prepublish
```

This executes:
- `npm run package` → `webpack --mode production --devtool hidden-source-map`
- Creates optimized bundle in `dist/extension.js`
- Removes development dependencies
- Generates source maps for debugging

### Step 5: Publish to Marketplace

#### Option A: Direct Publish (Recommended)
```bash
vsce publish
```

#### Option B: Auto-increment Version While Publishing
```bash
# Automatically increment and publish (SemVer)
vsce publish patch   # 1.0.0 -> 1.0.1
vsce publish minor   # 1.0.0 -> 1.1.0
vsce publish major   # 1.0.0 -> 2.0.0
vsce publish 1.0.1   # Specific version
```

#### Option C: Package First, Then Publish
```bash
# Create .vsix package for testing/validation
vsce package

# Test the package locally (optional)
code --install-extension css-js-minifier-X.X.X.vsix

# Publish the package
vsce publish
```

### Step 6: Verify Publication
1. Check VS Code Marketplace: https://marketplace.visualstudio.com/items?itemName=miguel-colmenares.css-js-minifier
2. Verify version number updated
3. Test installation: `code --install-extension miguel-colmenares.css-js-minifier`
4. Update README.md badges if needed

## Project Configuration

### Current Extension Settings
- **Publisher**: `miguel-colmenares`
- **Extension ID**: `css-js-minifier`
- **Main Entry**: `./dist/extension.js` (webpack bundled)
- **Pre-publish Script**: `npm run package`

### Package.json Configuration
```json
{
  "publisher": "miguel-colmenares",
  "scripts": {
    "vscode:prepublish": "npm run package",
    "package": "webpack --mode production --devtool hidden-source-map"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors (403 Forbidden / 401 Unauthorized)
```bash
# Error: Failed to login
vsce logout
vsce login miguel-colmenares
# Re-enter PAT token
```

**Common causes:**
- PAT token created for specific organization instead of "All accessible organizations"
- Incorrect scope - must be "Marketplace (Manage)"
- Expired PAT token

#### 2. Version Conflicts
```bash
# Error: Version already exists
# Update version in package.json and commit
git add package.json
git commit -m "chore: Bump version to X.X.X"
```

#### 3. Build Failures
```bash
# Clean and rebuild
rm -rf dist/ out/ node_modules/
npm install
npm run vscode:prepublish
```

#### 4. Marketplace Delays
- Publication can take 5-10 minutes to appear
- Check https://marketplace.visualstudio.com/manage/publishers/miguel-colmenares

#### 5. Extension Name Conflicts
```bash
# Error: The extension 'name' already exists in the Marketplace
# Solution: Change 'name' or 'displayName' in package.json to be unique
```

#### 6. Too Many Keywords
```bash
# Error: You exceeded the number of allowed tags of 30
# Solution: Limit keywords in package.json to maximum 30
```

### Validation Commands
```bash
# Check extension validity
vsce package --no-dependencies

# Verify webpack bundle
npm run package
ls -la dist/

# Test extension locally
npm run compile-tests && npm test

# Check available vsce commands
vsce --help

# Test package installation locally
code --install-extension ./css-js-minifier-X.X.X.vsix
```

## Release Checklist

### Pre-Release
- [ ] All features implemented and tested
- [ ] Version number updated in package.json
- [ ] CHANGELOG.md updated with release date
- [ ] All tests passing (`npm test`)
- [ ] Code linted successfully (`npm run lint`)
- [ ] Documentation updated if needed

### Release
- [ ] PR created and merged to master
- [ ] Git tag created (vX.X.X)
- [ ] Tag pushed to remote
- [ ] VSCE authentication valid
- [ ] Extension published successfully
- [ ] Marketplace updated (5-10 min delay)

### Post-Release
- [ ] Installation tested from marketplace
- [ ] Version badges updated in README
- [ ] Release notes communicated if major version
- [ ] Issues closed if this release addresses them

## Security Notes

1. **PAT Token Security**:
   - Never commit PAT tokens to version control
   - Store in secure password manager
   - Regenerate if compromised
   - Set appropriate expiration dates

2. **Publishing Access**:
   - Only authorized maintainers should have publishing access
   - Use organization accounts for team projects
   - Monitor marketplace activity

## Emergency Procedures

### Unpublish Extension (Use with extreme caution)
```bash
vsce unpublish miguel-colmenares.css-js-minifier
```

### Unpublish Specific Version
```bash
vsce unpublish miguel-colmenares.css-js-minifier@X.X.X
```

**Note**: Unpublishing can break user installations. Only use for critical security issues.

## Resources

- [VS Code Extension Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [VSCE CLI Documentation](https://github.com/microsoft/vscode-vsce)
- [Azure DevOps PAT Management](https://dev.azure.com)
- [VS Code Marketplace Publisher Portal](https://marketplace.visualstudio.com/manage)
- [Semantic Versioning Specification](https://semver.org/)

---

**Last Updated**: October 16, 2025
**Next Review**: Before next major release