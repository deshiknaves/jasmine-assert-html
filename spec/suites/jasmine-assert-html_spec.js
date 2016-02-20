describe('Jasmine Assert Html', function() {
  var deepEqualIgnoringUnlistedStyleRules;
  var assertStylePropIsColor;
  var assertFontWeightIsBold;
  var assertBackgroundImageIsNone;
  var serializeHtml;

  function arrayIndexOf(arr, item) {
    if (typeof arr.indexOf === 'function') {
      return arr.indexOf(item);
    }
    else {
      for (var i = 0, len = arr.length; i < len; i++) {
        if (arr[i] === item) {
          return i;
        }
      }
      return -1;
    }
  }

  function removeUnlistedStyleRulesFromSerializedElementNode(serializedElementNode, listedStyleRules) {
    var cleanedSerializedElementNode = {};
    var cleanedStyleRules = {};
    var i;
    var elKeys;
    var elKey;
    var j;
    var attrs;
    var attrKeys;
    var attrKey;
    var attrVal;
    var cleanedAttrs;
    var kids;
    var kid;
    var cleanedKids;
    var k;
    var styleRuleKeys;
    var styleRuleKey;

    if (!listedStyleRules) {
      listedStyleRules = [];
    }

    elKeys = Object.keys(serializedElementNode);
    for (i = 0; i < elKeys.length; i++) {
      elKey = elKeys[i];

      if (elKey === "Attributes") {
        attrs = serializedElementNode.Attributes;
        cleanedAttrs = {};

        // MOAR ITERATION!!!
        attrKeys = Object.keys(attrs);
        for (j = 0; j < attrKeys.length; j++) {
          attrKey = attrKeys[j];

          if (attrKey !== "style") {
              cleanedAttrs[attrKey] = attrs[attrKey];
          }
          else {
            attrVal = attrs[attrKey];
            styleRuleKeys = Object.keys(attrVal);
            for (k = 0; k < styleRuleKeys.length; k++) {
              styleRuleKey = styleRuleKeys[k];

              if (arrayIndexOf(listedStyleRules, styleRuleKey) !== -1) {
                cleanedStyleRules[styleRuleKey] = attrVal[styleRuleKey];
              }
            }

            if (Object.keys(cleanedStyleRules).length) {
              cleanedAttrs[attrKey] = cleanedStyleRules;
            }
          }
        }
        cleanedSerializedElementNode.Attributes = cleanedAttrs;
      }
      else if (elKey === "ChildNodes") {
        kids = serializedElementNode.ChildNodes;
        cleanedKids = new Array(kids.length);
        for (j = 0; j < kids.length; j++) {
          kid = kids[j];
          // MOAR RECURSION!!!
          if (kid.NodeType === 1) {
            cleanedKids[j] = removeUnlistedStyleRulesFromSerializedElementNode(kid, listedStyleRules);
          }
          else {
            cleanedKids[j] = kid;
          }
        }
        cleanedSerializedElementNode.ChildNodes = cleanedKids;
      } else {
        cleanedSerializedElementNode[elKey] = serializedElementNode[elKey];
      }
    }
    return cleanedSerializedElementNode;
  }

  function removeUnlistedStyleRulesFromSerializedNodes(actual, expected) {
    var actualLength = actual.length;
    var cleanedActual = new Array(actualLength);
    var i;
    var attrs;
    var listedStyleRules;

    for (i = 0; i < actualLength; i++) {
      if (actual[i].NodeType === 1) {
        listedStyleRules = [];
        attrs = expected[i].Attributes;
        if (attrs && attrs['style']) {
          listedStyleRules = Object.keys(attrs['style']);
        }
        cleanedActual[i] = removeUnlistedStyleRulesFromSerializedElementNode(actual[i], listedStyleRules);
      }
      else {
        cleanedActual[i] = actual[i];
      }
    }
    return cleanedActual;
  }

  function ignoreUnlistedStyles(actual, expected) {
    return removeUnlistedStyleRulesFromSerializedNodes(actual, expected);
  }

  beforeEach(function() {
    serializeHtml = jasmine.matchersUtil.serializeHtml
  });

  describe('serialization', function() {
    it('should match the node as text given a text string', function() {
      var serialized = serializeHtml('foo');
      expect(serialized).toEqual([{
        NodeType: 3,
        NodeName: '#text',
        NodeValue: 'foo'
      }]);
    });

    it('should match node details given a basic html element', function() {
      var serialized = serializeHtml('<b>test</b>');
      var expected = [{
        NodeType: 1,
        NodeName: 'b',
        Attributes: {},
        ChildNodes: [{
          NodeType: 3,
          NodeName: '#text',
          NodeValue: 'test'
        }]
      }];

      expect(ignoreUnlistedStyles(serialized, expected)).toEqual(expected);
    });
  });

  describe('Equivalent HTML', function() {
    it('should match identical text', function() {
      var html = serializeHtml('foo');
      expect(html).htmlToBeEqual(html);
    });

    it('should match identical html nodes', function() {
      var html = serializeHtml('<span></span>');
      expect(html).htmlToBeEqual(html);
    });

    it('should match identical singleton/empty elements', function() {
      var html = serializeHtml('<br />');
      var expected = [{
        NodeType: 1,
        NodeName: 'br',
        Attributes: {},
        ChildNodes: []
      }];
      expect(ignoreUnlistedStyles(html, expected)).toEqual(expected);
    });

    describe('Text nodes', function() {
      it('should match text nodes after trimming', function() {
        expect(' test').htmlToBeEqual('test');
      });

      it('should match text nodes after trimming preceding tab(s)', function() {
        expect('\ttest').htmlToBeEqual('test');
      });

      it('should match text nodes after trimming preceding newline(s)', function() {
        expect('\ntest').htmlToBeEqual('test');
      });

      it('should match text nodes after triming following space(s)', function() {
        expect('test ').htmlToBeEqual('test');
      });

      it('should match text nodes that are equivilent after tirmming following tab(s)', function() {
        expect('test\t').htmlToBeEqual('test');
      });

      it('should match text nodes that are equivilent after tirmming following newlines(s)', function() {
        expect('test\n').htmlToBeEqual('test');
      });
    });

    describe('HTML nodes', function() {
      it('should match elments after trimming preceding space(s)', function() {
        expect(' <b>test</b>').htmlToBeEqual('<b>test</b>');
      });

      it('should match elments after trimming preceding tab(s)', function() {
        expect('\t<b>test</b>').htmlToBeEqual('<b>test</b>');
      });

      it('should match elments after trimming preceding newlines(s)', function() {
        expect('\n<b>test</b>').htmlToBeEqual('<b>test</b>');
      });

      it('should match elments after triming following space(s)', function() {
        expect('<b>test</b> ').htmlToBeEqual('<b>test</b>');
      });

      it('should match elments that are equivilent after tirmming following tab(s)', function() {
        expect('<b>test</b>\t').htmlToBeEqual('<b>test</b>');
      });

      it('should match elments that are equivilent after tirmming following newlines(s)', function() {
        expect('<b>test</b>\n').htmlToBeEqual('<b>test</b>');
      });

      it('should match elements that have different tag casing', function() {
        expect('<B>test</B>').htmlToBeEqual('<b>test</b>');
      });

      it('should match elements that have difference attribute casing', function() {
        expect('<b TITLE="testAttr">test</b>').htmlToBeEqual('<b title="testAttr">test</b>');
      });

      it('should match IE attribute optimization where it drops "unnecessary" quotes', function() {
        expect('<b title=testAttr>test</b>').htmlToBeEqual('<b title="testAttr">test</b>');
      });

      it('should match singleton/empty elements with or without insignificant whitespace', function() {
        expect('<br/>').htmlToBeEqual('<br />');
      });

      it('should match singleton/empty elements without self-closing slash', function() {
        expect('<br>').htmlToBeEqual('<br />');
      });

      it('should match attributes even if the order is different', function() {
        var actual = '<b class="className" id="guid" lang="en" title="titleText">test</b>';
        var expected = '<b id="guid" class="className" title="titleText" lang="en">test</b>';

        expect(actual).htmlToBeEqual(expected);
      });

      it('should match attributes in any order bease on superficial attribute prioritization for input elements', function() {
        var actual = '<input id="guid" type="text" value="blah" size="5" />';
        var expected = '<input id="guid" type="text" size="5" value="blah" />';

        expect(actual).htmlToBeEqual(expected);
      });

      it('should match attributes in any order bease on superficial attribute prioritization for input elements without self-closing slash', function() {
        var actual = '<input id="guid" type="text" value="blah" size="5">';
        var expected = '<input id="guid" type="text" size="5" value="blah">';

        expect(actual).htmlToBeEqual(expected);
      });

      it('should match classes with preceding space(s)', function() {
        var actual = '<b class=" class1">test</b>';
        var expected = '<b class="class1">test</b>';

        expect(actual).htmlToBeEqual(expected);
      });

      it('should match classes with following space(s)', function() {
        var actual = '<b class="class1 ">test</b>';
        var expected = '<b class="class1">test</b>';

        expect(actual).htmlToBeEqual(expected);
      });

      it('should match classes with multiple in-between space(s)', function() {
        var actual = '<b class="class1  class2">test</b>';
        var expected = '<b class="class1 class2">test</b>';

        expect(actual).htmlToBeEqual(expected);
      });

      it('should match classes with whitespace characters anywhere', function() {
        var actual = '<b class="\t\n class1 \t\r\n class2 \n\t">test</b>';
        var expected = '<b class="class1 class2">test</b>';

        expect(actual).htmlToBeEqual(expected);
      });

      describe('should compare computed styles reather than style attributes', function() {

        it('should pick the effective style', function() {
          var actual = '<b style="font-weight:normal; font-weight:bold;">test</b>';
          var expected = '<b style="font-weight:bold;">test</b>';

          expect(actual).htmlToBeEqual(expected);
        });

        it('should compare colors with casing differencees', function() {
          var actual = '<b style="color:Red;">test</b>';
          var expected = '<b style="color:red;">test</b>';

          expect(actual).htmlToBeEqual(expected);
        });

        it('should compare hex vs. named colors', function() {
          var actual = '<b style="color:#FF0000;">test</b>';
          var expected = '<b style="color:red;">test</b>';

          expect(actual).htmlToBeEqual(expected);
        });

        it('should compare hex colors with casing differences', function() {
          var actual = '<b style="color:#ff0000;">test</b>';
          var expected = '<b style="color:#FF0000;">test</b>';

          expect(actual).htmlToBeEqual(expected);
        });

        it('should compare hex colors shorthand vs. normal format', function() {
          var actual = '<b style="color:#F00;">test</b>';
          var expected = '<b style="color:#FF0000;">test</b>';

          expect(actual).htmlToBeEqual(expected);
        });

        it('should compare RGB vs. hex colors', function() {
          var actual = '<b style="color:rgb(255, 0, 0);">test</b>';
          var expected = '<b style="color:#FF0000;">test</b>';

          expect(actual).htmlToBeEqual(expected);
        });

        it('should compare rules in different orders', function() {
          var actual = '<b style="font-weight:bold; color:red;">test</b>';
          var expected = '<b style="color:red; font-weight:bold;">test</b>';

          expect(actual).htmlToBeEqual(expected);
        });

        it('should compare shorthand rule vs. individual normal form rules', function() {
          var actual = '<b style="border:5px solid red;">test</b>';
          var expected = '<b style="border-width:5px; border-style:solid; border-color:red;">test</b>';

          expect(actual).htmlToBeEqual(expected);
        });

        it('should compare an overridden shorthand rule fully overrides its previous state', function() {
          var actual = '<b style="background: url(smiley.gif); background: red;">test</b>';
          var expected = '<b style="background: red;">test</b>';

          expect(actual).htmlToBeEqual(expected);
        });
      });

      it('should match multiple root elements', function() {
        var actual = '<b title=strong>test</b><i title=em>ing</i>';
        var expected = '<b title="strong">test</b><i title="em">ing</i>';

        expect(actual).htmlToBeEqual(expected);
      });

      it('should match multiple root nodes with casing differences', function() {
        var actual = '<B>test</B>ing<I>!</I>';
        var expected = '<b>test</b>ing<i>!</i>';

        expect(actual).htmlToBeEqual(expected);
      });
    });

    describe('Inequivalent HTML', function() {
      it('should not match different text nodes', function() {
        var actual = 'test fail';
        var expected = 'TEST FAIL';

        expect(actual).not.htmlToBeEqual(expected);
      });

      it('should not match different elements', function() {
        var actual = 'test fail';
        var expected = '<b>test fail</b>';

        expect(actual).not.htmlToBeEqual(expected);
      });

      it('should not match different tags', function() {
        var actual = '<b>test fail</b>';
        var expected = '<i>test fail</i>';

        expect(actual).not.htmlToBeEqual(expected);
      });

      it('should not match different extra internal element wrappers', function() {
        var actual = '<b>test fail</b>';
        var expected = '<b>test <i>fail</i></b>';

        expect(actual).not.htmlToBeEqual(expected);
      });

      it('should not match attribute value casing differences', function() {
        var actual = '<b title="TEST">test</b>';
        var expected = '<b title="test">test</b>';

        expect(actual).not.htmlToBeEqual(expected);
      });

      it('should not match attribute value differences', function() {
        var actual = '<b id="actual">test fail</b>';
        var expected = '<b id="expected">test fail</b>';

        expect(actual).not.htmlToBeEqual(expected);
      });

      it('should not match CSS class name ordering differences', function() {
        var actual = '<b class="class1 class2">test fail</b>';
        var expected = '<b class="class2 class1">test fail</b>';

        expect(actual).not.htmlToBeEqual(expected);
      });

      it('should not match computed style differences for a single rule', function() {
        var actual = '<b style="color:red;">test</b>';
        var expected = '<b style="color:green;">test</b>';

        expect(actual).not.htmlToBeEqual(expected);
      });

      it('should not match computed style differences for an overridden single rule', function() {
        var actual = '<b style="font-weight:100; font-weight:900;">test</b>';
        var expected = '<b style="font-weight:100;">test</b>';

        expect(actual).not.htmlToBeEqual(expected);
      });

      it('should not match computed style differences over all rules', function() {
        var actual = '<b style="font-weight:bold; color:red;">test</b>';
        var expected = '<b style="font-weight:bold;">test</b>';

        expect(actual).not.htmlToBeEqual(expected);
      });

      it('should not match different number of nodes (and different overall text content)', function() {
        var actual = '<b>test</b>';
        var expected = '<b>test</b><b>ing</b>';

        expect(actual).not.htmlToBeEqual(expected);
      });

      it('should not match different number of nodes (but same overall text content)', function() {
        var actual = '<b>testing</b>';
        var expected = '<b>test</b><b>ing</b>';

        expect(actual).not.htmlToBeEqual(expected);
      });

      it('should not match different number of nodes (and node types)', function() {
        var actual = '<b>testing</b>';
        var expected = '<b>test</b>ing';

        expect(actual).not.htmlToBeEqual(expected);
      });
    });
  });
});