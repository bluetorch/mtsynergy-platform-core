# OneDev CaC Integration Research

_Created: 2026-02-03_
_Mode: RESEARCH_
_Status: Complete_

## Overview

**Objective:** Research how to implement OneDev CI/CD pipelines using Code-as-Code (CaC) methodologies for platform-core and integrate with the broader MTSynergy ecosystem.

**Key Focus Areas:**
1. OneDev buildspec syntax and capabilities
2. Code-as-Code best practices
3. platform-core CI/CD requirements
4. BFF → platform-core integration patterns
5. npm package publishing workflow
6. CDN deployment to CloudFlare R2

---

## Part 1: OneDev Architecture & Concepts

### OneDev Overview

**What is OneDev:**
- Self-hosted Git repository and CI/CD platform
- Written in Java, runs in k3s cluster
- Provides: version control, pull requests, CI/CD, package registry
- Alternative to GitHub + Jenkins/GitLab CI
- Used by MTSynergy for internal npm registry and Docker image hosting

**Key Features:**
- **Build Specification (`.onedev-buildspec.yml`)** - Code-as-Code CI/CD definition
- **Jobs & Steps** - Parallel and sequential task execution
- **Docker Executors** - Containerized build environments
- **Artifacts** - Build output management (npm packages, Docker images)
- **Secret Management** - Encrypted variables (npm tokens, API keys)
- **Webhooks & Triggers** - Event-based pipeline execution
- **Pull Request Automation** - Auto-merge, required status checks
- **npm Registry** - Built-in package hosting at `http://onedev.mtsynergy.internal/lib/npm/`
- **Docker Registry** - Built-in image hosting at `onedev.mtsynergy.internal`

### Code-as-Code (CaC) Philosophy

**Definition:** CI/CD pipeline configuration stored as code (YAML) in the repository, version-controlled alongside application code.

**Benefits:**
- ✅ Pipeline changes tracked in Git history
- ✅ Code review for CI/CD modifications
- ✅ Reproducibility - same pipeline definition everywhere
- ✅ Infrastructure as Code - automation declarative, not click-driven
- ✅ Disaster recovery - rebuild lost pipelines from Git
- ✅ Team knowledge - documentation embedded in code

**How OneDev Implements CaC:**
- Pipeline defined in `.onedev-buildspec.yml` (Git-tracked)
- OneDev reads spec from repository default branch
- Each commit can include pipeline changes
- Pipeline changes don't require admin approval (safer than UI-only)
- GUI available as convenience (generates YAML behind scenes)

---

## Part 2: OneDev Buildspec Syntax

### File Structure

**Location:** `.onedev-buildspec.yml` in repository root

**YAML Root Keys:**
```yaml
version: 9                    # OneDev API version (currently 9)
name: build                   # Pipeline name
triggers:                     # When pipeline runs
  - push                      # Event-based triggers
jobs:                         # CI/CD jobs
  - name: build               # Job identifier
    steps:                    # Sequential steps in job
      - !CheckoutStep         # Built-in steps
        name: checkout
jobs:
  - name: parallel-job        # Run in parallel with "build" job
    runCondition: ...         # Conditional execution
```

### Job Definition

**Anatomy of a Job:**

```yaml
jobs:
  - name: build                              # Job ID (unique per pipeline)
    image: node:20-alpine                    # Docker image for execution
    runCondition: always                     # When to run (always|neverRun|onFailure|onSuccess|custom)
    retryCondition: ...                      # When to retry failed step
    environment:                             # Environment variables
      - name: NODE_ENV
        value: production
      - name: NPM_TOKEN                      # Secret reference
        secret: npm_token
    caches:                                  # Caching strategy
      - /root/.npm
      - node_modules
    cpuRequirement: 2                        # CPU cores requested
    memoryRequirement: 4096                  # Memory in MB
    steps:                                   # Job steps (sequential)
      - !CommandStep
        name: build
        interpreter: !DefaultInterpreter
        commands:
          - npm ci
          - npm run build
    after:                                   # Post-job actions
      - !PublishArtifactStep
        name: publish artifacts
        artifacts: dist/*
```

### Step Types

**Built-in Steps:**

1. **CheckoutStep** - Clone repository
   ```yaml
   - !CheckoutStep
     name: checkout
     cloneDepth: 1                    # Shallow clone
   ```

2. **CommandStep** - Execute shell commands
   ```yaml
   - !CommandStep
     name: run tests
     interpreter: !DefaultInterpreter
     commands:
       - npm run test
       - npm run coverage
   ```

3. **PublishArtifactStep** - Save build outputs
   ```yaml
   - !PublishArtifactStep
     name: publish dist
     artifacts: dist/**,coverage/**
   ```

4. **PullRequestApprovalStep** - Wait for PR approval
   ```yaml
   - !PullRequestApprovalStep
     name: wait for approval
   ```

5. **SetBuildVersionStep** - Set version for build
   ```yaml
   - !SetBuildVersionStep
     name: set version
     buildVersion: "@.commit.shortHash"
   ```

6. **ExecuteStepTemplateStep** - Reuse step templates
   ```yaml
   - !ExecuteStepTemplateStep
     name: publish to npm
     templateName: npm-publish
   ```

### Trigger Configuration

**Push Trigger:**
```yaml
triggers:
  - push
    branches: main|develop        # Regex pattern for branch names
    paths: src/**,package.json     # Only trigger on certain paths
```

**Manual Trigger:**
```yaml
triggers:
  - manual
    prompt: Build variable         # Ask user for input
```

**Scheduled Trigger:**
```yaml
triggers:
  - schedule
    cronExpression: "0 2 * * *"    # 2 AM daily
```

**Webhook Trigger (From Other Services):**
```yaml
triggers:
  - webhook
    secret: webhook_secret         # Secret for validation
```

### Conditionals & Variables

**Run Conditions:**
```yaml
jobs:
  - name: deploy-prod
    runCondition: !CustomizeRunCondition
      condition: @.branch == "main" && @.event == "push"
```

**Variables:**
- `@.branch` - Current branch name
- `@.event` - Trigger event (push, pull_request_created, schedule, etc.)
- `@.commit.hash` - Full commit SHA
- `@.commit.shortHash` - First 7 chars of commit
- `@.commit.message` - Commit message
- `@.pull_request.id` - PR number
- `@.environment[VAR_NAME]` - Environment variable

---

## Part 3: platform-core CI/CD Requirements

### Current Build Process

**What Works (From Scaffolding Phase):**
- `npm ci` - Clean install dependencies
- `npm run type-check` - TypeScript compilation
- `npm run lint` - ESLint validation
- `npm run test` - Vitest + coverage
- `npm run build` - Vite library build
- `npm run format:check` - Prettier validation

**Manual Steps (Not Yet Automated):**
- Generate types from BFF OpenAPI spec
- Publish to OneDev npm registry
- Deploy to CloudFlare R2 CDN (import maps)

### Proposed CI/CD Pipeline

**Stage 1: Validate** (Always runs on every commit)
```yaml
jobs:
  - name: validate
    steps:
      - !CommandStep: npm ci
      - !CommandStep: npm run type-check
      - !CommandStep: npm run lint
      - !CommandStep: npm run format:check
```

**Stage 2: Test** (Parallel with validate)
```yaml
jobs:
  - name: test
    steps:
      - !CommandStep: npm ci
      - !CommandStep: npm run test:coverage
    after:
      - !PublishArtifactStep: coverage/**
```

**Stage 3: Build** (Runs if validate + test pass)
```yaml
jobs:
  - name: build
    runCondition: onSuccess
    dependsOn: [validate, test]
    steps:
      - !CommandStep: npm ci
      - !CommandStep: npm run build
    after:
      - !PublishArtifactStep: dist/**
```

**Stage 4: Generate Types** (Only on main branch, BFF webhook trigger)
```yaml
triggers:
  - webhook
    secret: !SecretVariable bff_webhook_secret
    payload: |
      {
        "event": "openapi_updated",
        "bff_spec_url": "https://platform-bff:8080/api/v1/openapi.json"
      }

jobs:
  - name: generate-types
    runCondition: !CustomizeRunCondition
      condition: @.event == "webhook" && @.branch == "main"
    steps:
      - !CommandStep
        name: generate types
        commands:
          - npm ci
          - npm run generate:types -- --input-spec $BFF_SPEC_URL
          - git config user.email "ci@mtsynergy.internal"
          - git config user.name "MTSynergy CI"
          - git add src/openapi/
          - git commit -m "chore: update types from BFF OpenAPI spec"
          - git push origin main
```

**Stage 5: Publish** (Only on version tags)
```yaml
triggers:
  - push
    branches: main
    tags: v.*                    # Semantic version tags (v1.0.0, v1.1.0, etc.)

jobs:
  - name: publish-npm
    runCondition: !CustomizeRunCondition
      condition: @.event == "push" && @.tag != null
    steps:
      - !CommandStep
        name: publish to npm registry
        environment:
          - name: NPM_TOKEN
            secret: onedev_npm_token
        commands:
          - npm ci
          - npm run build
          - npm publish --registry http://onedev.mtsynergy.internal/lib/npm/
      
      - !CommandStep
        name: publish to CDN
        environment:
          - name: CLOUDFLARE_TOKEN
            secret: cloudflare_token
        commands:
          - npm install -g wrangler
          - wrangler r2 cp dist/* r2://mtsynergy-cdn/@mtsynergy/core@${CI_COMMIT_TAG}/ --recursive
          - wrangler r2 cp dist/index.mjs r2://mtsynergy-cdn/@mtsynergy/core@latest/index.mjs
```

---

## Part 4: BFF → platform-core Type Generation Integration

### Webhook Flow

**Initiator:** platform-bff CI/CD pipeline

**Steps:**
1. BFF builds → generates `build/openapi.json`
2. BFF CI/CD triggers OneDev webhook to platform-core
3. Webhook includes BFF OpenAPI spec URL (or inline content)
4. platform-core webhook job runs `npm run generate:types`
5. Types generated to `src/openapi/index.ts`
6. If types changed, create commit + push
7. If types invalid, fail build and notify BFF team

**BFF Buildspec (Example):**
```yaml
# In platform-bff/.onedev-buildspec.yml
jobs:
  - name: build
    steps:
      - !CommandStep
        name: build BFF
        commands:
          - ./gradlew build
      
      - !CommandStep
        name: trigger platform-core type generation
        environment:
          - name: ONEDEV_TOKEN
            secret: onedev_api_token
        commands:
          - |
            curl -X POST \
              -H "Authorization: Bearer $ONEDEV_TOKEN" \
              -H "Content-Type: application/json" \
              http://onedev.mtsynergy.internal/api/v1/projects/platform-core/webhook \
              -d '{
                "event": "openapi_updated",
                "spec_url": "http://platform-bff:8080/api/v1/openapi.json"
              }'
```

**platform-core Webhook Handler:**
```yaml
# In platform-core/.onedev-buildspec.yml
triggers:
  - webhook
    secret: !SecretVariable bff_webhook_secret

jobs:
  - name: generate-types-from-bff
    image: node:20-alpine
    runCondition: !CustomizeRunCondition
      condition: @.event == "webhook"
    steps:
      - !CheckoutStep
        name: checkout
      
      - !CommandStep
        name: install dependencies
        commands:
          - npm ci
      
      - !CommandStep
        name: fetch BFF OpenAPI spec
        commands:
          - |
            curl -o /tmp/bff-openapi.json $BFF_SPEC_URL
            # Validate JSON
            jq . /tmp/bff-openapi.json > /dev/null
      
      - !CommandStep
        name: generate types
        commands:
          - npm run generate:types -- --input-spec /tmp/bff-openapi.json
      
      - !CommandStep
        name: validate generated types
        commands:
          - npm run lint
          - npm run type-check
          - npm run test
      
      - !CommandStep
        name: commit and push (if changed)
        commands:
          - |
            if [[ -n $(git status -s src/openapi/) ]]; then
              git config user.email "ci@mtsynergy.internal"
              git config user.name "MTSynergy CI"
              git add src/openapi/
              git commit -m "chore: update types from BFF OpenAPI spec

              Generated by automated CI/CD pipeline on $(date -u +%Y-%m-%dT%H:%M:%SZ)
              BFF OpenAPI Spec URL: $BFF_SPEC_URL"
              git push origin main
            else
              echo "No type changes detected"
            fi
```

### Alternative: Direct File Transfer

**Advantage:** No network call to fetch spec  
**Disadvantage:** Requires platform-bff to have write access to platform-core repo

```yaml
# In platform-bff, after building:
- !CommandStep
  name: update platform-core types
  commands:
    - |
      git clone http://onedev.mtsynergy.internal/platform-core
      cd platform-core
      cp ../build/openapi.json openapi/bff-spec-latest.json
      openapi-generator-cli generate -c openapi-generator.config.yml
      
      # Only commit if types changed
      if [[ -n $(git status -s src/openapi/) ]]; then
        git config user.email "ci@mtsynergy.internal"
        git config user.name "MTSynergy CI"
        git add src/openapi/
        git commit -m "chore: update types from BFF OpenAPI spec"
        git push origin main
      fi
```

---

## Part 5: Secret Management in OneDev

### Storing Secrets

**In OneDev UI:**
1. Project Settings → Variables
2. Add Variable:
   - Name: `npm_token`
   - Type: `Secret`
   - Value: (paste npm token)

**Usage in Buildspec:**
```yaml
environment:
  - name: NPM_TOKEN
    secret: npm_token        # References "npm_token" secret
```

**Common Secrets for platform-core:**

| Secret Name | Value | Used For |
|------------|-------|----------|
| `onedev_npm_token` | OneDev npm registry auth token | npm publish |
| `cloudflare_token` | Cloudflare API token | R2 CDN upload |
| `bff_webhook_secret` | Webhook validation secret | BFF → platform-core validation |
| `github_token` | GitHub API token (if needed) | GitHub releases (future) |

### Secret Rotation

**Recommendation:** Set 90-day rotation for sensitive tokens (npm, Cloudflare)

**Process:**
1. Generate new token in respective service
2. Update secret value in OneDev UI
3. Old builds still work (tied to old secret)
4. Document rotation date in team wiki

---

## Part 6: npm Registry Publishing

### Registry Configuration

**OneDev Internal npm Registry:**
- **URL:** `http://onedev.mtsynergy.internal/lib/npm/`
- **Access:** Internal only (k3s cluster)
- **Package Scope:** `@mtsynergy/*`

### Publishing Strategy

**Option 1: Manual Tagging (Recommended for MVP)**
- Developer creates Git tag: `git tag v1.0.0`
- Developer pushes tag: `git push origin v1.0.0`
- OneDev pipeline detects tag → publishes automatically
- Semantic versioning (MAJOR.MINOR.PATCH) enforced

**Option 2: Automated Versioning (Future)**
- Use `auto` library or `semantic-release`
- Analyze commits (feat:, fix:, BREAKING:)
- Auto-bump version number
- Auto-publish on main branch

### .npmrc Configuration

**In repository root:**
```
@mtsynergy:registry=http://onedev.mtsynergy.internal/lib/npm/
//onedev.mtsynergy.internal/lib/npm/:_authToken=${NPM_TOKEN}
```

**In CI/CD job:**
```yaml
environment:
  - name: NPM_TOKEN
    secret: onedev_npm_token

steps:
  - !CommandStep
    name: publish
    commands:
      - npm ci
      - npm run build
      - npm publish
```

---

## Part 7: CloudFlare R2 CDN Deployment

### R2 Bucket Setup

**Bucket Name:** `mtsynergy-cdn`  
**Region:** US (geographically closest)  
**Public Access:** Yes (for browsers via import maps)

### Wrangler Configuration

**File: `wrangler.toml` (in platform-core):**
```toml
name = "platform-core"
type = "javascript"
account_id = "..."  # From Cloudflare dashboard
workers_dev = false

[[env.production]]
vars = { ENVIRONMENT = "production" }
route = "cdn.mtsynergy.com"

[[r2_buckets]]
binding = "CDN"
bucket_name = "mtsynergy-cdn"
jurisdiction = "eu"
```

### R2 Deployment Step

```yaml
- !CommandStep
  name: deploy to R2
  environment:
    - name: CLOUDFLARE_API_TOKEN
      secret: cloudflare_token
    - name: CLOUDFLARE_ACCOUNT_ID
      secret: cloudflare_account_id
  commands:
    - npm install -g @cloudflare/wrangler
    - wrangler r2 cp dist/ r2://mtsynergy-cdn/@mtsynergy/core@${CI_COMMIT_TAG}/ --recursive
    - wrangler r2 cp dist/index.mjs r2://mtsynergy-cdn/@mtsynergy/core@latest/index.mjs
```

**URL Format:**
- **Specific Version:** `https://r2.cdn.mtsynergy.com/@mtsynergy/core@1.0.0/dist/index.mjs`
- **Latest:** `https://r2.cdn.mtsynergy.com/@mtsynergy/core@latest/dist/index.mjs`

### Import Map (In Shell/MFE HTML)

```html
<script type="importmap">
{
  "imports": {
    "@mtsynergy/core": "https://r2.cdn.mtsynergy.com/@mtsynergy/core@1.0.0/dist/index.mjs",
    "@mtsynergy/core/types": "https://r2.cdn.mtsynergy.com/@mtsynergy/core@1.0.0/dist/types/index.mjs"
  }
}
</script>
```

---

## Part 8: Full Platform-Core Buildspec Example

### Complete `.onedev-buildspec.yml`

```yaml
version: 9
name: ci-cd

triggers:
  - push
    branches: main|develop
    paths: src/**,package.json,vite.config.ts,tsconfig.json,.onedev-buildspec.yml

  - push
    branches: main
    tags: v.*

  - webhook
    secret: !SecretVariable bff_webhook_secret

jobs:
  - name: validate
    image: node:20-alpine
    caches:
      - /root/.npm
      - node_modules
    steps:
      - !CheckoutStep
        name: checkout
      
      - !CommandStep
        name: install dependencies
        commands:
          - npm ci
      
      - !CommandStep
        name: type check
        commands:
          - npm run type-check
      
      - !CommandStep
        name: lint
        commands:
          - npm run lint
      
      - !CommandStep
        name: format check
        commands:
          - npm run format:check

  - name: test
    image: node:20-alpine
    caches:
      - /root/.npm
      - node_modules
    steps:
      - !CheckoutStep
        name: checkout
      
      - !CommandStep
        name: install dependencies
        commands:
          - npm ci
      
      - !CommandStep
        name: test with coverage
        commands:
          - npm run test:coverage
    
    after:
      - !PublishArtifactStep
        name: publish coverage
        artifacts: coverage/**

  - name: build
    image: node:20-alpine
    runCondition: onSuccess
    caches:
      - /root/.npm
      - node_modules
    steps:
      - !CheckoutStep
        name: checkout
      
      - !CommandStep
        name: install dependencies
        commands:
          - npm ci
      
      - !CommandStep
        name: build library
        commands:
          - npm run build
    
    after:
      - !PublishArtifactStep
        name: publish dist
        artifacts: dist/**

  - name: generate-types-from-bff
    image: node:20-alpine
    runCondition: !CustomizeRunCondition
      condition: @.event == "webhook" && @.branch == "main"
    caches:
      - /root/.npm
      - node_modules
    steps:
      - !CheckoutStep
        name: checkout
      
      - !CommandStep
        name: install dependencies
        commands:
          - npm ci
      
      - !CommandStep
        name: fetch BFF OpenAPI spec
        commands:
          - |
            if [ -z "$BFF_SPEC_URL" ]; then
              echo "Error: BFF_SPEC_URL not provided in webhook payload"
              exit 1
            fi
            curl -f -o /tmp/bff-openapi.json "$BFF_SPEC_URL"
            jq . /tmp/bff-openapi.json > /dev/null
      
      - !CommandStep
        name: generate types
        commands:
          - npm run generate:types -- --input-spec /tmp/bff-openapi.json
      
      - !CommandStep
        name: validate
        commands:
          - npm run lint
          - npm run type-check
          - npm run test
      
      - !CommandStep
        name: commit and push
        environment:
          - name: GITHUB_TOKEN
            secret: github_token
        commands:
          - |
            if [[ -n $(git status -s src/openapi/) ]]; then
              git config user.email "ci@mtsynergy.internal"
              git config user.name "MTSynergy CI"
              git add src/openapi/
              git commit -m "chore: update types from BFF OpenAPI spec

              Generated by automated CI/CD pipeline.
              Event: OpenAPI spec updated
              Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
              git push origin main
            else
              echo "No type changes detected"
            fi

  - name: publish-npm
    image: node:20-alpine
    runCondition: !CustomizeRunCondition
      condition: @.event == "push" && @.tag != null && @.branch == "main"
    caches:
      - /root/.npm
      - node_modules
    steps:
      - !CheckoutStep
        name: checkout
      
      - !CommandStep
        name: install dependencies
        commands:
          - npm ci
      
      - !CommandStep
        name: build library
        commands:
          - npm run build
      
      - !CommandStep
        name: publish to npm registry
        environment:
          - name: NPM_TOKEN
            secret: onedev_npm_token
        commands:
          - npm publish --registry http://onedev.mtsynergy.internal/lib/npm/

  - name: publish-cdn
    image: node:20-alpine
    runCondition: !CustomizeRunCondition
      condition: @.event == "push" && @.tag != null && @.branch == "main"
    caches:
      - /root/.npm
      - node_modules
    steps:
      - !CheckoutStep
        name: checkout
      
      - !CommandStep
        name: install dependencies
        commands:
          - npm ci
      
      - !CommandStep
        name: build library
        commands:
          - npm run build
      
      - !CommandStep
        name: install wrangler
        commands:
          - npm install -g @cloudflare/wrangler
      
      - !CommandStep
        name: deploy to R2 CDN
        environment:
          - name: CLOUDFLARE_API_TOKEN
            secret: cloudflare_token
        commands:
          - |
            TAG=${CI_COMMIT_TAG#v}  # Remove 'v' prefix for semver
            wrangler r2 cp dist/ r2://mtsynergy-cdn/@mtsynergy/core@${TAG}/ --recursive
            wrangler r2 cp dist/index.mjs r2://mtsynergy-cdn/@mtsynergy/core@latest/index.mjs
```

---

## Part 9: Integration with Broader Ecosystem

### BFF → platform-core → Consumers

**Flow:**
```
platform-bff (builds)
  ↓ (generates OpenAPI spec)
  ↓ (webhook to platform-core)
platform-core (generates types)
  ↓ (publishes @mtsynergy/core@x.y.z)
  ↓ (to OneDev npm registry + R2 CDN)
↙  ↓  ↘
platform-shell     platform-mfe-*     platform-mobile
(imports via)     (imports via)       (imports via)
(import maps)     (import maps)       (npm ci)
```

### Dependency Management

**npm Lock Files:**
- `platform-shell` → `package-lock.json` pins @mtsynergy/core version
- `platform-mfe-publishing` → `package-lock.json` pins @mtsynergy/core version
- `platform-mobile` → `package-lock.json` pins @mtsynergy/core version

**Browser Consumers:**
- platform-shell/.vscode/import-maps.json specifies @mtsynergy/core URL
- All MFEs use same import map URL for consistency
- Version bump requires import-map update + deployment

**Example Upgrade Path:**
1. platform-core team bumps version → v1.1.0
2. CI/CD publishes to OneDev npm registry
3. CI/CD uploads to R2 CDN at `@mtsynergy/core@1.1.0/`
4. platform-shell team updates import map to v1.1.0
5. platform-shell redeploys
6. All MFEs (via import map) automatically get v1.1.0

### Rollback Strategy

**Immutable Versioning:**
- Each version lives forever at its URL: `.../core@1.0.0/...`
- Latest tag points to current version: `.../core@latest/...`
- Rollback: Update import map to point to previous version URL
- No rebuilds needed - just update HTML

**Example:**
```html
<!-- Current (v1.1.0) -->
<script type="importmap">
{
  "imports": {
    "@mtsynergy/core": "https://r2.cdn.mtsynergy.com/@mtsynergy/core@1.1.0/dist/index.mjs"
  }
}
</script>

<!-- Rollback to v1.0.0 (if v1.1.0 has bugs) -->
<script type="importmap">
{
  "imports": {
    "@mtsynergy/core": "https://r2.cdn.mtsynergy.com/@mtsynergy/core@1.0.0/dist/index.mjs"
  }
}
</script>
```

---

## Part 10: Observability & Monitoring

### Build Pipeline Metrics

**Metrics to Track:**
- Build duration per job
- Success/failure rate
- Test coverage trends
- Package size (dist/)
- Type generation success rate
- npm publish success/failure
- CDN deployment success/failure

**OneDev Dashboard:**
- Job execution history
- Failed build breakdown
- Build trends over time

### Error Handling

**Job Failure Notifications:**
```yaml
# Post-failure actions (future enhancement)
after:
  - !NotifyStep
    notify_on: !CustomizeNotifyCondition
      condition: @.build.status == "failure"
    emails: platform-core-team@mtsynergy.com
    slack: #platform-core-builds
```

### Artifact Management

**Retention Policy:**
- Keep all published tags (forever)
- Keep last 20 develop branch builds
- Keep last 100 main branch builds
- Auto-delete older builds after 90 days

---

## Part 11: Security Considerations

### Secret Management Best Practices

1. **Rotate Secrets Regularly**
   - npm tokens: 90-day rotation
   - API tokens: 90-day rotation
   - Webhook secrets: 180-day rotation

2. **Least Privilege**
   - npm token: publish rights only (not delete)
   - Cloudflare token: R2 write-only, specific bucket
   - GitHub token: public repo access only (if added)

3. **Audit Trail**
   - Log all secret usage
   - Monitor for unexpected publishes
   - Set up alerts for unauthorized API calls

### Code Review Gates

```yaml
# Require approval for main branch changes
jobs:
  - name: await-approval
    runCondition: !CustomizeRunCondition
      condition: @.pull_request.id != null
    steps:
      - !PullRequestApprovalStep
        name: request approval
        requiredApprovals: 1
```

### Docker Image Security

```yaml
# Use specific versions, not 'latest'
image: node:20.11.0-alpine    # Not 'node:20-alpine'
```

---

## Part 12: Development Workflow Integration

### Local Development

**Developers should:**
1. Write code locally
2. Run `npm run build` and `npm run test` before pushing
3. Create feature branches
4. Push to OneDev (triggers CI/CD)
5. Create pull request
6. CI/CD validates automatically
7. After review + approval, merge to main

### Pre-Commit Hooks (Optional)

**Install locally to catch errors early:**
```bash
npm install -D husky lint-staged

npx husky install
npx husky add .husky/pre-commit "npm run lint:fix && npm run format"
```

**Benefits:**
- Catch lint/format errors before pushing
- Faster CI/CD (developers fix locally first)
- Fewer CI/CD reruns

### Branch Strategy

**Recommended:**
- `main` - Production releases (tagged with v*)
- `develop` - Integration branch (pre-release testing)
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

**Automatic CI/CD Triggers:**
- `main`: validate, test, build, publish
- `develop`: validate, test, build
- `feature/*`: validate, test, build

---

## Part 13: Rollout Plan

### Phase 1: Setup (Week 1)
- [ ] Create `.onedev-buildspec.yml` with basic pipeline
- [ ] Test locally: `npm ci && npm run build`
- [ ] Push to OneDev and verify pipeline runs
- [ ] Configure secrets (npm_token, cloudflare_token)

### Phase 2: Publishing (Week 2)
- [ ] Add publish-npm job (triggers on tags)
- [ ] Test with tag: `git tag v0.1.0 && git push origin v0.1.0`
- [ ] Verify package appears in OneDev registry
- [ ] Add publish-cdn job (R2 deployment)

### Phase 3: Type Generation (Week 3)
- [ ] Add webhook trigger job
- [ ] Configure BFF to send webhook
- [ ] Test end-to-end: BFF change → types generated → published
- [ ] Document for BFF team

### Phase 4: Monitoring & Hardening (Week 4)
- [ ] Set up OneDev dashboard
- [ ] Document troubleshooting guide
- [ ] Add pre-commit hooks for developer experience
- [ ] Training session for team

---

## Questions & Decisions

### Q1: Manual tags or automated versioning?
**A:** Start with manual tags (simpler, more control). Switch to `semantic-release` if volume increases.

### Q2: When to publish to npm vs. CDN?
**A:** Always publish both on every tag. npm for Node.js/React Native, CDN for browser (import maps).

### Q3: How to handle BFF spec fetch failures?
**A:** Fail job loudly, send notification to BFF team. Don't silently skip.

### Q4: Should develop branch also publish?
**A:** No - only publish tagged releases on main branch.

### Q5: How to handle type generation conflicts?
**A:** CI job validates generated types before committing. If validation fails, notify BFF team to fix spec.

---

## Success Criteria

✅ **OneDev CaC Integration Complete When:**
1. `.onedev-buildspec.yml` checked into platform-core repo
2. All 6 jobs working: validate, test, build, generate-types, publish-npm, publish-cdn
3. Secrets configured in OneDev UI
4. Test publish with real tag (v0.1.0)
5. Package appears in OneDev registry
6. Files appear on R2 CDN
7. BFF webhook integration tested
8. Documentation written for team

---

## References

- OneDev Official Docs: https://docs.onedev.io/
- Buildspec YAML Reference: https://docs.onedev.io/reference/buildspec
- Code-as-Code Article: https://martinfowler.com/articles/infrastructure-as-code.html
- Semantic Versioning: https://semver.org/
- npm Registry Documentation: https://docs.npmjs.com/

---

_End of OneDev CaC Integration Research_
