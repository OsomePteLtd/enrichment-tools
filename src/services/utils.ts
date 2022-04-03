import { writeFileSync } from 'fs'
const converter = require('json-2-csv');

export function toCSV(topPatterns: any[], path: string) {
    const patternsRows = topPatterns.reduce((prev, current) => {
        if (current.examples) {
            for (const example of current.examples) {

                console.log(`      INSERT INTO public."bankTransactionTemplates" ("deletedAt",
                                                                                  "bankContactId", "transactionTypeRegExp", "transactionType")
                                   VALUES (null, 75, '${current.regExp}', '');`)

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

export function genPatterns(codes: string[], commands: string[], K: number) {
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