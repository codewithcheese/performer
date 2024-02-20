## Repo Setup

To develop locally, fork the Performer repository and clone it in your local machine. The Performer repo is a monorepo using pnpm workspaces. The package manager used to install and link dependencies must be [pnpm](https://pnpm.io/).

1. Run `pnpm i` in the root folder.

2. Run `pnpm run watch` in the root folder to automatically rebuild whenever you make a change.

## Pull requests

### Publishing packages

#### Snapshots

If you wish to test a package before the PR is merged, trigger a snapshot release. Manually dispatch the `Snapshot` workflow, provide a tag name and branch.
