#!/usr/bin/env node
'use strict';
const os = require('os');
const fs = require('fs');
const dns = require('dns');
const https = require('follow-redirects').https;
const fse = require('fs-extra');
const got = require('got');
const ora = require('ora');
const logUpdate = require('log-update');
const chalk = require('chalk');
const isURL = require('is-url');
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

updateNotifier({pkg}).notify();

const spinner = ora();

const fallArg = process.argv[2];
const pre = chalk.red('✘');
const getIn = `${os.homedir()}/Smule/`;

if (!fallArg || fallArg === '-h' || fallArg === '--help') {
	console.log(`
 ${chalk.cyan('Usage')}   : smule <source>

 ${chalk.cyan('Command')} :
  -v, --version     :  show version
  -f, --fun         :  no spoiler
  -h, --help        :  for help

 ${chalk.cyan('Example')} :
  $ smule <source>  :  auto detect the filetype and download
`);
	process.exit(1);
}

if (fallArg === '-v' || fallArg === '--version') {
	console.log(`\n${chalk.cyan(' Current version ')} :  ${pkg.version}\n`);
	process.exit(1);
}

if (fallArg === '-f' || fallArg === '--fun') {
	console.log(`\n “How do I have productive days with minimum drama? \n  Simple; I mind my own business.” \n`);
	process.exit(1);
}

// Functions, because I'm planning to add few more features.

const detectFile = arg => {
	return arg.split(`twitter:player:stream:content_type" content="`)[1].split('">')[0].replace('/mp4', '');
};

const detectMediaSource = arg => {
	return arg.split(`twitter:player:stream" content="`)[1].split('">')[0];
};

const decodeMediaScript = source => {
	return source.replace(/amp;/g, '');
};

const songName = arg => {
	return arg.split('/')[4];
};

if (isURL(fallArg) === true) {
	dns.lookup('smule.com', err => {
		if (err) {
			logUpdate(`\n ${pre} ${chalk.dim('Please check your internet connection\n')}`);
			process.exit(1);
		} else {
			logUpdate();
			spinner.text = `${chalk.dim('Smuling...')}`;
			spinner.start();
			got(fallArg).then(res => {
				const $ = res.body;
				const mediaType = detectFile($);
				const mediaSource = detectMediaSource($);
				const fetchMainSource = decodeMediaScript(mediaSource);
				logUpdate();
				spinner.text = chalk.dim('Fetching downloadable link');

				fse.ensureDir(getIn, err => {
					if (err) {
						process.exit(1);
					}
				});

				let saveMedia;
				if (mediaType === 'audio') {
					saveMedia = fs.createWriteStream(getIn + `${(songName(fallArg))}.m4a`);
				} else {
					saveMedia = fs.createWriteStream(getIn + `${(songName(fallArg))}.mp4`);
				}

				https.get(fetchMainSource, (res, cb) => {
					logUpdate();
					spinner.text = chalk.dim(`Downloading ${mediaType}. Please wait...`);
					res.pipe(saveMedia);

					saveMedia.on('finish', () => {
						spinner.stop();
						logUpdate(`\n ${chalk.green('✔')} Downloading finished! \n`);
						saveMedia.close(cb);
					});
				});
			}).catch(err => {
				if (err) {
					process.exit(1);
				}
			});
		}
	});
} else {
	logUpdate(`\n ${pre} ${chalk.dim('Please enter a valid URL.')} \n`);
	process.exit(1);
}
