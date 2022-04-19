import { writeFileSync } from 'fs'
import {PoolClient} from "pg";
const converter = require('json-2-csv');

export function getMostFrequentWords(str: string) {
    return `|${str}|`
        .replace(/[:=,]+/g, ' ')
        .split(/(\s+|\|)/)
        .filter((s) =>
            s !== '|' &&
            !s.match(/\s+/) &&
            s.length >= 4 &&
            !s.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g) &&
            !isNumeric(s) &&
            !s.startsWith('S$') &&
            !s.startsWith('$') &&
            s !== 'SGD' && s !== 'USD' && s != 'HKD')
}

export async function getTopPatterns(client: PoolClient, bankNames: string[], transactionCodes: string[], commands: string[]) {
    const sql = `SELECT * FROM "MY_TABLE" where bankname in ('${bankNames.join("', '")}')`

    const {rows} = await client.query(sql);

    client.release();

    const topWordsMap = new Map<string, number>()

    for (const {description} of rows) {
        const words = getMostFrequentWords(description)
        for (const w of words) {
            if (!topWordsMap.has(w)) {
                topWordsMap.set(w, 0)
            }
            const cnt = topWordsMap.get(w)!
            topWordsMap.set(w, cnt + 1)
        }
    }

    const pairs = []
    for (const [key, value] of topWordsMap.entries()) {
        pairs.push({key, value})
    }
    pairs.sort((a, b) => b.value - a.value)

    const topWords = pairs
        .filter(({key}) => key !== 'xxxx')
        .slice(0, 300).map((p) => {
            const nw = []
            for (const c of p.key) {
                if (!c.match(/\w+/)) {
                    nw.push(`\\${c}`)
                } else {
                    nw.push(c)
                }
            }
            return nw.join('')
        })

    console.log(JSON.stringify(topWords))

    commands = [...commands]

    // const result: any[] = []
    const map: Map<string, number> = new Map<string, number>()
    const examples: Map<string, any[]> = new Map<string, any[]>()
    const totalRows = rows.length

    let index = 0
    for (const {description: originalDescription, document_id, osome_link, amount} of rows) {
        const description = originalDescription.replace(/\n/g, ' ')

        const matchedCodes = []
        for (const code of transactionCodes) {
            const result = description.match(new RegExp(code), 'i')
            if (result) {
                matchedCodes.push(code)
            }
        }
        const matchedCommands = []
        for (const command of commands) {
            const result = description.match(new RegExp(command), 'i')
            if (result) {
                matchedCommands.push(command)
            }
        }
        const K = Math.min(matchedCommands.length + matchedCodes.length, 4)
        const patterns = genPatterns(matchedCodes, matchedCommands, K)

        let topMatch: {regExp: RegExp, w: number} | undefined = undefined
        for (const {regExp, w} of patterns) {
            const result = description.match(regExp, 'i')
            if (result) {
                if (!topMatch || topMatch.regExp.source.length < regExp.source.length || topMatch.regExp.source.length === regExp.source.length && topMatch.w > w) {
                    topMatch = {regExp, w}
                }
            }
        }

        if (topMatch) {
            // result.push({description, topMatch: { regExp: topMatch.regExp.source, w: topMatch.w }, matchedCodes, matchedCommands})
            const pattern = topMatch.regExp.source

            const currentCounter = map.get(pattern) ?? 0
            map.set(pattern, currentCounter + 1)

            if (!examples.has(pattern)) {
                examples.set(pattern, [])
            }
            const examplesList = examples.get(pattern)!
            if (examplesList.length < 10) {
                examplesList.push({
                    description,
                    amount,
                    link: osome_link,
                    document_id,
                })
                examples.set(pattern, examplesList)
            }
        }

        index++
    }

    const topPatterns = []
    let coveredRows = 0
    for (const [pattern, counter] of map.entries()) {
        if (counter >= totalRows / 500) {
            coveredRows += counter
            topPatterns.push({
                pattern: pattern.replace(/\.\*/g, ' '),
                regExp: pattern,
                counter,
                type: '',
                examples: examples.get(pattern)
            })
        }
    }
    topPatterns.sort((a, b) => b.counter - a.counter)

    return {totalRows, topPatterns, coveredRows}
}

export function toCSV(topPatterns: any[], path: string) {
    const patternsRows = topPatterns.reduce((prev, current) => {
        if (current.examples) {
            for (const example of current.examples) {

                // console.log(`      INSERT INTO public."bankTransactionTemplates" ("deletedAt",
                //                                                                   "bankContactId", "transactionTypeRegExp", "transactionType")
                //                    VALUES (null, 54, '${current.regExp}', '');`)

                prev.push({ pattern: current.pattern, regExp: current.regExp, ...example})
            }
        }
        return prev
    }, [] as any[])
    return new Promise((resolve, reject) => {
        converter.json2csv(patternsRows, (err: any, csv: any) => {
            if (err) {
                reject(err)
            }
            // write CSV to a file
            writeFileSync(path, csv);
            resolve(csv)
        });
    })
}

// private

function isNumeric(value: any) {
    return /^-?\d+$/.test(value);
}

function genPatterns(codes: string[], commands: string[], K: number) {
    const result: {regExp: RegExp, w: number}[] = []
    for (let totalLen = 1; totalLen <= K; totalLen++) {
        if (codes.length === 0) {
            iter({
                code: '',
                commands,
                arr: result,
                words: [],
                codeUsed: true,
                len: 0,
                totalLen
            })
        }
        for (const code of codes) {
            iter({
                code,
                commands,
                arr: result,
                words: [],
                codeUsed: false,
                len: 0,
                totalLen
            })
        }
    }
    return result
}

function iter(
    { code, commands, arr, words, codeUsed, len, totalLen
    }: { code: string, commands: string[], arr: {regExp: RegExp, w: number}[], words: string[], codeUsed: boolean, len: number, totalLen: number }
) {
    if (len === totalLen) {
        arr.push({ regExp: new RegExp(`${words.join('.*')}`), w: len })
        return
    }
    if (!codeUsed) {
        iter({
            code,
            commands,
            arr,
            words: [...words, code],
            codeUsed: true,
            len: len + 1,
            totalLen
        })
    }
    for (const command of commands) {
        if (!words.includes(command)) {
            iter({
                code,
                commands,
                arr,
                words: [...words, command],
                codeUsed,
                len: len + 1,
                totalLen
            })
        }
    }
}