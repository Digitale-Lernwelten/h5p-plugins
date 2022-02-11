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
				embedTypes: ['div', 'iframe'],
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
