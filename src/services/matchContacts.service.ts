import {PoolClient} from "pg";
import pool from "../dbconfig/dbConnector";

export async function matchContacts() {
    const client = await pool.connect();

    const {contactNameToIds, contactIdToContact} = await getContacts(client)

    const uniqueContacts = [...contactNameToIds.keys()]
    const { contactCounts } = await getMatches(client, uniqueContacts)

    client.release();

    const patterns = getTopPatterns(contactCounts, contactNameToIds, contactIdToContact)

    const groups = patternsToGroups(patterns)

    const globalContacts = groupsToGlobalContacts(groups)

    return {
        patternsCount: patterns.length,
        groupsCount: groups.length,
        globalContactsCount: globalContacts.length,
        // patterns,
        // groups,
        globalContacts
    }
}

const stops: string[] = [
    "receipt",
    'cash',
    'invoice',
    'supplier',
    "billing statement",
    "receipts",
    "sales",
    "test",
    "support",
    "limited",
    "pte. ltd.",
    "grab",
    "giro", "ibg giro", "interbank giro", "interbank giro ibg",
    "nets",
    "a / c", "coll",
    "salary",
    "agent",
    "asia",
    "( s )",
    "data",
    "fund",
    "singapore", "singapore pte", "singapore pte. ltd", "singapore pte ltd", "singapore pet",
    "csdb",
    "xxxx",
    "bill", "bills",
    "customer",
    "cash sales", "cash sale",
    "serv",
    "charges",
    "osome ltd",

    // gateways
    "paynow",
]

type Branch = 'UK' | 'HK' | 'SG' | '-'

type Contact = {
    id: number,
    name: string,
    type: string,
    registrationNumber?: string | null,
    registrationCountryCode?: string | null
    branch: Branch
}

function detectBranch({registrationNumber, registrationCountryCode}: Contact) {
    const str = [registrationNumber ?? '', registrationCountryCode ?? ''].join('|')
    if (str.match(/UK|GB|IE/ig)) {
        return 'UK'
    }
    if (str.match(/HK/ig)) {
        return 'HK'
    }
    if (str.match(/SG/ig)) {
        return 'SG'
    }
    return '-'
}

async function getContacts(client: PoolClient) {
    const sql2 = `SELECT id,name,type,"registrationNumber","registrationCountryCode" FROM "contacts" t`;
    const {rows: contactsRows} = await client.query(sql2);

    const contactIdToContact = new Map<number, Contact>(contactsRows.map(contact => ([contact.id, {
        ...contact,
        branch: detectBranch(contact)
    }])))

    const MIN_LENGTH = 4
    const MIN_COUNT_OF_WORDS = 1
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

    return {contactNameToIds, contactIdToContact}
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
        count,
        totalCount: descriptionsRows.length,
        percentage: (count * 100 / descriptionsRows.length).toFixed(2),
        contactCounts,
        response
    }
}

const calcGroupData = (contacts: Contact[], groupRegData: Set<string>, groupContactIds: Set<number>) => {
    contacts.forEach(({id, registrationNumber, registrationCountryCode}) => {
        if (registrationNumber || registrationCountryCode) {
            const str = [registrationNumber ?? '', registrationCountryCode ?? ''].join('|')
            groupRegData.add(str)
        }
        groupContactIds.add(id)
    })
}

type Pattern = {
    key: string,
    value: number,
    contactsCount: number,
    contacts: Contact[]
    regData: string[]
    uniqueContactNames: string[]
}

function getTopPatterns(
    patternCounts: Map<string, number>,
    patternToContactIds: Map<string, Set<number>>,
    contactIdToContact: Map<number, Contact>
): Pattern[] {
    const topPairs = []
    for (let [key, value] of patternCounts) {
        const contactIds = patternToContactIds.get(key) ? [...patternToContactIds.get(key)!.keys()] : []
        const contacts = contactIds.map(id => contactIdToContact.get(id)!)
        const groupRegData = new Set<string>()
        const groupContactIds = new Set<number>()
        calcGroupData(contacts, groupRegData, groupContactIds)
        const uniqueContactNames = new Set<string>(contacts.map(contact => contact.name))
        topPairs.push({
            key,
            value,
            contacts,
            regData: [...groupRegData.keys()],
            uniqueContactNames: [...uniqueContactNames.keys()]
        })
    }
    topPairs.sort((a, b) => b.value * b.contacts.length - a.value * a.contacts.length)
    return topPairs.map(
        ({key, value, contacts, regData, uniqueContactNames}) => ({
            key,
            value,
            contactsCount: contacts.length,
            contacts,
            regData,
            uniqueContactNames
        })
    ).filter(({value, contactsCount}) => value >= 20 && contactsCount >= 5)
}

type Group = {
    groupPatterns: Pattern[]
    value: number,
    regData: string[]
}

function patternsToGroups(patterns: Pattern[]): Group[] {
    const MIN_SIMILARITY_SCORE = 0.98
    const usedPatterns = new Set<string>()
    const groups = []
    const distance = require('jaro-winkler');
    for (let i = 0; i < patterns.length; i++) {
        if (usedPatterns.has(patterns[i].key)) {
            continue;
        }

        const groupRegData = new Set<string>()
        const groupContactIds = new Set<number>()

        usedPatterns.add(patterns[i].key)
        const groupPatterns = [patterns[i]]
        calcGroupData(patterns[i].contacts, groupRegData, groupContactIds)

        for (let j = i + 1; j < patterns.length; j++) {
            if (usedPatterns.has(patterns[j].key)) {
                continue;
            }
            const dist = distance(patterns[i].key, patterns[j].key, { caseSensitive: false })
            if (dist >= MIN_SIMILARITY_SCORE) {
                usedPatterns.add(patterns[j].key)
                groupPatterns.push(patterns[j])
                calcGroupData(patterns[j].contacts, groupRegData, groupContactIds)
            }
        }

        const groupValue = groupPatterns.reduce((prev, globalContact) => {
            return prev + globalContact.value * globalContact.contactsCount
        }, 0)
        groups.push({groupPatterns, value: groupValue, regData: [...groupRegData.keys()]})
    }

    groups.sort((a, b) => b.value - a.value)

    return groups.filter(({value}) => value >= 50)
}

type GlobalContact = {
    name: string,
    type: 'company' | 'bank' | 'person' | '-'
    branches: Branch[],
    uniqueContactNames: string[]
    contactIds: number[]
}

function groupsToGlobalContacts(groups: Group[]) {
    const globalContacts = []
    const globalUniqueContactIds = new Set<number>()
    for (const {groupPatterns} of groups) {
        const uniqueContactIds = new Set<number>()
        const uniqueContactNames = new Map<string, number>()
        const uniqueBranches = new Set<Branch>()
        let companyCount = 0, bankCount = 0, personCount = 0
        for (const {contacts} of groupPatterns) {
            for (const {id, name, type, branch} of contacts) {
                if (globalUniqueContactIds.has(id)) {
                    continue
                }
                globalUniqueContactIds.add(id)
                uniqueContactIds.add(id)
                if (!uniqueContactNames.has(name)) {
                    uniqueContactNames.set(name, 0)
                }
                uniqueContactNames.set(name, uniqueContactNames.get(name)! + 1)
                uniqueBranches.add(branch)

                if (type === 'company') {
                    companyCount++
                }
                if (type === 'bank') {
                    bankCount++
                }
                if (type === 'person') {
                    personCount++
                }
            }
        }

        const totalCount = bankCount + companyCount + personCount

        if (totalCount === 0) {
            continue
        }

        const topNames = [...uniqueContactNames.entries()].sort(([, a], [, b]) => b - a)
        const name = topNames[0][0]
        const isBank = bankCount >= 0.8 * totalCount || name.match(/bank/ig)
        const isCompany = companyCount >= 0.8 * totalCount
        const isPerson = personCount >= 0.8 * totalCount

        const globalContact: GlobalContact = {
            name,
            type: (isBank ? 'bank' : (isCompany ? 'company' : (isPerson ? 'person' : '-'))),
            branches: [...uniqueBranches.keys()],
            uniqueContactNames: [...uniqueContactNames.keys()],
            contactIds: [...uniqueContactIds.keys()]
        }
        if (globalContact.type === 'company' || globalContact.type === '-') {
            globalContacts.push(globalContact)
        }
    }
    return globalContacts
}

function unique(keywords: string[], trim = false) {
    const trimmed = trim ? keywords.map((hit: string) => hit.trim()) : keywords
    return Array.from(new Set<string>(trimmed))
}