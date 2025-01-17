// import path from 'path'

import slugify from 'slugify';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

import {
	getAllSessionFiles,
	getAllSectionsData,
	getContent,
	getCoverUrl
	// writeFile,
} from './utils.mjs';

import constants from './constants.mjs';

import 'dayjs/locale/id.js';
dayjs.extend(customParseFormat);
dayjs.locale('id');

export const parseSessionSection = async (sections) => {
	try {
		const allData = [];

		sections.forEach((ctx) => {
			// exclude template section
			if (!ctx.startsWith('### Template')) {
				const videosRaw = getContent(ctx, constants.REGEX_VIDEO, '- Video:');
				const videos = videosRaw.split(',').map((i) => i.replace('- ', '').trim());
				const date = getContent(ctx, constants.REGEX_DATE, '- Waktu:');
				const time = getContent(ctx, constants.REGEX_TIME, '- Pukul:');
				const speaker = getContent(ctx, constants.REGEX_SPEAKER, '- Pemateri:');
				const slide = getContent(ctx, constants.REGEX_SLIDE, '- Slide:');
				const topic = getContent(ctx, constants.REGEX_TITLE, '### ');
				const register = getContent(ctx, constants.REGEX_REGISTRASI, '- Registrasi:');
				const sesi = getContent(ctx, constants.REGEX_SESI, '- Sesi:');
				const cover = getCoverUrl(sesi);
				const deskripsi = getContent(ctx, constants.REGEX_DESKRIPSI, '- Deskripsi:');
				const kategori = getContent(ctx, constants.REGEX_KATEGORI, '- Kategori:');
				const tags = kategori.split(',').map((i) => i.trim().replace('/', '-').replace(' ', '-'));

				const dateWithoutDay = date.split(',')[1];
				const datetime = `${dateWithoutDay.trim()} ${time.trim()}`;
				const dateTimeObj = dayjs(`${datetime}`, 'D MMMM YYYY HH:mm', 'id')
					.locale('id')
					.format('YYYY-MM-DD HH:mm:ss');

				const slug = slugify(topic, {
					replacement: '-', // replace spaces with replacement character, defaults to `-`
					remove: undefined, // remove characters that match regex, defaults to `undefined`
					lower: true, // convert to lower case, defaults to `false`
					strict: true, // strip special characters except replacement, defaults to `false`
					locale: 'vi', // language code of the locale to use
					trim: true // trim leading and trailing replacement chars, defaults to `true`
				});

				const data = {
					id: sesi,
					date: date,
					time: time,
					dateTime: `${dateTimeObj} +07:00`,
					speaker: speaker,
					slide: slide,
					topic: topic,
					slug: slug,
					videos: videos,
					registrasi: register,
					cover: cover,
					deskripsi: deskripsi,
					tags: tags
				};

				//         let sesiInt = parseInt(sesi);
				//         let sesiWithZero = sesiInt;
				//         if (sesiInt < 10) {
				//           sesiWithZero = `00${sesiInt}`;
				//         } else if (sesiInt < 100) {
				//           sesiWithZero = `0${sesiInt}`;
				//         } else if (sesiInt > 100) {
				//           sesiWithZero = `${sesiInt}`;
				//         }
				//         writeFile(
				//           path.resolve(path.resolve(constants.ROOT_DIR, './data-new'), `${sesiWithZero}-${slug}.md`),
				//           `
				// ### ${topic}

				// - Waktu: ${date}
				// - Pukul: ${time}
				// - Pemateri: ${speaker}
				// - Slide: ${slide}
				// - Video: ${videosRaw}
				// - Registrasi: ${register}
				// - Sesi: ${sesi}
				// - Kategori: ${kategori}
				// - Deskripsi: ${deskripsi}
				//           `
				//         )

				allData.push(data);
			}
		});

		return allData;
	} catch (error) {
		console.error('❌ Error parsing section', error);
		return [];
	}
};

export const parseAllSessions = async () => {
	try {
		const sessions = await getAllSessionFiles();
		let combinedData = [];

		for (const session of sessions) {
			try {
				const sections = await getAllSectionsData(session);
				const allData = await parseSessionSection(sections);
				combinedData = [...combinedData, ...allData];
			} catch (error) {
				console.error(`❌ Error parsing file ${session}`, error);
			}
		}

		combinedData = combinedData.sort(function (a, b) {
			// Turn your strings into dates, and then subtract them
			// to get a value that is either negative, positive, or zero.
			return b.id - a.id;
		});

		return combinedData;
	} catch (error) {
		console.error('❌ Error parsing section', error);
		return [];
	}
};
