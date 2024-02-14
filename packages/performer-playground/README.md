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

Export `meta` object to provide a name for the app.

```tsx
import { Assistant } from "@performer/core";

export const meta = {
  name: 'joke',
}

export function App () {
  return () => (
    <>
      <system>Tell the user a joke about programming</system>
      <Assistant />
    </>
  )
}
```








