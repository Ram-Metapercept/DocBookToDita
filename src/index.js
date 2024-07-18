const path = require("path");
const fs = require('fs-extra');
const util = require("util");
const xml2js = require('xml2js');
const readdirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);
// const outputDirName = "../output/";
const convertDocBookToDITA = async (filePath) => {
    const outputId = Math.random().toString(36).substring(7);
    const OutputPath = path.join(__dirname,"..","output", outputId).replace(/\\/g, '/');
    if(!fs.existsSync(OutputPath)){
        fs.mkdirSync(OutputPath);

    }

//   try {
    // const data = await readFileAsync(filePath);
    // let xmlString = data.toString();
    
//     xml2js.parseString(xmlString, (err, result) => {
//       if (err) {
//         console.error('Error parsing XML:', err);
//         return;
//       }

//       const chapter = result?.book?.chapter;
//       if (!chapter) {
//         console.error('No chapters found in XML.');
//         return;
//       }

//       const chapterIds = chapter.map(ch => ch.$.id);
//       const chapterTitles = chapter.map(ch => ch?.chapterinfo[0]?.title[0]?._);

//       chapter.forEach((ch, index) => {
//         const chapterId = chapterIds[index];
//         const chapterTitle = chapterTitles[index];

//         const ditaMap = `<?xml version="1.0" encoding="UTF-8"?>
// <!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
// <map>
//   <title>${chapterTitle}</title>
//   <topicref href="${chapterId}.dita"/>
// </map>`;

//         const sections = ch?.section || [];
//         let ditaFile = `<?xml version="1.0" encoding="UTF-8"?>
// <!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
// <topic id="${chapterId}">
//   <title>${chapterTitle}</title>`;

//         sections.forEach(section => {
//           const sectionId = section.$.id;
//           const sectionTitle = section?.sectioninfo[0]?.title[0]?._;

//           ditaFile += `
//   <section id="${sectionId}">
//     <title>${sectionTitle}</title>`;

//           const paragraphs = section.para || [];
//           paragraphs.forEach(para => {
//             ditaFile += `
//     <p>${para._}</p>`;
//           });

//           ditaFile += `
//   </section>`;
//         });

//         ditaFile += `
// </topic>`;

//         fs.writeFileSync(`${OutputPath}/${chapterId}.ditamap`, ditaMap);
//         fs.writeFileSync(`${OutputPath}/${chapterId}.dita`, ditaFile);

//         console.log('DITA map and DITA file created successfully for chapter:', chapterId);
      
//       });
 
//     });
//       const downloadLink = `http://localhost:8000/api/download/${outputId}`;
//        return {outputId,downloadLink}
//   } catch (err) {
//     console.error('Error:', err);
//   }

const parser = new xml2js.Parser({ explicitArray: false });
try {
     const data = await readFileAsync(filePath);
    let xmlString = data.toString();
  const xmlData = await parser.parseStringPromise(xmlString);

  // Process the book tag
  const bookId = xmlData.book.$.id;
  const bookDir = `./${bookId}`;
  await fs.ensureDir(bookDir);
// let a=path.basename(bookDir)
// let b=path.join(a,bookDir)
// if(!fs.existsSync(b)){
//   fs.mkdirSync(b)
// }

  // Generate DITA and DITAMAP files for the book
  await generateFiles(bookDir, bookId, 'book', xmlData.book);

  // Process each chapter
  if (xmlData.book.chapter) {
      const chapters = Array.isArray(xmlData.book.chapter) ? xmlData.book.chapter : [xmlData.book.chapter];
      for (const chapter of chapters) {
          const chapterId = chapter.$.id;
          const chapterDir = `${bookDir}/${chapterId}`;
          await fs.ensureDir(chapterDir);

          await generateFiles(chapterDir, chapterId, 'chapter', chapter);

          // Process each section in the chapter
          if (chapter.section) {
              const sections = Array.isArray(chapter.section) ? chapter.section : [chapter.section];
              for (const section of sections) {
                  const sectionId = section.$.id;
                  const sectionDir = `${chapterDir}/${sectionId}`;
                  await fs.ensureDir(sectionDir);
                  
                  // Generate DITA and DITAMAP files for the section
                  await generateFiles(sectionDir, sectionId, 'section', section);
              }
          }
      }
  }
  return "a"
} catch (err) {
  console.error('Error processing XML:', err);
}
}

module.exports = convertDocBookToDITA;

async function generateFiles(dir, id, type, content) {

  const ditaContent = generateDITAContent(id, type, content);
  const ditamapContent = generateDITAMapContent(id, type);
 


  if(type=="book"){
    await fs.writeFile(`${dir}/${id}.dita`, ditaContent, 'utf8');
    await fs.writeFile(`${dir}/${id}.ditamap`, ditamapContent, 'utf8');
  }else{
    if(!fs.existsSync(`../${dir}`)){
      fs.mkdirSync(`../${dir}`);
    }
    await fs.writeFile(`../${dir}/${id}.dita`, ditaContent, 'utf8');
    await fs.writeFile(`../${dir}/${id}.ditamap`, ditamapContent, 'utf8');
  }
 
}



function generateDITAContent(id, type, content) {
 
  const builder = new xml2js.Builder({ headless: true, renderOpts: { 'pretty': true } });
  const xmlOutput = builder.buildObject(content);
  return xmlOutput;


}

function generateDITAMapContent(id, type) {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE aicpa-map
PUBLIC "-//PWC//DTD DITA AICPA Map//EN" "aicpa-map.dtd">
<aicpa-map id="${id}">
 <topicref href="${id}.dita" format="dita" navtitle="${id}"/>
</aicpa-map>`;
}
