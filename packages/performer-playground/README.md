# @performer/playground

A simple chat UI for testing your Performer apps.

## Install

Install as a dev dependency.

```bash
npm install @performer/playground -D
```

## Setup

Add a script to your `package.json` to start the UI.

```json
{
  "scripts": {
    "playground": "playground <directory-with-app-files>"
  }
}
```

Will start the playground on port 3011 (ChatGPT launch date 30th November).

## Creating apps

An app is any file that exports an `App` component function. 

Export `name` to provide a name your app.

Export `target` with `browser | node | edge` to mark where your app can run.

```tsx
import { Assistant } from "@performer/core";

export const name = 'Joker.ai';
export const target = 'browser'

export function App () {
  return () => (
    <>
      <system>Tell the user a joke about programming</system>
      <Assistant />
    </>
  )
}
```








