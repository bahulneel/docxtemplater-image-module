First module for docxtemplater.

# Installation:

You will need docxtemplater v1: `npm install docxtemplater@beta`

install this module: `npm install docxtemplater-image-module`

# Usage

Your docx should contain the text: `{%image}`

    ImageModule=require(‘docxtemplater-image-module’)

    imageModule=new ImageModule({centered:false})

    docx=new DocxGen()
        .attachModule(imageModule)
        .load(content)
        .setData({image:'examples/image.png'})
        .render()

    buffer= docx
            .getZip()
            .generate({type:"nodebuffer"})

    fs.writeFile("test.docx",buffer);

# Options

 You can center the images using new ImageModule({centered:true}) instead

# Notice

 For the imagereplacer to work, the image tag: `{%image}` need to be in its own `<w:p>`, so that means that you have to put a new line after and before the tag.

# Building

 You can build the coffee into js by running `gulp` (this will watch the directory for changes)

# Testing

You can test that everything works fine using the command `mocha`. This will also create 3 docx files under the root directory that you can open to check if the docx are correct
