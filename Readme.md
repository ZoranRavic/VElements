# Virtual Elements

Minimalistic JSX elements that do not require React.

Create elements using JSX:

```jsx
/* @jsx h */
const virtualDiv = <div id='my-div'><p>text</p></div>;
```

Or in plain JavaScript:

```js
const virtualDiv = h('div', { id: 'my-div' }, h('p', null, 'text'));
```

Convert it to a string:

```js
const str = virtualDiv.toString();
```

Or use it in the browser:

```js
document.getElementById('container').appendChild(virtualDiv.toElement());
```

The same objects can be used in React apps:

```js
const reactElement = virtualDiv.toReactElement();

ReactDOM.render(reactElement, document.getElementById('container'));

const customReactFunc = (props) =>
{
    /* ... */
    return virtualDiv.toReactElement();
}
```
