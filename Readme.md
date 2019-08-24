# Virtual Elements

Use the power of JSX in your app without React!

Create elements using JSX:

```jsx
/* @jsx h */

import h from 'velements'; // es6 
const {h} = require('velements'); // commonjs

const virtualElement = <div id='my-div'><p>text</p></div>;
```

Or in plain JavaScript:

```js
const virtualElement = h('div', { id: 'my-div' }, h('p', null, 'text'));
```

Then use them like regular DOM elements:

```js
document.getElementById('container').appendChild(virtualElement.toElement());
```

### Boost your templates

Handlebars templates are very limiting in terms of logic you can do inside of them  
and writing helpers for every peace of logic can be challenging and time consuming.

Why not just write plane javascript functions:

```jsx harmony
/* @jsx h */
const myPage = (title, text) =>
{
    return (
        <div>
            <h1>{title}</h1>
            <p>{text}</p>
        </div>
    );
};

const app = (loggedIn, title, text) =>
{
    return (
        <div>
            {header()}
            <br/>
            {loggedIn ? loginPage() : myPage(title, text)}
        </div>
    );
}

const virtualElement = app(/*...*/);
```

You can treat a virtual element like a regular string:

```js
const str = virtualElement.toString();

const html = `<html><body>${virtualElement}</body></html>`;
```

This removes the need to compile templates and the resulting HTML is already minified.  
This greatly improves server response time when doing Server Side Rendering.

### React Compatible

Make your code usable by both Vanilla JavaScript apps as well as React apps.

When you want to switch to React world you simply convert your element:

```js
const reactElement = virtualElement.toReactElement();
```

Or in your component:

```jsx
const MyReactComponent = (props) =>
{
    return (
        <div>
            <MyOtherComponent/>
            {virtualElement.toReactElement()}
        </div>
    );
}
```

It can also be rendered by react-dom:

```js
ReactDOM.render(
    virtualElement.toReactElement(),
    document.getElementById('container')
);
```

You can also inject React into the converter.  
The default value is `React = require('react')`

```js
const reactElement = virtualElement.toReactElement(React);
```
