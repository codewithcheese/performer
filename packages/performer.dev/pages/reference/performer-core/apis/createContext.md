---
title: createContext
---

# createContext

`createContext` lets you create a context that components can provide and access.

```js
const Context = createContext(name)
```

## Reference 

### `createContext(name)` 

Call `createContext` outside of any components to create a context.

```js
import { createContext } from '@performer/core';

const ConfigContext = createContext('config');
```

[See more examples below.](#usage)

#### Parameters 

* `name`: A unique name to internally identify the context. Must only contain  A-Z,a-z,0-9, _, -.

#### Returns 

`createContext` returns a context object.

**The context object itself does not hold any information.** It represents _which_ context other components read or provide. Use [`useContextProvider(SomeContext)`](/reference/react/useContextProvider) in a component that provides the initial context value, and call [`useContext(SomeContext)`](/reference/react/useContext) in child components to read it. The context object has a few properties:

## Usage 

### Creating context 

Context lets components pass information deep down without explicitly passing props.

Call `createContext` outside any components to create one or more contexts.

```js [[1, 3, "ConfigContext"], [1, 4, "ProfileContext"], [3, 3, "'config'"], [3, 4, "'profile'"]]
import { createContext } from 'react';

const ConfigContext = createContext('config');
const ProfileContext = createContext('profile');
```

`createContext` returns a <CodeStep step={1}>context object</CodeStep>. 

Components can set context by passing the context object to [`useContextProvider()`](/reference/react/useContextProvider) along with an initial value:

```js [[1, 2, "ConfigContext"], [1, 3, "ProfileContext"]]
function App() {
  useContextProvider(ConfigContext, { model: 'gpt-4' });
  useContextProvider(ProfileContext, { name: 'Taylor', age: '28' });
  // ...
}
```

Child components of `App` can now read context by passing the context object to [`useContext()`](/reference/react/useContext):

```js [[1, 2, "ConfigContext"], [1, 7, "ProfileContext"]]
function MyAssistant() {
  const config = useContext(ConfigContext);
  // ...
}

function Profile() {
  const profile = useContext(ProfileContext);
  // ...
}
```

`useContext` like `useState` returns a signal that wraps the context value. The context value can be read and modified using the `value` property.

```js
config.value = { model: 'gpt-5' }
```

---

### Importing and exporting context from a module 

Often, components in different files will need access to the same context. This is why it's common to declare contexts in a separate file. Then you can use the [`export` statement](https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/export) to make context available for other files:

```js
import { createContext } from 'react';

const ConfigContext = createContext('config');
const ProfileContext = createContext('profile');
```

Components declared in other files can then use the [`import`](https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/import) statement to read or provide this context:

```js
import { ConfigContext } from './Contexts.js';

function MyAssistant() {
  const config = useContext(ConfigContext);
  // ...
}
```

```js
import { ConfigContext, ProfileContext } from './Contexts.js';

function App() {
  useContextProvider(ConfigContext, { model: 'gpt-4' });
  useContextProvider(ProfileContext, { name: 'Taylor', age: '28' });
  // ...
}
```

This works similar to importing and exporting components.

