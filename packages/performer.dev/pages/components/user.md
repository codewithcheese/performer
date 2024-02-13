---
title: <user>
---

# `<user>`

`<user>` lets you create a user message.

```js
<user></user>
```

## Reference 

Use `<user>` to create a user message.

```js
<user>Can you help me with my home work?</user>
```

`<user>` represents a message literal and has no component logic.   

#### Props 

- `onMessage` optional function. Called when `<assistant>` is created. The function is called with the following arguments:
    - `message` object. Message object of type `AssistantMessage`
- `content` optional string or object of type `MessageContent`.
- `children` optional string. String message content.

#### Caveats 

- Beware that lowercase `<user>` element is different from capitalized `<User>` component. `<user>` represents a user message literal and has no logic. `<User />` is a component that waits for external user input and returns message elements containing the input.

## Usage 

### Create few shot examples 

Message elements can be used to provide examples for in-context learning: 

```js
<user>This movie was an exhilarating journey through the imagination. Loved every second!</user>
<assistant>Positive</assistant>
<user>A total waste of time. The plot was predictable and the acting mediocre.</user>
<assistant>Negative</assistant>
<user>It's rare to see a film that captures the essence of the book so well.</user>
<assistant>Positive</assistant>
<user>I was crying at the end of this movie it was overwhelming but brilliant</user>
<Assistant />
```

Three `user`, `assistant` message pairs provide in-context examples of movie review classification. Finally, the `<Assistant />` component is used to request a classification of the final `<user>` message.

