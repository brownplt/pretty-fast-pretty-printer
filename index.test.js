const {
  txt, horz, vert, concat, ifFlat, fullLine, wrap, pretty,
  standardSexpr, lambdaLikeSexpr, beginLikeSexpr
} = require('./index');


describe("The Pretty-Printing Doc Class", function() {

  it("Should be able to render nothing.", function() {
    expect(txt("").display(10))
      .toEqual([""]);
  });

  it("Should be able to render literal text.", function() {
    expect(txt("literal text").display(20))
      .toEqual(["literal text"]);
  });

  it("Should be able to vertically concatenate.", function() {
    expect(vert(txt("aaaa"), txt("bbb")).display(20))
      .toEqual(["aaaa", "bbb"]);
  });

  it("Should be able to horizontally concatenate.", function() {
    expect(horz(txt("aaaa"), vert(txt("bb"), txt("cc"))).display(20))
      .toEqual(["aaaabb", "    cc"]);
  });

  it("Should be able to simply concatenate.", function() {
    expect(concat(txt("aaaa"), vert(txt("bb"), txt("cc"))).display(20))
      .toEqual(["aaaabb", "cc"]);
  });

  it("Should be able to interpret magic pretty templates.", function() {
    let one = txt("1");
    let two = txt("2");
    expect(pretty`aaaa ${one}\nb\n  ${two}`.display(10))
      .toEqual(["aaaa 1", "b", "  2"]);
  });

  it("Should render the example magic template correctly.", function() {
    let c = "a == b";
    let t = "a << 2";
    let e = "a + b";
    expect(pretty`if (${c}) {\n  ${t}\n} else {\n  ${e}\n}`.display(80))
      .toEqual(["if (a == b) {", "  a << 2", "} else {", "  a + b", "}"]);
  });

  describe("on the example from the old documentation", function() {
    function binop(left, op, right) {
      return ifFlat(
        pretty`${left} ${op} ${right}`,
        pretty`${left}\n${op} ${right}`);
    }

    function ifte2(c, t, e) {
      return ifFlat(
        pretty`if (${c}) { ${t} } else { ${e} }`,
        pretty`if (${c}) {\n  ${t}\n} else {\n  ${e}\n}`);
    }

    function docExample() {
      return ifte2(binop("a", "==", "b"),
        binop("a", "<<", "2"),
        binop("a", "+", "b"));
    }

    it("should match the documentation.", function() {
      expect(docExample().display(37))
        .toEqual(["if (a == b) { a << 2 } else { a + b }"]);
      expect(docExample().display(35))
        .toEqual(["if (a == b) {", "  a << 2", "} else {", "  a + b", "}"]);
    });
  });

  describe("when rendering the examples from the docs", function() {

    function showFunc(name, args, body) {
      let header = horz(txt("fun "), name, txt("("), args, txt("):"));
      let onOneLine = horz(header, txt(" "), body, txt(" end"));
      let onMultipleLines = vert(header, horz(txt("    "), body), txt("end"));
      return ifFlat(onOneLine, onMultipleLines);
    }

    function funcExample() {
      return showFunc(txt("greet"), txt("name"), txt('"Welcome back, " + name'));
    }

    it("Pyret functions should match the documentation", function() {
      expect(funcExample().display(80))
        .toEqual(['fun greet(name): "Welcome back, " + name end']);
      expect(funcExample().display(40))
        .toEqual(['fun greet(name):', '    "Welcome back, " + name', 'end']);
    });

    it("Horizontal concat should match the docs", function() {
      expect(horz("BEGIN ", vert("first line", "second line")).display(80))
        .toEqual(["BEGIN first line", "      second line"]);
    });

    it("Simple concat should match the docs", function() {
      expect(concat("BEGIN ", vert("first line", "second line")).display(80))
        .toEqual(["BEGIN first line", "second line"]);
    });

    function prettyWhile() {
      let cond = "CONDITION";
      let body = "BODY";
      return vert(
        horz(txt("while ("), cond, txt(") {")),
        horz(txt("  "), body),
        txt("}"));
    }
    
    it("While loops should match the docs", function() {
      expect(prettyWhile().display(80))
        .toEqual(["while (CONDITION) {", "  BODY", "}"]);
    });
  });

  describe("when wrapping words", function() {

    it("should be able to wrap an eight-word sentence.", function() {
      let sentence = wrap(["This", "is", "a", "sentence", "with", "eight", "words"]);
      expect(sentence.display(40))
        .toEqual(["This is a sentence with eight words"]);
      expect(sentence.display(30))
        .toEqual(["This is a sentence with eight", "words"]);
      expect(sentence.display(20))
        .toEqual(["This is a sentence", "with eight words"]);
      expect(sentence.display(10))
        .toEqual(["This is a",  "sentence", "with eight", "words"]);
    });

    it("should be able to wrap a hundred-word paragraph.", function() {
      let sentence =
        ["This", "is", "a", "long", "paragraph", "with", "exactly", "one", "hundred", "words."];
      let para = new Array();
      for (let i = 0; i < 10; i++) {
        para = para.concat(sentence);
      }
      para = wrap(para, " ", "");
      expect(para.display(55).join("\n"))
        .toEqual(`This is a long paragraph with exactly one hundred
words. This is a long paragraph with exactly one
hundred words. This is a long paragraph with exactly
one hundred words. This is a long paragraph with
exactly one hundred words. This is a long paragraph
with exactly one hundred words. This is a long
paragraph with exactly one hundred words. This is a
long paragraph with exactly one hundred words. This is
a long paragraph with exactly one hundred words. This
is a long paragraph with exactly one hundred words.
This is a long paragraph with exactly one hundred
words.`);
    });
  });

  describe("when rendering if/then/else statements", function() {
    function binop(left, op, right) {
      return ifFlat(
        pretty`${left} ${op} ${right}`,
        pretty`${left}\n${op} ${right}`);
    }

    function optBreak(x, y) {
      return ifFlat(
        pretty`${x} ${y}`,
        pretty`${x}\n  ${y}`);
    }

    function ifte(c, t, e) {
      return ifFlat(
        pretty`if ${c} then ${t} else ${e}`,
        vert(optBreak(txt("if"), c),
          optBreak(txt("then"), t),
          optBreak(txt("else"), e)));
    }
    
    function BLernersExample() {
      return ifte(binop("a", "==", "b"),
        binop("a", "<<", "2"),
        binop("a", "+", "b"));
    }

    it("should render them the way that BLerner like them.", function() {
      expect(BLernersExample().display(32))
        .toEqual(["if a == b then a << 2 else a + b"]);
      expect(BLernersExample().display(15))
        .toEqual(["if a == b", "then a << 2", "else a + b"]);
      expect(BLernersExample().display(10))
        .toEqual(["if a == b", "then", "  a << 2", "else a + b"]);
    });
  });

  describe("when rendering fullLines", function() {
    it("should do what the docs suggest and disallow things later on the same line", function() {
      expect(horz(ifFlat("a", vert("a", "A")), "b").display(20))
        .toEqual(["ab"]);
      expect(horz(ifFlat(fullLine("a"), vert("a", "A")), "b").display(20))
        .toEqual(["a", "Ab"]);
    });
  });

  describe("when compared against Bernardy's algorithm", function() {
    function plus(doc1, doc2) {
      return ifFlat(
        pretty`${doc1} + ${doc2}`,
        pretty`${doc1}\n+ ${doc2}`);
    }

    function times(doc1, doc2) {
      return ifFlat(
        pretty`${doc1} * ${doc2}`,
        pretty`${doc1}\n* ${doc2}`);
    }

    function BernardysHeel() {
      return plus(times(txt("aaaaaaaaa"), txt("bb")),
        txt("cc"));
    }

    it("should be exactly the same on most inputs.", function() {
      expect(BernardysHeel().display(19))
        .toEqual(["aaaaaaaaa * bb + cc"]);
      expect(BernardysHeel().display(18))
        .toEqual(["aaaaaaaaa * bb", "+ cc"]);
    });

    it("should choose a better layout for this example.", function() {
      // Bernardy would return "aaaaaaaaa\n* bb + cc" here,
      // which is a little questionable.
      expect(BernardysHeel().display(13))
        .toEqual(["aaaaaaaaa", "* bb", "+ cc"]);
    });
  });

  describe("when rendering s-expressions", function() {
    it("should render standard s-expressions", function() {
      expect(standardSexpr("function", "very-long-argument").display(80))
        .toEqual(["(function very-long-argument)"]);
      expect(standardSexpr("function", "very-long-argument").display(20))
        .toEqual(["(function", " very-long-argument)"]);
    });

    it("should render lambda-like s-expressions", function() {
      expect(lambdaLikeSexpr("lambda", "(number)", "(* number number)").display(80))
        .toEqual(["(lambda (number) (* number number))"]);
      expect(lambdaLikeSexpr("lambda", "(number)", "(* number number)").display(25))
        .toEqual(["(lambda (number)", "  (* number number))"]);
    });

    it("should render begin-like s-expressions", function() {
      expect(beginLikeSexpr("begin", ["1", "2", "3"]).display(80))
        .toEqual(["(begin", "  1", "  2", "  3)"]);
    });
  });
});
