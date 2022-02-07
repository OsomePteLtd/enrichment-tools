import {Request, Response} from 'express';
import {ocbcBank} from "../services/banks/ocbc.service";
import {dbsBank} from "../services/banks/dbs.service";
import {uobBank} from "../services/banks/uob.service";
import {hsbcBank} from "../services/banks/hsbc.service";
import {paypalBank} from "../services/banks/paypal.service";
import {transferwiseBank} from "../services/banks/transferwise.service";
import {aspireBank} from "../services/banks/aspire.service";
import {starlingBank} from "../services/banks/starling.service";
import {coverage, getMatchedRows} from "../services/regexes.service";
import {compareNER, coverageByNER, processBatch} from "../services/ner.service";
import pool from '../dbconfig/dbConnector';

class TodosController {

    // manual regexes

    public async get(req: Request, res: Response) {
        try {
            const offset = parseInt(req.query.offset as string, 10) || 0
            const limit = parseInt(req.query.limit as string, 10) || 100
            const field = req.query.field as string

            if (!field) {
                throw new Error('You should set field query params')
            }

            res.json(await getMatchedRows(field, offset, limit));
        } catch (error) {
            res.status(400).send(error);
        }
    }

    public async coverage(req: Request, res: Response) {
        try {
            res.json(await coverage());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    // NER

    public async nerCoverage(req: Request, res: Response) {
        try {
            res.json(await coverageByNER());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async nerBatch(req: Request, res: Response) {
        const input: string[] = req.body.input
        try {
            const results = await processBatch(input)
            res.json({ results });
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async nerCompare(req: Request, res: Response) {
        try {
            res.json(await compareNER());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    // banks patterns

    public async ocbc(req: Request, res: Response) {
        try {
            res.json(await ocbcBank());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async dbs(req: Request, res: Response) {
        try {
            res.json(await dbsBank());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async uob(req: Request, res: Response) {
        try {
            res.json(await uobBank());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async hsbc(req: Request, res: Response) {
        try {
            res.json(await hsbcBank());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async paypal(req: Request, res: Response) {
        try {
            res.json(await paypalBank());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async transferwise(req: Request, res: Response) {
        try {
            res.json(await transferwiseBank());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async aspire(req: Request, res: Response) {
        try {
            res.json(await aspireBank());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async starling(req: Request, res: Response) {
        try {
            res.json(await starlingBank());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async aho(req: Request, res: Response) {
        try {
            res.json(await ahoCorasick());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }
}

async function ahoCorasick() {
    const client = await pool.connect();

    const sql1 = `SELECT description FROM "MY_TABLE" t`;
    const {rows: descriptionsRows} = await client.query(sql1);

    const sql2 = `SELECT name,type FROM "contacts" t`;
    const {rows: contactsRows} = await client.query(sql2);

    client.release();

    const AhoCorasick = require('aho-corasick-node');

    const MIN_LENGTH = 4
    const MIN_COUNT_OF_WORDS = 1
    const stops: string[] = [
        "receipt",
        'cash',
        'invoice',
        'supplier',
        "billing statement",
        "receipts",
        "sales",
        "test",
        "support"
    ]
    const contacts = contactsRows
        // .filter(({type}) => type === 'person')
        .map(({name}) => name.toLowerCase().trim())
        .map(str => str.trim())
        .filter(str => str.match(/^[\-\.\ ]*$/) === null)
        .filter(str => !stops.includes(str))
    // .filter(str => str.match(/^[\x00-\x7F]*$/))

    const uniqueContacts = unique(contacts, true)
        .flatMap(str => [
            str,
            str.replace(/pte|ltd|llc|limited|/g, '')
        ])
        .flatMap(str => unique([
            str,
            str.replace(/\.+/g, ' '),
            str.replace(/\-+/g, ' '),
            str.replace(/\#+/g, ' '),
            str.replace(/\,+/g, ' '),
        ], true))
        .filter(str => str.length >= MIN_LENGTH)
        .filter(str => str.split(' ').length >= MIN_COUNT_OF_WORDS)
        .map(str => ' ' + str + ' ')
        .flatMap(str => str.replace(/[ ]{2,}/g, ' '))

    // console.log(keywords.splice(0, 100))
    // console.log(uniqueContacts.splice(0, 1000))

    const builder = AhoCorasick.builder();
    unique(uniqueContacts, false).forEach(k => builder.add(k));
    const ac = builder.build();

    const queries = descriptionsRows
        .map(({description}) => description.toLowerCase())
        .map(str => ' ' + str + ' ')
        .filter(str => str && str.length > 0);

    let count = 0
    const response = []
    const map = new Map<string, number>()
    for (const query of queries) {
        const hits = ac.match(query);
        if (hits.length > 0) {
            const trimmed = unique(hits, true)
            count++
            for (const item of trimmed) {
                const oldValue = map.get(item) ?? 0
                map.set(item, oldValue + 1)
            }
            response.push({query, hits: trimmed})
        }
    }

    const topPairs = []
    const pairsMap = new Map<number, number>()
    for (let [key, value] of map) {
        topPairs.push({key, value})

        const oldValue = pairsMap.get(value) ?? 0
        pairsMap.set(value, oldValue + 1)
    }
    topPairs.sort((a, b) => {
        if (a.value < b.value) {
            return 1
        } else if (a.value > b.value) {
            return -1
        }
        return 0
    })

    // const topCounts = []
    // for (let [key, value] of pairsMap) {
    //     topCounts.push({key, value})
    // }
    // topCounts.sort((a, b) => {
    //     if (a.value < b.value) {
    //         return 1
    //     } else if (a.value > b.value) {
    //         return -1
    //     }
    //     return 0
    // })
    // for (const count of topCounts) {
    //     (count as any).share = (count.value * 100 / topPairs.length).toFixed(2)
    // }


    return {
        count,
        totalCount: descriptionsRows.length,
        percentage: (count * 100 / descriptionsRows.length).toFixed(2),
        topPairs,
        // topCounts,
        response,
    }
}

function unique(keywords: string[], trim = false) {
    const trimmed = trim ? keywords.map((hit: string) => hit.trim()) : keywords
    return Array.from(new Set<string>(trimmed))
}

export default TodosController;