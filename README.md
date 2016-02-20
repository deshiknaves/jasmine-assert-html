# Jasmine Assert Html
Matcher for Jasmine which matches the equvilancy of two HTML strings after normalization

This is a port of JamesMGreene's [qunit-assert-html](https://github.com/JamesMGreene/qunit-assert-html) for Jasmine. All the cross browser compaitibility has been removed as this will run on Phantomjs.

## Usage
```js
it('should match html', function() {
  var actual = '<span style="display: none;" class="name">true</span>';
  var expected = '<span class="name" style="display: none">true</span>';
  expect(actual).htmlToBeEqual(expected);
});
```
## License
Copyright (c) for portions of jasmine-assert-html are held by James M. Greene, 2013-2015 as part of qunit-assert-html. All other copyright for jasmine-assert-html are held by Deshi Rahim, 2016.
Licensed under the MIT license.