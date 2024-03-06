# Performer

[![Twitter Follow](https://img.shields.io/twitter/follow/codewithcheese?style=social)](https://twitter.com/codewithcheese)

---

A declarative component framework for building AI assistants.

<p align="center">
<img src="./assets/logo.webp" alt="Image description" height="300" width="300" >
</p>

Performer is a Javascript component framework for building programmable and modular AI assistants like chatbots and agents. Performer is inspired by frameworks like React and uses JSX and components. However, Performer is for building conversational AI backends not user interfaces.

## Why?

Performer was created as a result of two important insights:

### Language require context not input values.

To maximise the quality of a language model response we must optimize the context it receives. A context may be 1000s of characters, with a mix of messages, source text, code or structured data. This makes language models significantly different from functions or pipeline operators. 

To efficiently develop applications for language models we need abstractions that make handling context data easy.

Fortunately, humans also need context in the form of user interfaces.

To do

### AI enables a new kind of high-level programming.

To do

## How Performer works

To do

## Quickstart

To get started locally you should have a few things:

- Node.js installed.
- Either pnpm, or another package manager like npm
or yarn. We recommend `pnpm`.

Use the `create` command in your terminal to create a new Performer project.

```sh
pnpm create performer@latest
```

## Creating your first performer

A simple chat application.

```jsx
import { Assistant, User, Repeat } from "@performer/core";

function App() {
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

const performer = new Performer(<App />);
performer.start();
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
