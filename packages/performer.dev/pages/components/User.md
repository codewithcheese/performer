---
title: <User>
---

# `<User>`

`<User>` lets you wait for user message input.

```jsx
<User />
```

## Reference 

Use `<User>` component to wait for external user message input.

The following app would first wait for user input, then request assistant completion using the system and user message as input.

```jsx
import { Assistant, User } from "@performer/core";

function App() {
  return () => (
    <>
      <system>Answer the users question with a joke</system>
      <User />
      <Assistant />
    </>
  )
}
```

`<User>` pauses execution until Performer receives input. When input is received it creates `<user>` message elements. 

#### Props 

`<User>` has no props.

#### Caveats 

- `<User>` does not use children props. `<User>some content</User>` has no effect. Prefer self-closing syntax `<User />`.
- Beware that capitalized `<User>` component is different from lowercase `<user>` message element. `<User>` waits for external user input. `<user>` is a literal user message and has no other functionality.

---

## Usage 

### Create a chat between user and assistant 

A chat is a multi-turn conversation between a user and an assistant. 

```js
<assistant>Hi, how can I help you?</assistant>
<Repeat>
    <User />
    <Assistant />
</Repeat>
```

This program starts predefined assistant greeting "Hi, how can I help you?" and then waits for the user message. When user input is received the `<Assistant />` component sends the user message to the language model, which generates an assistant message in reply. `<Repeat />` then creates another `<User />` and `<Assistant />` and the chat continues.


