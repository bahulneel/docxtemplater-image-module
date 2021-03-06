SubContent=require('docxtemplater').SubContent
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
	replaceBy:(text,outsideElement)->
		xmlTemplater=@manager.getInstance('xmlTemplater')
		templaterState=@manager.getInstance('templaterState')
		subContent=new SubContent(xmlTemplater.content)
			.getInnerTag(templaterState)
			.getOuterXml(outsideElement)
		xmlTemplater.replaceXml(subContent,text)
	convertPixelsToEmus:(pixel)->
		Math.round(pixel * 9525)
	getSizeFromData:(imgData)->
		[150,150]
	getImageFromData:(imgData)->
		fs.readFileSync(imgData)
	handle:(type,data)->
		if type=='replaceTag' and data=='image'
			scopeManager=@manager.getInstance('scopeManager')
			templaterState=@manager.getInstance('templaterState')

			tag = templaterState.textInsideTag.substr(1)
			imgData=scopeManager.getValueFromScope(tag)

			if imgData=='undefined' then return @replaceBy('<w:t></w:t>','w:t')
			try
				imgBuffer=@getImageFromData(imgData)
			catch e
				return @replaceBy('<w:t></w:t>','w:t')
			rId=@imgManager
				.loadImageRels()
				.addImageRels(@getNextImageName(),imgBuffer)

			sizePixel=@getSizeFromData(imgBuffer)
			size=[@convertPixelsToEmus(sizePixel[0]),@convertPixelsToEmus(sizePixel[1])]

			if @options.centered==false
				outsideElement='w:t'
				newText=@getImageXml(rId,size)
			if @options.centered==true
				outsideElement='w:p'
				newText=@getImageXmlCentered(rId,size)

			@replaceBy(newText,outsideElement)
		null
	getImageXml:(rId,size)->
		return """
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="#{size[0]}" cy="#{size[1]}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:docPr id="2" name="Image 2" descr="image"/>
            <wp:cNvGraphicFramePr>
              <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
            </wp:cNvGraphicFramePr>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="Picture 1" descr="image"/>
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
                      <a:ext cx="#{size[0]}" cy="#{size[1]}"/>
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
	getImageXmlCentered:(rId,size)->
		"""
		<w:p>
		  <w:pPr>
			<w:jc w:val="center"/>
		  </w:pPr>
		  <w:r>
			<w:rPr/>
			<w:drawing>
			  <wp:inline distT="0" distB="0" distL="0" distR="0">
				<wp:extent cx="#{size[0]}" cy="#{size[1]}"/>
				<wp:docPr id="0" name="Picture" descr=""/>
				<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
				  <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
					<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
					  <pic:nvPicPr>
						<pic:cNvPr id="0" name="Picture" descr=""/>
						<pic:cNvPicPr>
						  <a:picLocks noChangeAspect="1" noChangeArrowheads="1"/>
						</pic:cNvPicPr>
					  </pic:nvPicPr>
					  <pic:blipFill>
						<a:blip r:embed="rId#{rId}"/>
						<a:stretch>
						  <a:fillRect/>
						</a:stretch>
					  </pic:blipFill>
					  <pic:spPr bwMode="auto">
						<a:xfrm>
						  <a:off x="0" y="0"/>
						  <a:ext cx="#{size[0]}" cy="#{size[1]}"/>
						</a:xfrm>
						<a:prstGeom prst="rect">
						  <a:avLst/>
						</a:prstGeom>
						<a:noFill/>
						<a:ln w="9525">
						  <a:noFill/>
						  <a:miter lim="800000"/>
						  <a:headEnd/>
						  <a:tailEnd/>
						</a:ln>
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
