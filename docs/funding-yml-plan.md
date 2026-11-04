<!-- agents-toolkit:planning-doc issue=242 -->
# Plan: .github/FUNDING.yml (#242)

Problem: the repo has no FUNDING.yml, so GitHub hides the Sponsor button although `sponsor.url` is set in package.json.

Change: add `.github/FUNDING.yml` with `github: miguelcolmenares` only. No README, CHANGELOG or extension change (`.github/**` is in `.vscodeignore`).

Phases: 1. verify listing, manifest URL and file format. 2. add the file. 3. run format:check, lint:md, lint, vsce ls. 4. core-review quick, push. After merge: check the button on the repo page.
