# Pretty Fast Pretty Printer

For an introduction to the Pretty Fast Pretty Printer and how to use it, please
see the [guide](https://github.com/brownplt/pretty-fast-pretty-printer/blob/master/guide.md).

This readme is the **reference manual**.

------

_Pretty printing_ is an approach to printing source code that can adapt how
things are printed to fit within a maximum line width. It proceeds in two steps:

1. The source code is converted into a _document_ (instance of `Doc`), which encodes
_all possible ways_ that the souce can be printed.
2. The document is printed to a maximum line width, using the method
`doc.display(width)`.

There are a variety of pretty-printing algorithms. The
pretty-fast-pretty-printer uses a custom algorithm
that displays a document in time **linear** in the number of distinct nodes in
the document. (Note that this is better than linear in the _size_ of the
document: if a document contains multiple references to a single sub-document,
that sub-document is only counted _once_. This can be an exponential
improvement.)

The algorithm takes inspiration from:

1. Wadler's
[Prettier Printer](http://homepages.inf.ed.ac.uk/wadler/papers/prettier/prettier.pdf),
2. Bernardy's
[Pretty but not Greedy Printer](https://jyp.github.io/pdf/Prettiest.pdf), and
3. Ben Lerner's
[Pyret pretty printer](https://github.com/brownplt/pyret-lang/blob/horizon/src/arr/trove/pprint.arr)

This pretty printer was developed as part of
[Codemirror Blocks](https://github.com/bootstrapworld/codemirror-blocks).
Don't let this stop you from using it for your own project, though: it's a
general purpose library!


## Kinds of Docs

Documents are constructed out of six basic _combinators_:


### `txt`: Text

`txt(string)` simply displays `string`. The `string` cannot contain newlines.
`txt("")` is an empty document.

For example,

```js
    txt("Hello, world")
      .display(80);
```

produces:

<code style="background-color:#cde">Hello, world</code>

All other combinators will automatically wrap string arguments in `txt`.
As a result, you can almost always write `"a string"` instead of `txt("a string")`.


### `vert`: Vertical Concatenation

`vert(doc1, doc2, ...)` vertically concatenates documents, from top to bottom.
(I.e., it joins them with newlines). The vertical concatenation of two
documents looks like this:

![Vertical concatenation image](https://raw.githubusercontent.com/brownplt/pretty-fast-pretty-printer/master/vert.png)

For example,

```js
    vert("Hello,", "world!")
      .display(80)
```

produces:

<pre><code style="background-color:#cde">Hello,
world!
</code></pre>

Vertical concatenation is associative. Thus:

      vert(X, Y, Z)
    = vert(X, vert(Y, Z))
    = vert(vert(X, Y), Z)


### `horz`: Horizontal Concatenation

`horz(doc1, doc2, ...)` horizontally concatenates documents. The second document
is indented to match the last line of the first document (and so forth for the
third document, etc.). The horizontal concatention of two documents looks like
this:

![Horizontal concatenation image](https://raw.githubusercontent.com/brownplt/pretty-fast-pretty-printer/master/horz.png)

For example,

```js
    horz("BEGIN ", vert("first line", "second line"))
      .display(80)
```

produces:

<pre><code style="background-color:#cde">BEGIN first line
      second line
</code></pre>

Horizontal concatenation is associative. Thus:

      horz(X, Y, Z)
    = horz(X, horz(Y, Z))
    = horz(horz(X, Y), Z)

`horzArray(docArray)` is a variant of `horz` that takes a single argument that
is an array of documents. It is equivalent to `horz.apply(null, docArray)`.


### `concat`: Simple Concatenation

`concat(doc1, doc2, ...)` naively concatenates documents from left to right. It
is similar to `horz`, except that the indentation level is kept _fixed_ for
all of the documents. The simple concatenation of two documents looks like this:

![Simple concatenation image](https://raw.githubusercontent.com/brownplt/pretty-fast-pretty-printer/master/concat.png)

You should almost always prefer `horz` over `concat`.

As an example,

```js
    concat("BEGIN ", vert("first line", "second line"))
      .display(80))
```

produces:

<pre><code style="background-color:#cde">BEGIN first line
second line
</code></pre>

`concatArray(docArray)` is a variant of `concat` that takes a single argument
that is an array of documents. It is equivalent to `concat.apply(null, docArray)`.


### `ifFlat`: Choose between two Layouts

`ifFlat(doc1, doc2)` chooses between two documents. It will use `doc1` if it
fits entirely on the current line, otherwise it will use `doc2`. More precisely,
`doc1` will be used iff:

1. It can be rendered flat. A "flat" document has no newlines,
   i.e., no `vert`. And,
2. When rendered flat, it fits on the current line without going over
   the pretty printing width.


### `fullLine`: Prevent More on the Same Line

Finally, `fullLine(doc)` ensures that nothing is placed after `doc`, if at all
possible.

This is helpful for line comments. For example, `fullLine("// comment")` will
ensure that (if at all possible) nothing is placed after the comment.


## Other Constructors

Besides the combinators, there are some other useful "utility" constructors.
These constructors don't provide any extra power, as they are all defined in
terms of the combinators described above. But they capture some useful patterns.

### String Templates

There is also a
[string template](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
shorthand for building a `doc`, called `pretty`. Itaccepts template strings that
may contain newlines. It combines the lines with `vert`, and the parts of each
line with `horz`. For example, this template:

```js
    pretty`if (${c}) {\n  ${t}\n} else {\n  ${e}\n}`)
```

pretty prints an `if` statement across multiple lines:

    if (a == b) {
      a << 2
    } else {
      a + b
    }

### SepBy

`sepBy(items, sep, vertSep="")` will display either:

    items[0] sep items[1] sep ... items[n]

if it fits on one line, or:

    items[0] vertSep \n items[1] vertSep \n ... items[n]

otherwise. (Without the extra spaces; those are there for readability.)

Neither `sep` nor `vertSep` may contain newlines.

### Wrap

`wrap(words, sep=" ", vertSep="")` does word wrapping. It combines the `words` with
`sep` when they fit on the same line, or `vertSep\n` when they don't.

For simple word wrapping, you would use:

    wrap(words, " ", "") // or just wrap(words)

For word-wrapping a comma-separated list, you would use:

    wrap(words, ", ", ",")

Neither `sep` nor `vertSep` may contain newlines.


## S-Expression Constructors

There are also some constructors for common kinds of s-expressions:

### Standard

`standardSexpr(func, args)` is rendered like this:

     (func args ... args)

or like this:

     (func
      args
      ...
      args)

### Lambda-like

`lambdaLikeSexpr(keyword, defn, body)` is rendered like this:

    (keyword defn body)

or like this:

    (keyword defn
      body)

### Begin-like

`beginLikeSexpr(keyword, bodies)` is rendered like this:

    (keyword
      bodies
      ...
      bodies)
