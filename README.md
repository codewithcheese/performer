# Performer

[![Twitter Follow](https://img.shields.io/twitter/follow/codewithcheese?style=social)](https://twitter.com/codewithcheese)

---

A declarative component framework for building AI assistants.

<p align="center">
<img src="./assets/logo.webp" alt="Image description" height="300" width="300" >
</p>

Performer is a Javascript component framework for building programmable and modular AI assistants like chatbots and agents. Performer is inspired by frameworks like React and uses JSX and components. However, Performer is for building conversational AI backends not user interfaces.

## Quickstart

To get started locally you should have a few things:

- Node.js installed.
- npm, yarn or pnpm. We recommend `pnpm`.

Use the `create` command in your terminal to create a new Performer project.

```sh
npm create performer@latest
```

## Creating your first performer

A simple chat application.

```jsx
import { Assistant, User, Repeat } from "@performer/core";

export function App() {
  return () => (
    <>
      <system>Help the user. Be funny</system>
      <Repeat>
        <User />
        <Assistant />
      </Repeat>
    </>
  );
}
```

Start the playground to chat with your app.

```sh
pnpm run playground
```

## Table of Contents
- [Performer class](#performer-class)
- [Elements](#elements)
- [Components](#components)
- [Built-in components](#built-in-components)

### Elements

Performer uses JSX, but instead of HTML tags like `body` and `div`, tags are based on OpenAI chat message roles: `system`, `assistant`, `user`, `tool`.

```jsx
<system>Greet the user, be funny!</system>
<assistant>Hello there! I'd tell you a joke about time travel, but you didn't like it.</assistant>
<user>That's a good one! I see what you did there.</user>
```

Message elements don't have any functionality, they simply represent a list of messages. 

[Back to Table of Contents](#table-of-contents)

### Components

Components give your app functionality. Components are the building blocks that make it easy to build complex conversational AI.

A Performer component is a JavaScript function that encapsulates logic and messages. Performer component names must always start with a capital letter, while message tags must be lowercase.

Here is a component that fetches a list of repositories for a user and creates a system message:

```tsx
async function fetchRepos(user: string) {  
  const response = await fetch(  
    `https://api.github.com/users/${user}/repos?sort=updated`,  
  );  
  return response.json();  
}  
  
function Repos({ user }: { user: string }) {  
  const repos = useResource(fetchRepos, user);  
  
  return () => (  
    <system>  
      Answer questions about the {user}'s GitHub respositories  
      {user}'s GitHub Repositories:  
      {repos.map(  
        (repo: any) => `    
          ${repo.full_name}    
          ${repo.description}    
          \n`,  
      )}  
    </system>  
  );  
}
```

Some key differences from React here to take notice of:

1) The component returns a function that wraps JSX instead of returning JSX directly. In Performer a component only runs **once**, if changes only the return function is re-executed to update the JSX. This means you don't have to worry about memoization, no need for hooks like `useMemo` or `useCallback`   
2) Asynchronous data is loaded in the component body using `useResource` without the need for `async/await`. Performer pauses the component when `useResource` is running and resumes when the data is available.

[Back to Table of Contents](#table-of-contents)

### Built-in components

Performer comes with a few built-in components that you can use in your JSX.

**Assistant**

The built-in `Assistant` component requests a completion from an OpenAI compatible language model and returns an `assistant` message.

Now we have the repos we can ask a question. The `Assistant` component will send a request with the `system` message from `Repos` and the `user` message containing the question. Once the language model responds it will add an `assistant` message with the answer as a response.

```jsx
import { Assistant } from "@performer/core";

function RecentWork ({ user }) {  
  return () => (  
    <>  
      <Repos user={user} />  
      <user>What has {user} been working on recently?</user>
      <Assistant />  
    </>  
  )  
}
```

**User**

The built-in `User` component waits for external user input and returns a `user` messages.

The previous example used a static `user` message to ask a question. We can replace it with the `User` component to wait for external user input.

```jsx
import { Assistant, User } from "@performer/core";

function RecentWork ({ user }) {  
  return () => (  
    <>  
      <Repos user={user} />  
      <User />
      <Assistant />  
    </>  
  )  
}
```

We now have a component which can answer questions about a users GitHub repos. This can be used as an API endpoint, or part of a larger chatbot or agent.

**Repeat**

`Repeat` is a built-in component, that duplicates its children with every iteration.

`Repeat` can be used to create a back and forth chat between a user and an assistant:

```tsx
import { Assistant, User, Repeat } from "@performer/core";

function App () {  
  return () => (  
    <>  
      <system>Help the user. Be funny</system>
      <Repeat>
		<User />
		<Assistant />
	  </Repeat>
    </>  
  )  
}
```

The initial system message sets the tone, then the chat alternates between user input and assistant response.

[Back to Table of Contents](#table-of-contents)

### Playground

The Performer Playground is a React app for testing and chatting with your performers.

To use playground with your apps install the package:

```sh
npm install @performer/playground
```

The playground package comes with a CLI named `playground`.

Add a script to your `package.json` pointing at your source directory:

```json
"scripts": {
  ...
  "playground": "playground ./src"
}
```

**App modules**

The playground imports all modules in the source directory. Modules that export the following are considered Performer apps:


`App` function required. Any module that export an `App` function is considered a Performer app. 

```jsx
export function App () {
  ...
}
```

`name` string optional. Name used to identify the app in the sidebar. Filename is used if `name` not exported.

```jsx
export const name = 'My chatbot'
```

`slug` string optional. Slug used in the URL path to your app. Slugified name is used if `slug` not exported.

```jsx
export const slug = 'chatbot'
```

`target` `browser|node` optional. Control which environment the app is loaded.

```jsx
export const target = 'browser'
```

Note: Only client side `browser` loading as been implement, if set to `node` the app will not appear in the playground.

### Performer class

Use `Performer` class to run and interact with performer apps.

```jsx
import { Performer } from '@performer/core'

function App () {
  // ...
}

const performer = new Performer(<App />);
performer.start();
```



