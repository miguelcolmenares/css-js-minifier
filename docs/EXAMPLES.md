# Examples

Real before and after for CSS and JavaScript, with sizes measured in bytes.

Each output on this page was produced by running the same minifier library, with the same options, that the extension uses (LightningCSS 1.33.0 for CSS and oxc-minify 0.156.0 for JavaScript). Nothing was shortened by hand.

You can paste either input into a new file in VS Code and run **Minify this File** to get the same result. The sizes assume the file is saved with Unix line endings (LF) and one final newline, as shown. A file with Windows line endings (CRLF) starts a little bigger.

## CSS: modern syntax is fine

This stylesheet uses CSS nesting and `@starting-style`, two newer CSS features.

**Before**, 496 bytes:

```css
/* Card component */
.card {
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  margin: 0px;
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  transition: opacity 200ms ease-in-out;

  /* Native CSS nesting */
  & .title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a1a1a;
  }

  &:hover {
    border-color: rgb(0, 102, 204);
  }

  /* Starting style for the entry animation */
  @starting-style {
    opacity: 0;
  }
}
```

**After**, 280 bytes, 44% smaller:

```css
.card{background-color:#fff;border:1px solid #0000001f;border-radius:8px;flex-direction:column;margin:0;padding:16px 24px;transition:opacity .2s ease-in-out;display:flex;& .title{color:#1a1a1a;font-size:1.25rem;font-weight:700}&:hover{border-color:#06c}@starting-style{opacity:0}}
```

What happened:

- The comments and all the extra spaces and blank lines are gone.
- Values are written in their shortest form: `#ffffff` became `#fff`, `0px` became `0`, `200ms` became `.2s`, `rgb(0, 102, 204)` became `#06c`, and `rgba(0, 0, 0, 0.12)` became `#0000001f`.
- The nested rule (`& .title`), the `:hover` rule and the `@starting-style` block are understood and kept.
- The declarations inside `.card` come out in a different order. That is expected.

The message VS Code shows for this file, saved as `card.css`:

```text
card.css has been successfully minified (Size reduced from 496 B to 280 B, 44% reduction)
```

## JavaScript

**Before**, 407 bytes:

```js
// Build a greeting for each user and log it.
function buildGreetings(users) {
  const greetings = [];

  for (const user of users) {
    const firstName = user.name.split(" ")[0];
    const message = "Hello, " + firstName + "!";
    greetings.push(message);
  }

  return greetings;
}

/* Run it. */
const people = [{ name: "Ada Lovelace" }, { name: "Grace Hopper" }];
console.log(buildGreetings(people));
```

**After**, 207 bytes, 49% smaller:

```js
function buildGreetings(e){let t=[];for(let n of e){let e=`Hello, `+n.name.split(` `)[0]+`!`;t.push(e)}return t}const people=[{name:`Ada Lovelace`},{name:`Grace Hopper`}];console.log(buildGreetings(people));
```

What happened:

- The comments and whitespace are gone.
- Names inside the function are shortened (`users` became `e`, `greetings` became `t`), and the `firstName` variable was folded into the line that uses it.
- Names at the top level of the file, `buildGreetings` and `people`, keep their names. Other scripts that call them keep working.
- Strings may be written with backticks. The result behaves the same.

The message VS Code shows for this file, saved as `greet.js`:

```text
greet.js has been successfully minified (Size reduced from 407 B to 207 B, 49% reduction)
```

## When the code has an error

If the file has a syntax error, nothing is changed. The extension shows an error message and leaves your file exactly as it was. For example, this JavaScript line:

```js
let x = ;
```

shows:

```text
JavaScript minification error: Unexpected token
```

And in a CSS file, a stray closing brace such as `.a { color: red; } }` shows:

```text
CSS minification error: Unexpected end of input
```

Not every mistake is an error. The CSS minifier accepts some unfinished input: a rule that is missing its closing brace, like `.a { color: red`, is simply closed for you. The JavaScript minifier reads plain JavaScript only, so a file with JSX or TypeScript syntax in it shows an error too.

## Try it on your own file

How much a file shrinks depends on the file. The size message shows the real numbers for your own file. To see them, keep the `css-js-minifier.showSizeReduction` setting on (it is on by default, see [Configuration](CONFIGURATION.md)).
