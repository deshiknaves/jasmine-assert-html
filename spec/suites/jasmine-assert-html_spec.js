describe('Jasmine Assert Html', function() {
  var deepEqualIgnoringUnlistedStyleRules;
  var assertStylePropIsColor;
  var assertFontWeightIsBold;
  var assertBackgroundImageIsNone;

  it('should be the same', function() {
    var html = jasmine.matchersUtil.serializeHtml('<span>test</span>');
    expect(html).htmlEqual(html);
  });
});