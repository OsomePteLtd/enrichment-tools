import {Request, Response} from 'express';
import pool from '../dbconfig/dbConnector';

class TodosController {

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

    public async escape(req: Request, res: Response) {
        try {
            const regex = req.query.regex as string

            if (!regex) {
                throw new Error('You should set regex')
            }

            res.json(escapeRegex(regex));
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }
}

/**
 * Change params to achieve required results
 */
function getParams() {
    const filterCondition = `description ilike '%bill%payment%'`

    const regExpressions = [
        // { field: 'ma1', regExp: 'Direct Debit to (.*)[\s|\n]Ref' },
        // { field: 'ma2', regExp: 'Direct Debit (\\w{3,}\\s\\w{3,}) \\d+' },
        // { field: 'ma3', regExp: 'Direct Debit (.*)[\\s|\\n]BUSINESS' },
        // { field: 'ma4', regExp: 'GBR\\nDirect Debit (.*),' },
        // { field: 'ma5', regExp: '\\ADirect Debit ([A-Z -]*),' },
        // { field: 'ma6_santander', regExp: '\\ADirect Debit \\S+ ([A-Z]*)LTD', bankname: 'Santander' },
        // { field: 'ma6_metro', regExp: '\ADirect Debit ([A-Z -]*),', bankname: 'Metro Bank PLC' },

        { field: 'mb1', regExp: 'Bill Payment to[\\n|\\s](.*)[\\n|\\s]Ref:', bankname: 'Barclays Bank UK PLC' },
        { field: 'mb2', regExp: 'Bill Payment From[\\n|\\s](.*)[\\n|\\s]Ref', bankname: 'Barclays Bank UK PLC' },
        { field: 'mb3', regExp: 'Payment Bill User Payment:[\\n|\\s](.*)[\\n|\\s]ID:', bankname: 'PayPal, Inc.' },
        { field: 'mb4', regExp: '\\ABILL PAYMENT TO (.*) REFERENCE', bankname: 'Santander' },
        { field: 'mb5', regExp: '\\ABILL PAYMENT VIA FASTER PAYMENT TO (.*) REFERENCE.*MANDATE', bankname: 'Santander' },
        { field: 'mb6', regExp: '\\ABILL PAYMENT VIA FASTER PAYMENT TO (.*) REFERENCE.*MANDATE', bankname: 'Santander UK plc' },
        { field: 'mb7', regExp: 'Outward Faster Payment (.*)\\n', bankname: 'Metro Bank PLC' },
        { field: 'mb8', regExp: 'Bill Payment[\\n|\\s](.*)[\\n|\\s]INV', bankname: 'Barclays Bank UK PLC' },
    ]

    return {filterCondition, regExpressions}
}

async function getMatchedRows(field: string, offset: number, limit: number) {
    const client = await pool.connect();

    const {filterCondition, regExpressions} = getParams()
    const result = regExpressions.find((regExpression) => regExpression.field === field)

    if (!result || !result.regExp || !result.bankname) {
        return {
            totalCount: 0,
            rows: []
        }
    }

    const sql = `
        SELECT 
            document_id, bankname, description, ${field}
        FROM 
            "MY_TABLE" t, 
           ${'regexp_match(description, \''+result.regExp+ '\') as ' + field}
        WHERE 
            ${filterCondition} AND ${field} is not null AND bankname = '${result.bankname}'
        ORDER BY 
            bankname, description
        OFFSET 
            ${offset} 
        LIMIT 
            ${limit}
        `;

    console.log(sql)

    const countingSql = `
        SELECT 
            COUNT(*) as "totalCount" 
        FROM 
            "MY_TABLE" t, 
           ${'regexp_match(description, \''+result.regExp+ '\') as ' + field}
        WHERE 
            ${filterCondition} AND ${field} is not null AND bankname = '${result.bankname}'
        `;

    const {rows} = await client.query(sql);
    const {rows: counts} = await client.query(countingSql);

    client.release();

    return {
        totalCount: counts[0].totalCount,
        rows: rows.map((row: any) => ({
            bankName: row.bankname,
            documentId: row.document_id,
            description: row.description,
            contactName: row[field]
        }))
    }
}

function escapeRegex(s: string) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export default TodosController;