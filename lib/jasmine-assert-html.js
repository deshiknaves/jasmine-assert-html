(function (root, factory) {
   if (typeof module !== 'undefined' && module.exports) {
    factory(root, root.jasmine);
  } else {
    factory(root, root.jasmine);
  }
  }((function() {return this; })(), function (window, jasmine) {
  'use strict';

  function trim(s) {
    if (!s) {
      return '';
    }
    var re = new RegExp(/^\s+|\s+$/g);
    return typeof s.trim === 'function' ? s.trim() : s.replace(re, '');
  };

  function normalizeWhitespace(s) {
    if (!s) {
      return '';
    }
    return trim(s.replace(/\s+/g, ' '));
  };

  var dedupeFlatDict = function(dictToDedupe, parentDict) {
    var key, val;
    if (parentDict) {
      for (key in dictToDedupe) {
        val = dictToDedupe[key];
        if (val && (val === parentDict[key])) {
          delete dictToDedupe[key];
        }
      }
    }
    return dictToDedupe;
  };

  function addEvent(el, type, fn) {
    if (el.addEventListener) {
      el.addEventListener(type, fn, false);
    }
  };

  var getElementStyles = (function() {
    // Memoized
    var camelCase = (function() {
      var camelCaseFn = (function() {
        // Matches dashed string for camelizing
        var rmsPrefix = /^-ms-/;
        var msPrefixFix = 'ms-';
        var rdashAlpha = /-([\da-z])/gi;
        function camelCaseReplacerFn(all, letter) {
            return (letter + "").toUpperCase();
        };

        return function(s) {
            return s.replace(rmsPrefix, msPrefixFix).replace(rdashAlpha, camelCaseReplacerFn);
        };
      })();

      var camelCaseMemoizer = {};

      return function(s) {
        var temp = camelCaseMemoizer[s];
        if (temp) {
            return temp;
        }

        temp = camelCaseFn(s);
        camelCaseMemoizer[s] = temp;
        return temp;
      };
    })();

    var styleKeySortingFn = function(a, b) {
      return camelCase(a) < camelCase(b);
    };

    return function(elem) {
      var styleCount;
      var i;
      var key;
      var styles = {};
      var styleKeys = [];
      var style = elem.ownerDocument.defaultView.getComputedStyle(elem, null);

      // `getComputedStyle`
      if (style && style.length && style[0] && style[style[0]]) {
        styleCount = style.length;
        while (styleCount--) {
          styleKeys.push(style[styleCount]);
        }
        styleKeys.sort(styleKeySortingFn);

        for (i = 0, styleCount = styleKeys.length ; i < styleCount ; i++) {
          key = styleKeys[i];
          if (key !== "cssText" && typeof style[key] === "string" && style[key]) {
            styles[camelCase(key)] = style[key];
          }
        }
      }

      return styles;
    };
  })();

  function serializeElementNode(elementNode, rootNodeStyles) {
    var subNodes, i, len, styles, attrName,
        serializedNode = {
            NodeType: elementNode.nodeType,
            NodeName: elementNode.nodeName.toLowerCase(),
            Attributes: {},
            ChildNodes: []
        };

    subNodes = elementNode.attributes;
    for (i = 0, len = subNodes.length ; i < len ; i++) {
        attrName = subNodes[i].name.toLowerCase();
        if (attrName === "class") {
            serializedNode.Attributes[attrName] = normalizeWhitespace(subNodes[i].value);
        }
        else if (attrName !== "style") {
            serializedNode.Attributes[attrName] = subNodes[i].value;
        }
        // Ignore the "style" attribute completely
    }

    // Only add the style attribute if there is 1+ pertinent rules
    styles = dedupeFlatDict(getElementStyles(elementNode), rootNodeStyles);
    if (styles && Object.keys(styles).length) {
        serializedNode.Attributes["style"] = styles;
    }

    subNodes = elementNode.childNodes;
    for (i = 0, len = subNodes.length; i < len; i++) {
        serializedNode.ChildNodes.push(serializeNode(subNodes[i], rootNodeStyles));
    }

    return serializedNode;
  };

  function serializeNode(node, rootNodeStyles) {
    var serializedNode;

    switch (node.nodeType) {
      case 1:   // Node.ELEMENT_NODE
        serializedNode = serializeElementNode(node, rootNodeStyles);
        break;
      case 3:   // Node.TEXT_NODE
        serializedNode = {
          NodeType: node.nodeType,
          NodeName: node.nodeName.toLowerCase(),
          NodeValue: node.nodeValue
        };
        break;
      case 4:   // Node.CDATA_SECTION_NODE
      case 7:   // Node.PROCESSING_INSTRUCTION_NODE
      case 8:   // Node.COMMENT_NODE
        serializedNode = {
          NodeType: node.nodeType,
          NodeName: node.nodeName.toLowerCase(),
          NodeValue: trim(node.nodeValue)
        };
        break;
      case 5:   // Node.ENTITY_REFERENCE_NODE
      case 6:   // Node.ENTITY_NODE
      case 9:   // Node.DOCUMENT_NODE
      case 10:  // Node.DOCUMENT_TYPE_NODE
      case 11:  // Node.DOCUMENT_FRAGMENT_NODE
      case 12:  // Node.NOTATION_NODE
        serializedNode = {
          NodeType: node.nodeType,
          NodeName: node.nodeName
        };
        break;
      case 2:   // Node.ATTRIBUTE_NODE
        throw new Error("`node.nodeType` was `Node.ATTRIBUTE_NODE` (2), which is not supported by this method");
        break;
      default:
        throw new Error("`node.nodeType` was not recognized: " + node.nodeType);
    }

    return serializedNode;
  };

  function serializeHtml(html) {
    var scratch = getCleanSlate();
    var rootNode = scratch.container();
    var rootNodeStyles = getElementStyles(rootNode);
    var serializedHtml = [];
    var kids;
    var i;
    var len;
    rootNode.innerHTML = trim(html.toString());

    kids = rootNode.childNodes;
    for (i = 0, len = kids.length; i < len; i++) {
        serializedHtml.push(serializeNode(kids[i], rootNodeStyles));
    }

    scratch.reset();

    return serializedHtml;
  };

  var getCleanSlate = (function() {
    var containerElId = 'jasmine-html-scratch-pad';
    var iframeReady = false;
    var iframeApi;
    var iframe;
    var iframeWin;
    var iframeDoc;

    function iframeLoaded() {
      iframeReady = true;
    }

    function iframeReadied() {
      if (iframe.readyState === 'complete' || iframe.readyState === 4) {
        iframeReady = true;
      }
    }

    if (!iframeApi) {
      // Initialize the background iframe
      beforeAll(function() {
        if (!iframe || !iframeWin || !iframeDoc) {
          iframe = window.document.createElement('iframe');
          addEvent(iframe, 'load', iframeLoaded);
          addEvent(iframe, 'readystatechange', iframeReadied);
          iframe.style.position = 'absolute';
          iframe.style.top = iframe.style.left = '-1000px';
          iframe.height = iframe.width = 0;

          window.document.body.appendChild(iframe);

          iframeWin = iframe.contentWindow ||
              iframe.window ||
              iframe.contentDocument && iframe.contentDocument.defaultView ||
              iframe.document && (iframe.document.defaultView || iframe.document.window) ||
              window.frames[(iframe.name || iframe.id)];

          iframeDoc = iframeWin && iframeWin.document ||
              iframe.contentDocument ||
              iframe.document;

          var iframeContents = [
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
            '   <title>Jasmine HTML scratch iframe</title>',
            '</head>',
            '<body>',
            '   <div id="' + containerElId + '"></div>',
            '   <script type="text/javascript">',
            '       window.isReady = true;',
            '   </script>',
            '</body>',
            '</html>'
          ].join("\n");

          iframeDoc.open();
          iframeDoc.write(iframeContents);
          iframeDoc.close();

          // Is ready?
          iframeReady = iframeReady || iframeWin.isReady;
        }
      });

      afterAll(function() {
        if (iframe && iframe.ownerDocument) {
          iframe.parentNode.removeChild(iframe);
        }
        iframe = iframeWin = iframeDoc = null;
        iframeReady = false;
      });

      var waitForIframeReady = function(maxTimeout) {
        if (!iframeReady) {
          if (!maxTimeout) {
            maxTimeout = 2000;  // 2 seconds MAX
          }
          var startTime = new Date();
          while (!iframeReady && ((new Date() - startTime) < maxTimeout)) {
            iframeReady = iframeReady || iframeWin.isReady;
          }
        }
      }

      var container = function() {
        waitForIframeReady();
        if (iframeReady && iframeDoc) {
          return iframeDoc.getElementById(containerElId);
        }
        return undefined;
      }

      var reset = function() {
        var containerEl = iframeApi.container();
        if (containerEl) {
          containerEl.innerHTML = "";
        }
      }

      iframeApi = {
        container: container,
        reset: reset
      };
    }

    return function() {
      return iframeApi;
    }
  })();

  beforeEach(function() {
    jasmine.matchersUtil.serializeHtml = serializeHtml;
    jasmine.addMatchers({
      htmlToBeEqual: function () {
        return {
          compare: function (actual, expected) {

            function message() {
              return 'Expected ' + actual + "'s html to be equal to " + expected;
            }

            var sanitizedActual = serializeHtml(actual);
            var sanitizedExpected = serializeHtml(expected);
            return {
              pass: jasmine.matchersUtil.equals(sanitizedActual, sanitizedExpected),
              message: message
            }
          }
        }
      }
    });
  });
}));