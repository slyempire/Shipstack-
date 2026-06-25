# Contributing to Shipstack

## Branch flow
feature/* | fix/* | chore/* -> develop -> staging -> main (+ git tag)
hotfix/* -> main AND back-merge to develop immediately

## Start new work
`
git checkout develop && git pull origin develop
git checkout -b feature/SHIP-101-description
`

## Commit format (Conventional Commits)
eat(scope): description | ix(scope): description | chore(scope): description

Valid types: feat, fix, perf, refactor, test, chore, docs, style

## Release
`
git checkout main && git pull origin main
git tag -a v1.2.0 -m Release-v1.2.0
git push origin v1.2.0
# This triggers the production GitHub Actions workflow
`

## Hotfix
`
git checkout main
git checkout -b hotfix/PROD-202-description
# fix, commit, PR to main (1 approval, fast-track)
# after merge to main:
git checkout develop && git merge --no-ff hotfix/PROD-202-description && git push origin develop
`