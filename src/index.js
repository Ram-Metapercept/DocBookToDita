const path = require("path");
const fs = require('fs-extra');
const util = require("util");
const xml2js = require('xml2js');
const removeUnwantedElement=require('./utils/RemoveUnwantedElement');
const readdirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);

const convertDocBookToDITA = async (filePath) => {
  const outputId = Math.random().toString(36).substring(7);
  const outputPath = path.join(__dirname, "..", "output", outputId).replace(/\\/g, '/');

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  const parser = new xml2js.Parser({ explicitArray: false });

  try {
    const data = await readFileAsync(filePath);
    let xmlString = data.toString();
    console.log(xmlString);
    const xmlData = await parser.parseStringPromise(xmlString);
    const bookId = xmlData.book.$.id;
    const bookDir = path.join(outputPath, bookId);
    await fs.ensureDir(bookDir);

    await generateFiles(bookDir, bookId, 'book', xmlData.book);
    removeUnwantedElement(xmlData)

    if (xmlData.book.chapter) {
      const chapters = Array.isArray(xmlData.book.chapter) ? xmlData.book.chapter : [xmlData.book.chapter];
      for (const chapter of chapters) {
        const chapterId = chapter.$.id;
        const chapterDir = path.join(bookDir, chapterId);
        await fs.ensureDir(chapterDir);

        await generateFiles(chapterDir, chapterId, 'chapter', chapter);

        if (chapter.section) {
          await processSections(chapter.section, chapterDir);
        }
      }
    }

    const downloadLink = `http://localhost:8000/api/download/${outputId}`;
    return { outputId, downloadLink };

  } catch (err) {
    console.error('Error processing XML:', err);
  }
};

module.exports = convertDocBookToDITA;

async function processSections(sections, parentDir) {
  sections = Array.isArray(sections) ? sections : [sections];
  for (const section of sections) {
    const sectionId = section.$.id;
    const sectionDir = path.join(parentDir, sectionId);
    await fs.ensureDir(sectionDir);

    await generateFiles(sectionDir, sectionId, 'section', section);

    if (section.section) {
      await processSections(section.section, sectionDir);
    }
  }
}

async function generateFiles(dir, id, type, content) {
  const ditaContent = generateDITAContent(id, type, content);
  const ditamapContent = generateDITAMapContent(id, type);

  await fs.writeFile(path.join(dir, `${id}.dita`), ditaContent, 'utf8');
  await fs.writeFile(path.join(dir, `${id}.ditamap`), ditamapContent, 'utf8');
}

function generateDITAContent(id, type, content) {
  const builder = new xml2js.Builder({ headless: true, renderOpts: { 'pretty': true } });
  return builder.buildObject(content);
}

function generateDITAMapContent(id, type) {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE aicpa-map
PUBLIC "-//PWC//DTD DITA AICPA Map//EN" "aicpa-map.dtd">
<aicpa-map id="${id}">
 <topicref href="${id}.dita" format="dita" navtitle="${id}"/>
</aicpa-map>`;
}



