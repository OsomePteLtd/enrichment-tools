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
import {PoolClient} from "pg";

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
        .map(({name, id}) => ({id, name: name.toLowerCase().trim()}))
        .map(({name, id}) => ({id, name: name.trim()}))
        .filter(({name}) => name.match(/^[\-\.\ ]*$/) === null)
        .filter(({name}) => !stops.includes(name))
    // .filter(({name}) => name.match(/^[\x00-\x7F]*$/))

    const contactNameToIds: Map<string, Set<number>> = new Map<string, Set<number>>()

    for (const {id, name} of contacts) {
        const contactAliases = [name.trim()].flatMap(str => [
            str,
            str.replace(/pte|ltd|llc|limited|/g, '')
        ])
            .flatMap(str => unique([
                str,
                str.replace(/\.+/g, ' '),
                str.replace(/\-+/g, ' '),
                str.replace(/\#+/g, ' '),
                str.replace(/\,+/g, ' '),
                str.replace(/\++/g, ' '),
                str.replace(/\.+/g, ' '),
            ], true))
            .filter(str => str.length >= MIN_LENGTH)
            .filter(str => str.split(' ').length >= MIN_COUNT_OF_WORDS)
            // .map(str => ' ' + str + ' ')
            .flatMap(str => str.replace(/[ ]{2,}/g, ' '))

        for (const alias of contactAliases) {
            if (!contactNameToIds.has(alias)) {
                contactNameToIds.set(alias, new Set<number>())
            }
            const set = contactNameToIds.get(alias)!
            set.add(id)
            contactNameToIds.set(alias, set)
        }
    }

    return {contactNameToIds, contactIdToName}
}

async function getMatches(client: PoolClient, uniqueContacts: string[]) {
    const sql1 = `SELECT description FROM "MY_TABLE" t`;
    const {rows: descriptionsRows} = await client.query(sql1);

    const AhoCorasick = require('aho-corasick-node');
    const builder = AhoCorasick.builder();
    for (const contactName of uniqueContacts) {
        if (stops.includes(contactName)) {
            continue
        }
        builder.add(contactName)
    }

    const ac = builder.build();

    const queries = descriptionsRows
        .map(({description}) => description.toLowerCase())
        .map(str => ' ' + str + ' ')
        .filter(str => str && str.length > 0);

    let count = 0
    const response = []
    const contactCounts = new Map<string, number>()
    for (const query of queries) {
        const matches = ac.match(query);
        if (matches.length > 0) {
            const uniqueMatches = unique(matches, true)
            count++
            for (const match of uniqueMatches) {
                const oldValue = contactCounts.get(match) ?? 0
                contactCounts.set(match, oldValue + 1)
            }
            response.push({query, hits: uniqueMatches})
        }
    }

    return {
        contactCounts,
        count,
        totalCount: descriptionsRows.length,
        percentage: (count * 100 / descriptionsRows.length).toFixed(2),
        response
    }
}

function getTop(
    contactCounts: Map<string, number>,
    contactNameToIds: Map<string, Set<number>>,
    contactIdToName: Map<number, string>
) {
    const topPairs = []
    // const pairsMap = new Map<number, number>()
    for (let [key, value] of contactCounts) {
        const contactIds = contactNameToIds.get(key) ? [...contactNameToIds.get(key)!.keys()] : []
        const contacts = contactIds.map(id => ({id, name: contactIdToName.get(id)!}))
        topPairs.push({ key, value, contacts  })
        // const oldValue = pairsMap.get(value) ?? 0
        // pairsMap.set(value, oldValue + 1)
    }
    topPairs.sort((a, b) => b.value * b.contacts.length - a.value * a.contacts.length)

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

    return topPairs.map(({key, value, contacts}) => ({key, value, contactsCount: contacts.length, contacts}))
}

const distance = require('jaro-winkler');

function getSimilarGroups(
    globalContacts: {
        key: string,
        value: number,
        contactsCount: number,
        contacts: {id: number, name: string}[]
    }[]
) {
    const MIN_SIMILARITY_SCORE = 0.9
    const used = new Set<string>()
    const groups = []
    for (let i = 0; i < globalContacts.length; i++) {
        if (used.has(globalContacts[i].key)) {
            continue;
        }
        used.add(globalContacts[i].key)
        const group = [{...globalContacts[i], contacts: undefined}]
        for (let j = i + 1; j < globalContacts.length; j++) {
            if (used.has(globalContacts[j].key)) {
                continue;
            }
            const dist = distance(globalContacts[i].key, globalContacts[j].key, { caseSensitive: false })
            if (dist >= MIN_SIMILARITY_SCORE) {
                used.add(globalContacts[j].key)
                group.push({...globalContacts[j], contacts: undefined})
            }
        }
        const groupValue = group.reduce((prev, globalContact) => {
            return prev + globalContact.value * globalContact.contactsCount
        }, 0)
        groups.push({group, value: groupValue})
    }

    groups.sort((a, b) => b.value - a.value)

    return groups.filter(({value}) => value >= 100)
}


async function ahoCorasick() {
    const client = await pool.connect();

    const {contactNameToIds, contactIdToName} = await getContacts(client)

    const uniqueContacts = [...contactNameToIds.keys()]
    const { contactCounts, count, totalCount, percentage, response } = await getMatches(client, uniqueContacts)

    client.release();

    const topPairs = getTop(contactCounts, contactNameToIds, contactIdToName)

    const groups = getSimilarGroups(topPairs)

    return {
        // count,
        // totalCount,
        // percentage,
        topPairsCount: topPairs.length,
        groupsCount: groups.length,
        groups,
        // groups: groups.filter(({group}) => group.length > 1),
        // topPairs,
        // response: response.slice(0, 100),
    }
}

function unique(keywords: string[], trim = false) {
    const trimmed = trim ? keywords.map((hit: string) => hit.trim()) : keywords
    return Array.from(new Set<string>(trimmed))
}

export default TodosController;