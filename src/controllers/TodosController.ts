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

    public async coverage(req: Request, res: Response) {
        try {
            res.json(await coverage());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }
}

type RegExpression = {field: string, regExp: string, bankname: string}

/**
 * Change params to achieve required results
 */
function getParams() {
    const filterCondition = `description ilike '%direct%debit%'`

    const regExpressions: RegExpression[] = [
        { field: 'ma1', regExp: 'Direct Debit to (.*)[\\s|\\n]Ref', bankname: 'Barclays Bank UK PLC' },
        { field: 'ma2', regExp: 'Direct Debit (.*) \\d{16} DDR', bankname: 'Barclays Bank UK PLC' },
        { field: 'ma3', regExp: 'Direct Debit (.*) OSOMELTD', bankname: 'Barclays Bank UK PLC' },
        { field: 'ma4', regExp: '\\A\\w{3}\\d{14,}\\sDirect Debit (.*) \\S*\\,', bankname: 'Metro Bank PLC' },
        { field: 'ma5', regExp: 'GBR\\nDirect Debit (.*),', bankname: 'Metro Bank PLC' },
        { field: 'ma6', regExp: '\\ADirect Debit ([A-Z -]*),', bankname: 'Metro Bank PLC' },
        { field: 'ma7', regExp: '(.*) \\(Direct Debit\\)', bankname: 'Monzo Bank Limited' },
        { field: 'ma8', regExp: 'L\\w{2}ns (.*) DIRECT DEBIT', bankname: 'OCBC Pte. Ltd.' },
        { field: 'ma9', regExp: 'DEBIT\\d+ (.*) DIRECT DEBIT', bankname: 'OVERSEA-CHINESE BANKING CORPORATION' },
        { field: 'ma10', regExp: 'DIRECT DEBIT PAYMENT TO (.*) REF[\\s|\\n]\\S+,', bankname: 'Santander' },
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

async function coverage() {
    const client = await pool.connect();

    const {filterCondition, regExpressions} = getParams()

    const sql = `
        SELECT 
            document_id, bankname, description
        FROM 
            "MY_TABLE" t 
        WHERE 
            ${filterCondition}
        ORDER BY 
            bankname, description
        `;
    const {rows} = await client.query(sql);

    const matchedDocumentIds = new Set();
    for (const {field, regExp, bankname} of regExpressions) {
        const sql = `
        SELECT 
            document_id, bankname, description, ${field}
        FROM 
            "MY_TABLE" t, 
           ${'regexp_match(description, \''+regExp+ '\') as ' + field}
        WHERE 
            ${filterCondition} AND ${field} is not null AND bankname = '${bankname}'
        ORDER BY 
            bankname, description
        `;
        const {rows: matchedRows} = await client.query(sql);
        matchedRows.forEach(({document_id, description}) => {
            matchedDocumentIds.add({document_id, description})
        })
    }

    client.release();

    return {
        totalRows: rows.length,
        coveredRows: matchedDocumentIds.size,
        percentage: (matchedDocumentIds.size / rows.length).toLocaleString("en", {style: "percent"})
    }
}

export default TodosController;