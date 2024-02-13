---
title: <Fragment>
---

# `<Fragment>`

`<Fragment>`, often used via `<>...</>` syntax, lets you group elements without a wrapper node.

```jsx
<></>
```

## Reference

Wrap elements in `<Fragment>` to group them together in situations where you need a single element. Grouping elements in `Fragment` has no effect on the resulting messages; it is the same as if the elements were not grouped. The empty JSX tag `<></>` is shorthand for `<Fragment></Fragment>` in most cases.

```jsx
<>
  <OneChild />
  <AnotherChild />
</>
```

#### Props 

`<Fragment>` does not accept any props.

## Usage 

### Returning multiple elements 

Use `Fragment`, or the equivalent `<>...</>` syntax, to group multiple elements together. You can use it to put multiple elements in any place where a single element can go. For example, a component can only return one element, but by using a Fragment you can group multiple elements together and then return them as a group:

```js {3,10}
function FewShotClassification() {
  return (
    <>
      <user>This movie was an exhilarating journey through the imagination. Loved every second!</user>
      <assistant>Positive</assistant>
      <user>A total waste of time. The plot was predictable and the acting mediocre.</user>
      <assistant>Negative</assistant>
      <user>It's rare to see a film that captures the essence of the book so well.</user>
      <assistant>Positive</assistant>
    </>
  );
}
```
