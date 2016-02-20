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
    });
  });
});