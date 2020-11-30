import { Identities } from "@arkecosystem/crypto";
import { ARKCrypto, Builders, Transactions } from "@protokol/notarization-crypto";
import { randomBytes } from "crypto";
import { utils } from "ethers";
import { unlinkSync, writeFile as _writeFile, writeFileSync } from "fs";
import supertest from "supertest";

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
import { finalConfig, privKey, testParams } from "./config";

const { url, env } = finalConfig;
const request = supertest(url);
const MAX_PROMISE_TIMEOUT = (9000 * testParams.file_nb) / 150; // there are 150 transactions per block, wait for all of them to be confirmed

function createRandomFile(name, size = 1024, writeFile = true) {
	const data = randomBytes(size);
	const hash = utils.keccak256(data);
	if (writeFile) writeFileSync(name, data);
	return { data, hash };
}

async function checkHash(h) {
	let hash = h;
	if (h.startsWith("0x")) {
		hash = h.substring(2);
	}

	const getData = async (uri) => {
		try {
			const response = await request.get(uri);
			return response.body;
		} catch (error) {
			console.error(error);
			return null;
		}
	};
	return getData(`timestamp/v1/hashes/${hash}`);
}

async function notarizeHash(hsh, nonce, wif) {
	const sgnTx = new Builders.NotarizationBuilder()
		.Notarization({ hash: hsh.replace("0x", "") })
		.nonce(nonce)
		.signWithWif(wif);
	try {
		const response = await request.post("transactions").send({ transactions: [sgnTx.build().toJson()] });
		if (response.status === 200 && response.body.data.accept.length) {
			return true;
		}
		console.error(`error sending hash:${response.status}`);
		console.error(response);
	} catch (error) {
		console.error(`error calling besu auth:${error}`);
	}

	return false;
}

function displayTiming(dur) {
	let duration = dur;
	duration = Math.round(duration);
	if (duration < 1000) {
		return `${duration} ms\n`;
	}
	if (duration < 60000) {
		const s = Math.floor(duration / 1000);
		return `${s}s ${duration - 1000 * s}ms\n`;
	}
	const d = new Date(duration);
	return `${d.getUTCHours()}h ${d.getUTCMinutes()}m ${d.getUTCSeconds()}s ${d.getUTCMilliseconds()}ms \n`;
}

function displayProgress(current, total, step, message) {
	let nextStep = step;
	if (current > step * total) {
		console.warn(`${message}${Math.round(step * 100)}%`);
		nextStep += current / total + 0.05;
	}
	return nextStep;
}

function generateTestHeader(success) {
	let testHeader = "";
	if (success) {
		testHeader = "Testing completed successfully\n\n";
	} else {
		testHeader = "Testing FAILED\n\n";
	}
	testHeader += `Testing Date: ${new Date().toLocaleString("en-Gb")}\n`;
	testHeader += `Testing parameters: ${testParams.file_nb} files of size [${testParams.min_size}-${testParams.max_size}]kb\n`;
	return testHeader;
}

function checkHashes(ans) {
	let result = "";
	let prevDate = 0;
	ans.forEach((r) => {
		if (!r?.timestamp) {
			result = "Error - did not received answer from Timestamp API\n";
		} // check timestamp ordering:
		else {
			const newDate = r.timestamp;
			if (prevDate > newDate) {
				result += "Error - timestamp should be increasing: \n";
			}
			prevDate = newDate;
		}
	});
	return result;
}

async function phase1Scripts(deleteFiles) {
	console.warn("running test scripts for protocol testing phase 1...");
	const height = (await request.get("blockchain")).body.data.block.height;

	ARKCrypto.Managers.configManager.setFromPreset(env);
	ARKCrypto.Managers.configManager.setHeight(Number(height));
	ARKCrypto.Transactions.TransactionRegistry.registerTransactionType(Transactions.NotarizationTransaction);

	const wif = Identities.WIF.fromKeys(Identities.Keys.fromPrivateKey(privKey));
	const address = Identities.Address.fromWIF(wif);

	let testResult = true;
	let testReport = "";
	// 2. generate test files
	const filesList: any[] = [];
	const fileNames: string[] = [];
	let i = 0;
	for (i = 0; i < testParams.file_nb; i += 1) {
		const fsize = testParams.min_size + Math.round(Math.random() * (testParams.max_size - testParams.min_size));
		const fname = new Date().getTime().toString() + i;
		filesList.push(createRandomFile(fname, fsize * 1024));
		fileNames.push(fname);
	}
	// 3. Notarize hashes
	const nonce = Number((await request.get(`wallets/${address}`)).body.data.nonce) + 1;
	let startDate = new Date().getTime();
	let nextStep = 0;
	let results: any = [];
	for (i = 0; i < testParams.file_nb; i += 1) {
		results.push(notarizeHash(filesList[i].hash, nonce + i, wif));
		nextStep = displayProgress(i, testParams.file_nb, nextStep, "processing files...");
	}
	await Promise.all(results);
	let endDate = new Date().getTime();
	const wDuration = endDate - startDate;
	if (wDuration > testParams.time_out) {
		testResult = false;
		testReport += "ERROR - Protocol Writing Time is too big\n";
	}
	// 3.1 Delete files
	if (deleteFiles) {
		for (i = 0; i < testParams.file_nb; i += 1) {
			unlinkSync(fileNames[i]);
		}
	}

	await new Promise((r) => setTimeout(r, MAX_PROMISE_TIMEOUT)); // wait 10 seconds for the ledger to generate the blocks

	// 4. Check records
	startDate = new Date().getTime();
	// let prevDate = new Date(0);
	nextStep = 0;
	results = [];
	for (i = 0; i < testParams.file_nb; i += 1) {
		const res = checkHash(filesList[i].hash);
		results.push(res);
		nextStep = displayProgress(i, testParams.file_nb, nextStep, "processing hashes...");
	}
	const cash = checkHashes(await Promise.all(results));
	if (cash && cash.length > 0) {
		testResult = false;
		testReport += cash;
	}
	endDate = Date.now();
	const rDuration = endDate - startDate;
	if (rDuration > testParams.time_out) {
		testResult = false;
		testReport += "ERROR - Protocol Reading Time is too big\n";
	}

	// 5. Test report
	testReport = generateTestHeader(testResult) + testReport;
	testReport += `Protocol Writing Time (total): ${displayTiming(wDuration)}`;
	testReport += `Protocol Writing Time (average): ${displayTiming(wDuration / testParams.file_nb)}`;
	testReport += `Protocol Reading Time (total): ${displayTiming(rDuration)}`;
	testReport += `Protocol Reading Time (average): ${displayTiming(rDuration / testParams.file_nb)}`;
	_writeFile("testReport.txt", testReport, function ferr2(err) {
		if (err) console.error(err);
	});
}

phase1Scripts(testParams.delete_files);
