import {PoolClient} from "pg";
import pool from "../dbconfig/dbConnector";
import axios from 'axios';

export async function coverageByNER() {
    const client = await pool.connect();

    const sql = `
        SELECT 
            document_id, bankname, description
        FROM 
            "MY_TABLE" t 
        ORDER BY 
            document_id DESC
        `;
    const {rows} = await client.query(sql);

    const totalCount = rows.length
    let processedCount = 0
    let createdCount = 0
    let errorCount = 0

    const start = new Date().valueOf()

    const interval = setInterval(() => {
        console.log('[TICK]')
        console.log('time', ((new Date().valueOf() - start) / 1000).toFixed(0))
        console.log('processedCount', processedCount)
        console.log('createdCount', createdCount)
        console.log('errorCount', errorCount)
    }, 30 * 1000)

    const K = 20
    for (let i = 0; i + K <= totalCount; i += K) {
        const promises = rows.slice(i, i + K).map((row) => processOneRow(client, row))
        const results = await Promise.all(promises)
        for (const {isCreated, error, row} of results) {
            processedCount += 1
            createdCount += isCreated ? 1 : 0
            errorCount += error ? 1 : 0
            if (error && !(error as Error).message.startsWith('duplicate key')) {
                console.log('ERROR:', (error as Error).message, row)
            }
        }
    }

    client.release();
    clearInterval(interval)

    return {
        totalCount,
        processedCount,
        createdCount,
        errorCount
    }
}

export async function processBatch(descriptions: string[]) {
    for (const description of descriptions) {
        const entities = await getResponseFromNER(description)
        entities.sort((a, b) => b.score - a.score)
        const res = entities
            // .filter(({entity_group}) => entity_group === 'PER' || entity_group === 'ORG')
            .map(({word, score,entity_group}) => ({type: entity_group, word, score}))
        console.log(JSON.stringify(res))
    }
}

type NerEntity = {
    entity_group: string
    score: number
    word: string
    start: number
    end: number
}

async function processOneRow(client: PoolClient, {
    bankname,
    document_id,
    description
}: { bankname: string, document_id: number, description: string }) {
    try {
        const savedResponse = await getSavedResponse(client, document_id, description)
        const result = savedResponse && savedResponse.response ? savedResponse.response : await getResponseFromNER(description)
        await saveNERResponse(client, bankname, document_id, description, result)
        return {isCreated: true}
    } catch (err) {
        return {error: err, row: {bankname, document_id, description}}
    }
}

async function getResponseFromNER(description: string) {
    const url = `http://localhost/invocations`
    const {data} = await axios.post(url, {
        text: description,
    })
    if (data === '[]' || Array.isArray(data) && data.length === 0) {
        return []
    }

    // const dataToParse = data.replace(/\'[\,\}\]]/g, '"')
    // // console.log('dataToParse', dataToParse)
    // if (!dataToParse) {
    //     throw new Error('dataToParse is empty')
    // }
    // const parsed = JSON.parse(dataToParse)

    const myObject = (0, eval)('(' + data + ')');

    // console.log('parsed', parsed)
    return myObject as NerEntity[]
}

async function saveNERResponse(client: PoolClient, bankname: string, document_id: number, description: string, result: NerEntity[]) {
    const getTopEntityByScore = (entityType: 'ORG' | 'PER', result: NerEntity[]): NerEntity | null => {
        const filtered = result
            .filter(({entity_group, score}) => entity_group === entityType && score >= 0.98)
            .sort((a, b) => b.score - a.score)
        if (filtered.length > 0) {
            return filtered[0]
        }
        return null
    }

    const insertResponse = async (bankname: string, document_id: number, description: string, result: NerEntity[]) => {
        const topORG = getTopEntityByScore('ORG', result)
        const topPER = getTopEntityByScore('PER', result)

        const bank = bankname.replace(/\'/g, "''")
        const descr = description.replace(/\'/g, "''")
        const orgName = topORG ? `'${topORG.word.trim()}'` : null
        const orgScore = topORG ? topORG.score : null
        const personName = topPER ? `'${topPER.word.trim()}'` : null
        const personScore = topPER ? topPER.score : null
        const serialized = JSON.stringify(result)
        const escaped = serialized.replace(/\'/g, "''")

        const sql = `
            INSERT INTO "NER" (bankname, document_id, description, org_name, org_score, person_name, person_score, response) 
            VALUES ('${bank}', ${document_id}, '${descr}', ${orgName}, ${orgScore}, ${personName}, ${personScore}, '${escaped}'::json)
            ON CONFLICT (document_id, description) DO UPDATE 
                SET 
                    person_name = excluded.person_name,
                    person_score = excluded.person_score, 
                    org_name = excluded.org_name,
                    org_score = excluded.org_score
                  ;`
        // console.log('insertSQL', sql)
        const insertResult = await client.query(sql);
        // console.log('insertResult', insertResult)
    }

    return insertResponse(bankname, document_id, description, result)
}

async function getSavedResponse(client: PoolClient, document_id: number, description: string) {
    const descr = description.replace(/\'/g, "''")
    const sql = `
        SELECT 
            document_id, description, response
        FROM 
            "NER" t 
        WHERE
            document_id = ${document_id} AND description = '${descr}'
        `;
    const {rows} = await client.query(sql);
    return rows.length > 0 ? rows[0] : undefined
}