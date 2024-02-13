---
title: <Assistant>
---

# `<Assistant>`

`<Assistant>` lets you requests an assistant message response from a language model.


```js
<Assistant model="gpt-4" />
```

## Reference 

Use `<Assistant>` component to generate an assistant messages from an OpenAI API compatible language model. `<Assistant>` uses the message elements above it to send the request.  

The following app would request assistant completion using the system message as input.

```jsx
import { Assistant } from '@performer/core'

function App () {
  return () => (
    <>
      <system>Tell a joke about Javascript frameworks</system>
      <Assistant />
    </>
  )
}
```

`<Assistant />` supports streaming responses by default. 

#### Props 
* `apiKey` (optional): A string. API key for OpenAI or language model service. 
* `baseURL` (optional): A string. Required when using a service other than OpenAI.
* `model` (optional): A string. Identifier for the model. 
* `toolChoice` (optional): `"none"` `"auto"` or `Tool`. `"none"` means the model will not respond with a tool call. `"auto"` means the model will choose to respond with text content and/or a tool call. Specifying a `Tool` forces the model to respond with a tool call for the given tool.
* `tools`: Array of objects. List of `Tool` available the model call in response..
* `defaultHeaders` (optional): An object with string values. Headers included in the language model request.
* `dangerouslyAllowBrowser` (default=true): A boolean. Set to `false` to disallow language model requests in the browser.
* `onMessage` (optional): A callback. Called once for each message created by `<Assistant>`. Typically, one `assistant` message and zero or more `tool` messages.   


#### Caveats 

- `<Assistant>` does not accept children. `<Assistant>some content</Assistant>` has no effect. Prefer self-closing syntax `<Assistant />`.
- Beware that capitalized `<Assistant>` component is different from lowercase `<assistant>` message element. `<Assitant />` requests language model responses. `<Assistant />` is used to request language model completions.

## Usage 

### Generate an assistant reply 

Use `<Assistant />` to generate an assistant response to the current messages.

```js
<system>Greet the user with a joke</system>
<Assistant />
```

`<Assistant />` will send the system message instructing the model to greet the user with a joke to the OpenAI API. The model will reply with an assistant message most likely with a greeting and a joke.

`<Assistant />` will stream the response and add the assistant message to the render tree.

### Using language models to call tools 

`<Assistant />` supports tool calling using `Tool` objects.


