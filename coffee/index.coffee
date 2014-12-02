SubContent=require('../node_modules/docxtemplater/js/subContent.js')
ImgManager=require('./imgManager')
fs=require('fs')

class ImageModule
	constructor:(@options={})->
		if !@options.centered? then @options.centered=false
		@imageNumber=1
	handleEvent:(event,eventData)->
		if event=='rendering-file'
			@renderingFileName=eventData
			gen=@manager.getInstance('gen')
			@imgManager=new ImgManager(gen.zip,@renderingFileName)
	get:(data)->
		if data=='loopType'
			templaterState=@manager.getInstance('templaterState')
			if templaterState.textInsideTag[0]=='%'
				return 'image'
		null
	getNextImageName:()->
		name="image_generated_#{@imageNumber}.png"
		@imageNumber++
		name
	handle:(type,data)->
		if type=='replaceTag' and data=='image'
			scopeManager=@manager.getInstance('scopeManager')
			xmlTemplater=@manager.getInstance('xmlTemplater')
			templaterState=@manager.getInstance('templaterState')

			tag = templaterState.textInsideTag.substr(1)
			imgName=scopeManager.getValueFromScope(tag)
			if imgName=='undefined' then throw new Error "imageName is undefined for:#{tag}"
			try
				imgData=fs.readFileSync(imgName)
			catch e
				console.error "image not defined #{imgName}"
				throw e

			rId=@imgManager
				.loadImageRels()
				.addImageRels(@getNextImageName(),imgData)

			if @options.centered==false
				subContent=new SubContent(xmlTemplater.content).getInnerTag(templaterState).getOuterXml('w:t')
				newText=@getImageXml(rId,"description")
			if @options.centered==true
				subContent=new SubContent(xmlTemplater.content).getInnerTag(templaterState).getOuterXml('w:p')
				newText=@getImageXmlCentered(rId)

			xmlTemplater.replaceXml(subContent,newText)
		null
	getImageXml:(rId="1",imageDescription="")->
		return """
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="1905000" cy="1905000"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:docPr id="2" name="Image 2" descr="#{imageDescription}"/>
            <wp:cNvGraphicFramePr>
              <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
            </wp:cNvGraphicFramePr>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="Picture 1" descr="#{imageDescription}"/>
                    <pic:cNvPicPr>
                      <a:picLocks noChangeAspect="1" noChangeArrowheads="1"/>
                    </pic:cNvPicPr>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rId#{rId}">
                      <a:extLst>
                        <a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}">
                          <a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/>
                        </a:ext>
                      </a:extLst>
                    </a:blip>
                    <a:srcRect/>
                    <a:stretch>
                      <a:fillRect/>
                    </a:stretch>
                  </pic:blipFill>
                  <pic:spPr bwMode="auto">
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="1905000" cy="1905000"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect">
                      <a:avLst/>
                    </a:prstGeom>
                    <a:noFill/>
                    <a:ln>
                      <a:noFill/>
                    </a:ln>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
		"""
	getImageXmlCentered:(rId="1")->
		"""
		<w:p>
			<w:pPr>
			<w:jc w:val="center"/>
		  </w:pPr>
		  <w:r>
			<w:rPr/>
			<w:drawing>
			  <wp:inline distT="0" distB="0" distL="0" distR="0">
				<wp:extent cx="1905000" cy="1905000"/>
				<wp:docPr id="15" name="rId6.png"/>
				<a:graphic>
				  <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
					<pic:pic>
					  <pic:nvPicPr>
						<pic:cNvPr id="15" name="rId6.png"/>
						<pic:cNvPicPr/>
					  </pic:nvPicPr>
					  <pic:blipFill>
						<a:blip r:embed="rId#{rId}"/>
						</pic:blipFill>
					  <pic:spPr>
						<a:xfrm>
						  <a:off x="0" y="0"/>
						  <a:ext cx="1905000" cy="1905000"/>
						</a:xfrm>
						<a:prstGeom prst="rect">
						  <a:avLst/>
						</a:prstGeom>
					  </pic:spPr>
					</pic:pic>
				  </a:graphicData>
				  </a:graphic>
				  </wp:inline>
				  </w:drawing>
			</w:r>
		</w:p>
		"""

module.exports=ImageModule
