---
title: <system>
---

# \<system\>

`<system>` lets you create a system message.

```js
<system></system>
```


## Reference 

Use `<system>` to create a system message.

```js
<system>Your name is ComedyGPT. Be funny.</system>
``` 

`<system>` represents a message literal and has no component logic.   

#### Props 

- `onMessage` optional function. Called when `<assistant>` is created. The function is called with the following arguments:
    - `message` object. Message object of type `AssistantMessage`
- `content` optional string. String message content.
- `children` optional string. String message content.

---

## Usage 

### Using system messages to control assistant behaviour 

`<system>` message can be used to control assistant behaviour.

```jsx
<system>Be funny</system>
<user>Is Javascript the best programming language?</user>
<assistant>Asking if JavaScript is the best programming language is like asking if pineapple belongs on pizza.</assistant>
```

The `<system>` message causes the assistant to reply with a quirky response. Without the system message the reply might have been more serious. Use `<system>` to guide the user experience.

