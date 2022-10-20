import fs from "fs";
import pool from "../dbconfig/dbConnector";

const distance = require('jaro-winkler');

type IN = {
    "companyid": string,
    "crdocumentid": string,
    "id": string,
    "documentnumber": string,
    originalNumber?: string
}

type TRX = {
    company_id: string,
    description: string
}

export async function search() {
    let raw = fs.readFileSync('document-number-data.json');
    let invoiceNumbers: IN[] = JSON.parse(Buffer.from(raw).toString());

    invoiceNumbers = preprocessInvoiceNumbers(invoiceNumbers)

    // const groups = groupInvNumbers(invoiceNumbers)

    const client = await pool.connect();
    const sql1 = `SELECT description, substring(osome_link, 'companies\\/(\\d+)\\/documents') as company_id
                  FROM "MY_TABLE" t
                  order by company_id`;
    const {rows: trxs} = await client.query(sql1) as { rows: TRX[] };
    client.release();

    const map = new Map<string, { invs: IN[], trxs: string[] }>()

    for (const {company_id, description} of trxs) {
        if (!map.has(company_id)) {
            map.set(company_id, {invs: [], trxs: []})
        }
        const v = map.get(company_id)!
        v.trxs.push(description)
    }

    for (const {companyid, id, crdocumentid, documentnumber, originalNumber} of invoiceNumbers) {
        if (!map.has(companyid)) {
            map.set(companyid, {invs: [], trxs: []})
        }
        const v = map.get(companyid)!
        v.invs.push({companyid, id, crdocumentid, documentnumber, originalNumber})
    }

    let totalMatches = 0, totalMatchesCleaned = 0, totalMatchesOriginal = 0;
    let totalQueries = 0, companies = 0;
    let totalResult: {query: string, matches: any}[] = []
    for (const [key, value] of map.entries()) {
        if (value.invs.length > 0 && value.trxs.length > 0) {
            const {queries, matches, resultCleaned, resultOriginal, matchesOriginal, matchesCleaned } = processCompany(key, value.invs, value.trxs)
            companies++
            totalQueries += queries
            totalMatches += matches
            totalMatchesOriginal += matchesOriginal
            totalMatchesCleaned += matchesCleaned
            totalResult = totalResult.concat(resultOriginal)
        }
    }

    return {companies, totalQueries, totalMatchesOriginal, totalMatchesCleaned, totalMatches, totalResult}
}

function preprocessInvoiceNumbers(invoiceNumbers: IN[]) {
    const set = new Set<string>()
    invoiceNumbers = invoiceNumbers
        .filter(({documentnumber}) =>
            documentnumber.match(/\d+/gi) &&
            documentnumber.replace(/\D*/gi, '').length >= 5
        )
        .map((item) => ({
            ...item,
            originalNumber: item.documentnumber,
            documentnumber: item.documentnumber
                // (Director's personal account)
                .replace(/-?\(?No supporting (documents?)?\)?|\(.*\)|inv[\-\s]?|ref/gi, '')
                // .replace(/\d/g, "*")
                .toLowerCase()
                .trim()
        }))
        .filter(({documentnumber}) => {
            if (!documentnumber ||
                documentnumber.match(/\d{4}\-(0[1-9]|1[012])(\-(0[1-9]|[12][0-9]|3[01]))?/gi) ||
                documentnumber.length < 5) {
                return false
            }
            if (set.has(documentnumber)) {
                return false
            } else {
                set.add(documentnumber)
                return true
            }
        })
    invoiceNumbers.sort((a, b) => Number(a.companyid) - Number(b.companyid))

    return invoiceNumbers
}

function processCompany(companyId: string, invoiceNumbers: IN[], descriptionsRows: string[]) {
    // console.log('start', companyId)

    const AhoCorasick = require('aho-corasick-node');
    const builder = AhoCorasick.builder();
    const builder2 = AhoCorasick.builder();
    for (const {documentnumber, originalNumber} of invoiceNumbers) {
        builder.add(documentnumber.toLowerCase())
        builder2.add(originalNumber!.toLowerCase(),)
    }
    const ac = builder.build();
    const ac2 = builder2.build();

    const queries = descriptionsRows
        .map((description) => description.toLowerCase())
        .filter(str => str && str.length > 0);

    let countCleaned = 0
    let countOriginal = 0
    let countBoth = 0
    const resultCleaned = [], resultOriginal = [], resultBoth = []
    for (const query of queries) {
        const matchesCleaned = ac.match(query);
        const matchesOriginal = ac2.match(query);
        if (matchesCleaned.length > 0 && matchesOriginal.length === 0) {
            countCleaned++
            resultCleaned.push({query, matches: matchesCleaned})
        }
        if (matchesOriginal.length > 0 && matchesCleaned.length === 0) {
            countOriginal++
            resultOriginal.push({query, matches: matchesOriginal})
        }
        if (matchesOriginal.length > 0 && matchesCleaned.length > 0) {
            countBoth++
            resultBoth.push({query, matches: []})
        }
    }

    // console.log('end', companyId)

    return {
        queries: queries.length,
        matches: countBoth,
        matchesCleaned: countCleaned,
        matchesOriginal: countOriginal,
        resultOriginal, resultCleaned, resultBoth
    }
}

function groupInvNumbers(invs: IN[]) {
    let i = 0
    const color = Array.from({length: invs.length}, () => -1)
    const map = new Map<number, number[]>()
    for (; i < invs.length; i++) {
        if (color[i] === -1) {
            color[i] = i
            map.set(i, [i])
        }
        for (let j = i + 1; j < invs.length; j++) {
            const dist = Number(invs[i].documentnumber.length === invs[j].documentnumber.length) *
                distance(invs[i].documentnumber, invs[j].documentnumber, {caseSensitive: false})
            if (dist >= 0.99) {
                color[j] = color[i]
                map.set(i, [...map.get(color[i])!, j])
            }
        }
    }
    const pairs = []
    for (const [key, value] of map.entries()) {
        pairs.push({key, values: value.map((i) => invs[i].documentnumber), length: value.length})
    }
    pairs.sort((a, b) => b.length - a.length)

    return pairs
}

// const noChanges = {
//     "companies": 1738,
//     "totalQueries": 455360,
//     "totalMatches": 5536
// }
//
// const onlyAlphaNumeric = {
//     "companies": 1738,
//     "totalQueries": 455360,
//     "totalMatches": 4674
// }
//
// const both = {
//     "companies": 1738,
//     "totalQueries": 455360,
//     "totalMatches": 5795
// }

// const noChanges = {
//     "companies": 1728,
//     "totalQueries": 450684,
//     "totalMatches": 3379
// }
// const cleaned = {
//     "companies": 1728,
//     "totalQueries": 450684,
//     "totalMatches": 4291
// }
// const both = {
//     "companies": 1728,
//     "totalQueries": 450684,
//     "totalMatches": 4307
// }
