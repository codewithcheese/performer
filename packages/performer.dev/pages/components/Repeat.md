---
title: <Repeat>
---

# \<Repeat\>

`<Repeat>` lets you repeat a set of components or elements.


```js
<Repeat></Repeat>
```

## Reference 

Use `<Repeat>` to repeat the children elements until stopped. 

```jsx
<Repeat times={4}>
  <User />
  <Assistant />
</Repeat>
```

`<Repeat />` duplicates its children on every iteration. 

#### Props 

* `times` optional number. The number of times the children should be repeated.
* `stop` optional boolean signal. When the signal is set to true `<Repeat>` will stop after the current iteration.

## Usage 

### Repeat User and Assistant components 

A simple method for creating an AI chat is to repeat the `<User />` and `<Assistant />` components/

```js
<Repeat times={4}>
    <User />
    <Assistant />
</Repeat>
```

`<Repeat>` starts by returning its children. After then children have been created, `<Repeat />` starts the next iteration by duplicating its children. It creates a new duplicate with every iteration until it has reached the set number of times. 


