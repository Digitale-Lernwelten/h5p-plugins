/* eslint-disable no-await-in-loop */
const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');

const log = (plugin, ...message) => {
	console.log(`[Release][${plugin}]::`, ...message);
};

(async () => {
	const dirEntries = await fs.readdir('./plugins');
	await fs.ensureDir('./output');

	log('Core', `bundling ${dirEntries.length} plugins`);

	for (const plugin of dirEntries) {
		try {
			log(plugin, 'start bundling');
			const targetFile = `${plugin}.h5p`;
			const outputPath = path.join('./output', targetFile);
			log(plugin, `bundling to ${outputPath}`);
			const output = fs.createWriteStream(outputPath);
			const archive = archiver('zip', {zlib: {level: 9}});

			archive.on('error', err => {
				throw err;
			});

			const pluginDir = path.join('./plugins', plugin);
			const libFilePath = path.join('./plugins', plugin, 'library.json');
			const libFile = await fs.readJSON(libFilePath);
			const {machineName, title, majorVersion, minorVersion} = libFile;

			const h5p = {
				mainLibrary: machineName,
				title,
				language: 'de',
				preloadedDependencies: [
					{
						machineName,
						majorVersion,
						minorVersion,
					},
				],
				// license,
				// licenseExtras: MIT_LICENSE,
				embedTypes: ['div', 'iframe'],
				runnable: 1,
			};
			archive.pipe(output);
			const h5pJson = Buffer.from(JSON.stringify(h5p));
			archive.append(h5pJson, {name: 'h5p.json'});
			log(plugin, 'added h5p.json');
			archive.directory(pluginDir, machineName);
			log(plugin, 'added plugin files');
			const contentJson = Buffer.from(JSON.stringify({}));
			archive.append(contentJson, {name: 'content/content.json'});
			log(plugin, 'added dummy content file');
			await archive.finalize();
			log(plugin, `finished bundling (${archive.pointer()} bytes)`);
		} catch (e) {
			console.error(`failed to bundle: ${plugin}. ${e}`);
		}
	}
})();

const MIT_LICENSE = `
MIT License

Copyright (c) 2022 Digitale Lernwelten

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
