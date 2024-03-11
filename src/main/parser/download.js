const path = require('path');

const fs = require('fs');
const {
  createDir,
  checkJSON,
  getData,
  addLinkWithError,
  errorText,
} = require('./functions');
const { default: axios } = require('axios');

const downloadFile = async (SKU, imageLink, downloadFolder, folder, i) => {
  // Get the file name
  const fileName = `${SKU}__${i}${path.extname(imageLink)}`;

  // The path of the downloaded file on our machine
  const localFilePath = path.resolve(__dirname, downloadFolder, fileName);

  try {
    const response = await axios({
      method: 'GET',
      url: imageLink,
      responseType: 'stream',
    });

    const w = response.data.pipe(fs.createWriteStream(localFilePath));

    w.on('finish', () => {
      console.log(`Successfully downloaded file ${fileName}!`);
    });
  } catch (err) {
    console.error(errorText('downloadFileError', err, imageLink));
    addLinkWithError(imageLink, `${folder}/downloadLinksWithError.json`);
  }
  return localFilePath;
};

const getCatalog = async (catalogPath) => {
  try {
    const catalog = JSON.parse(await fs.promises.readFile(catalogPath));
    return catalog;
  } catch (error) {
    console.log('getcatalog error', error);
    return;
  }
};

const downloadAll = async (catalogFolder, downloadFolder) => {
  const catalog = await getCatalog(`${catalogFolder}/catalog.json`);
  let i = 1;

  for (const item of catalog) {
    const SKU = item['Артикул'];
    const images = item['Оригинальные изображения'];
    let g = 1;
    const downloadedLinksPath = `${catalogFolder}/downloadedLinks.json`;
    const isDownloadedLinks = await checkJSON(downloadedLinksPath);
    let downloadedLinks = [];
    if (!isDownloadedLinks) {
      try {
        await fs.promises.writeFile(downloadedLinksPath, JSON.stringify([]));
      } catch (error) {
        console.log('error wth write downloadedLinks', error);
      }
    } else {
      downloadedLinks = await getData(downloadedLinksPath);
    }

    if (downloadedLinks.includes(SKU)) {
      i++;
      continue;
    }

    const downloadPath = `${downloadFolder}`;

    await createDir(
      downloadPath,
      `${catalogFolder}/downloadLinksWithError.json`,
    );

    for (const imageLink of images) {
      try {
        await downloadFile(SKU, imageLink, downloadPath, catalogFolder, g);
        console.log(
          `Товар ${i} из ${catalog.length}\n Файл ${g} из ${images.length}`,
        );
        g++;
      } catch (error) {
        addLinkWithError(
          imageLink,
          `${catalogFolder}/downloadLinksWithError.json`,
        );
        console.error(errorText(error));
      }
    }

    await fs.promises.writeFile(
      downloadedLinksPath,
      JSON.stringify([...downloadedLinks, SKU]),
    );
    i++;
  }
};

const startDownloading = async (pathToCatalogFolder, pathToDownloadCatalog) => {
  console.log('start download');
  await downloadAll(pathToCatalogFolder, pathToDownloadCatalog);
  console.log('stop downloading');
};

module.exports = {
  startDownloading,
};
