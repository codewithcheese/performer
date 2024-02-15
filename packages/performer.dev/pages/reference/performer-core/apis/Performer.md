---
title: Performer
---

# Performer

`Performer` lets you run a performer app.

```jsx
new Performer(<App />);
```

## Reference 

### `Performer(app, options)` 

Create an instance of `Performer` to run an app.

```js
import { Performer } from '@performer/core';

const performer = new Performer(<App />);
```

[See more examples below.](#usage)

#### Parameters 

* `app` A PerformerElement. The root element of your performer app.
* `options` optional object. Run options.
  * `throwOnError` optional boolean. When `true` Performer will throw on exception. When `false` Performer will not throw. An `ErrorEvent` with be dispatched and the error added to the `errors` property.  

#### Returns 

Returns an instance of the `Performer` class.

## Usage 

### Run your performer app 

```js
import { Performer } from '@performer/core';

function App () {
  return () => (
    <>
      <system>Write a haiku about Javascript.</system>
      <Assistant />
    </>
  )
}

const performer = new Performer(<App />);
performer.start();
await performer.waitUntilSettled();
```
