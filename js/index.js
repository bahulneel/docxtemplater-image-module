var ImageModule, ImgManager, SubContent, fs;

SubContent = require('docxtemplater').SubContent;

ImgManager = require('./imgManager');

fs = require('fs');

ImageModule = (function() {
  function ImageModule(options) {
    this.options = options != null ? options : {};
    if (this.options.centered == null) {
      this.options.centered = false;
    }
    this.imageNumber = 1;
  }

  ImageModule.prototype.handleEvent = function(event, eventData) {
    var gen;
    if (event === 'rendering-file') {
      this.renderingFileName = eventData;
      gen = this.manager.getInstance('gen');
      return this.imgManager = new ImgManager(gen.zip, this.renderingFileName);
    }
  };

  ImageModule.prototype.get = function(data) {
    var templaterState;
    if (data === 'loopType') {
      templaterState = this.manager.getInstance('templaterState');
      if (templaterState.textInsideTag[0] === '%') {
        return 'image';
      }
    }
    return null;
  };

  ImageModule.prototype.getNextImageName = function() {
    var name;
    name = "image_generated_" + this.imageNumber + ".png";
    this.imageNumber++;
    return name;
  };

  ImageModule.prototype.replaceBy = function(text, outsideElement) {
    var subContent, templaterState, xmlTemplater;
    xmlTemplater = this.manager.getInstance('xmlTemplater');
    templaterState = this.manager.getInstance('templaterState');
    subContent = new SubContent(xmlTemplater.content).getInnerTag(templaterState).getOuterXml(outsideElement);
    return xmlTemplater.replaceXml(subContent, text);
  };

  ImageModule.prototype.convertPixelsToEmus = function(pixel) {
    return Math.round(pixel * 9525);
  };

  ImageModule.prototype.getSizeFromData = function(imgData) {
    return [150, 150];
  };

  ImageModule.prototype.getImageFromData = function(imgData) {
    return fs.readFileSync(imgData);
  };

  ImageModule.prototype.handle = function(type, data) {
    var e, imgBuffer, imgData, newText, outsideElement, rId, scopeManager, size, sizePixel, tag, templaterState;
    if (type === 'replaceTag' && data === 'image') {
      scopeManager = this.manager.getInstance('scopeManager');
      templaterState = this.manager.getInstance('templaterState');
      tag = templaterState.textInsideTag.substr(1);
      imgData = scopeManager.getValueFromScope(tag);
      if (imgData === 'undefined') {
        return this.replaceBy('<w:t></w:t>', 'w:t');
      }
      try {
        imgBuffer = this.getImageFromData(imgData);
      } catch (_error) {
        e = _error;
        return this.replaceBy('<w:t></w:t>', 'w:t');
      }
      rId = this.imgManager.loadImageRels().addImageRels(this.getNextImageName(), imgBuffer);
      sizePixel = this.getSizeFromData(imgBuffer);
      size = [this.convertPixelsToEmus(sizePixel[0]), this.convertPixelsToEmus(sizePixel[1])];
      if (this.options.centered === false) {
        outsideElement = 'w:t';
        newText = this.getImageXml(rId, size);
      }
      if (this.options.centered === true) {
        outsideElement = 'w:p';
        newText = this.getImageXmlCentered(rId, size);
      }
      this.replaceBy(newText, outsideElement);
    }
    return null;
  };

  ImageModule.prototype.getImageXml = function(rId, size) {
    return "<w:drawing>\n  <wp:inline distT=\"0\" distB=\"0\" distL=\"0\" distR=\"0\">\n    <wp:extent cx=\"" + size[0] + "\" cy=\"" + size[1] + "\"/>\n    <wp:effectExtent l=\"0\" t=\"0\" r=\"0\" b=\"0\"/>\n    <wp:docPr id=\"2\" name=\"Image 2\" descr=\"image\"/>\n    <wp:cNvGraphicFramePr>\n      <a:graphicFrameLocks xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" noChangeAspect=\"1\"/>\n    </wp:cNvGraphicFramePr>\n    <a:graphic xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\">\n      <a:graphicData uri=\"http://schemas.openxmlformats.org/drawingml/2006/picture\">\n        <pic:pic xmlns:pic=\"http://schemas.openxmlformats.org/drawingml/2006/picture\">\n          <pic:nvPicPr>\n            <pic:cNvPr id=\"0\" name=\"Picture 1\" descr=\"image\"/>\n            <pic:cNvPicPr>\n              <a:picLocks noChangeAspect=\"1\" noChangeArrowheads=\"1\"/>\n            </pic:cNvPicPr>\n          </pic:nvPicPr>\n          <pic:blipFill>\n            <a:blip r:embed=\"rId" + rId + "\">\n              <a:extLst>\n                <a:ext uri=\"{28A0092B-C50C-407E-A947-70E740481C1C}\">\n                  <a14:useLocalDpi xmlns:a14=\"http://schemas.microsoft.com/office/drawing/2010/main\" val=\"0\"/>\n                </a:ext>\n              </a:extLst>\n            </a:blip>\n            <a:srcRect/>\n            <a:stretch>\n              <a:fillRect/>\n            </a:stretch>\n          </pic:blipFill>\n          <pic:spPr bwMode=\"auto\">\n            <a:xfrm>\n              <a:off x=\"0\" y=\"0\"/>\n              <a:ext cx=\"" + size[0] + "\" cy=\"" + size[1] + "\"/>\n            </a:xfrm>\n            <a:prstGeom prst=\"rect\">\n              <a:avLst/>\n            </a:prstGeom>\n            <a:noFill/>\n            <a:ln>\n              <a:noFill/>\n            </a:ln>\n          </pic:spPr>\n        </pic:pic>\n      </a:graphicData>\n    </a:graphic>\n  </wp:inline>\n</w:drawing>";
  };

  ImageModule.prototype.getImageXmlCentered = function(rId, size) {
    return "<w:p>\n  <w:pPr>\n	<w:jc w:val=\"center\"/>\n  </w:pPr>\n  <w:r>\n	<w:rPr/>\n	<w:drawing>\n	  <wp:inline distT=\"0\" distB=\"0\" distL=\"0\" distR=\"0\">\n		<wp:extent cx=\"" + size[0] + "\" cy=\"" + size[1] + "\"/>\n		<wp:docPr id=\"0\" name=\"Picture\" descr=\"\"/>\n		<a:graphic xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\">\n		  <a:graphicData uri=\"http://schemas.openxmlformats.org/drawingml/2006/picture\">\n			<pic:pic xmlns:pic=\"http://schemas.openxmlformats.org/drawingml/2006/picture\">\n			  <pic:nvPicPr>\n				<pic:cNvPr id=\"0\" name=\"Picture\" descr=\"\"/>\n				<pic:cNvPicPr>\n				  <a:picLocks noChangeAspect=\"1\" noChangeArrowheads=\"1\"/>\n				</pic:cNvPicPr>\n			  </pic:nvPicPr>\n			  <pic:blipFill>\n				<a:blip r:embed=\"rId" + rId + "\"/>\n				<a:stretch>\n				  <a:fillRect/>\n				</a:stretch>\n			  </pic:blipFill>\n			  <pic:spPr bwMode=\"auto\">\n				<a:xfrm>\n				  <a:off x=\"0\" y=\"0\"/>\n				  <a:ext cx=\"" + size[0] + "\" cy=\"" + size[1] + "\"/>\n				</a:xfrm>\n				<a:prstGeom prst=\"rect\">\n				  <a:avLst/>\n				</a:prstGeom>\n				<a:noFill/>\n				<a:ln w=\"9525\">\n				  <a:noFill/>\n				  <a:miter lim=\"800000\"/>\n				  <a:headEnd/>\n				  <a:tailEnd/>\n				</a:ln>\n			  </pic:spPr>\n			</pic:pic>\n		  </a:graphicData>\n		</a:graphic>\n	  </wp:inline>\n	</w:drawing>\n  </w:r>\n</w:p>";
  };

  return ImageModule;

})();

module.exports = ImageModule;
