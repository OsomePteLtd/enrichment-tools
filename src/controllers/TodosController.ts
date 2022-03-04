import {Request, Response} from 'express';
import pool from '../dbconfig/dbConnector';
import {ocbcBank} from "../services/ocbcPatterns.service";
import {dbsBank} from "../services/dbsPatterns.service";

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

}

type RegExpression = {field: string, regExp: string, bankname: string}

/**
 * Change params to achieve required results
 */
function getParams() {
    // const filterCondition = `description ilike '%direct%debit%'`
    //
    // const regExpressions: RegExpression[] = [
    //     { field: 'ma1', regExp: 'Direct Debit to (.*)[\\s|\\n]Ref', bankname: 'Barclays Bank UK PLC' },
    //     { field: 'ma2', regExp: 'Direct Debit (.*) \\d{16} DDR', bankname: 'Barclays Bank UK PLC' },
    //     { field: 'ma3', regExp: 'Direct Debit (.*) OSOMELTD', bankname: 'Barclays Bank UK PLC' },
    //     { field: 'ma4', regExp: '\\A\\w{3}\\d{14,}\\sDirect Debit (.*) \\S*\\,', bankname: 'Metro Bank PLC' },
    //     { field: 'ma5', regExp: 'GBR\\nDirect Debit (.*),', bankname: 'Metro Bank PLC' },
    //     { field: 'ma6', regExp: '\\ADirect Debit ([A-Z -]*),', bankname: 'Metro Bank PLC' },
    //     { field: 'ma7', regExp: '(.*) \\(Direct Debit\\)', bankname: 'Monzo Bank Limited' },
    //     { field: 'ma8', regExp: 'L\\w{2}ns (.*) DIRECT DEBIT', bankname: 'OCBC Pte. Ltd.' },
    //     { field: 'ma9', regExp: 'DEBIT\\d+ (.*) DIRECT DEBIT', bankname: 'OVERSEA-CHINESE BANKING CORPORATION' },
    //     { field: 'ma10', regExp: 'DIRECT DEBIT PAYMENT TO (.*) REF[\\s|\\n]\\S+,', bankname: 'Santander' },
    // ]

    // const filterCondition = `description ilike '%bill%payment%'`
    //
    // const regExpressions = [
    //     { field: 'mb1', regExp: 'Bill Payment to[\\n|\\s](.*)[\\n|\\s]Ref:', bankname: 'Barclays Bank UK PLC' },
    //     { field: 'mb2', regExp: 'Bill Payment From[\\n|\\s](.*)[\\n|\\s]Ref', bankname: 'Barclays Bank UK PLC' },
    //     { field: 'mb3', regExp: 'Payment Bill User Payment:[\\n|\\s](.*)[\\n|\\s]ID:', bankname: 'PayPal, Inc.' },
    //     { field: 'mb4', regExp: '\\ABILL PAYMENT TO (.*) REFERENCE', bankname: 'Santander' },
    //     { field: 'mb5', regExp: '\\ABILL PAYMENT VIA FASTER PAYMENT TO (.*) REFERENCE.*MANDATE', bankname: 'Santander' },
    //     { field: 'mb6', regExp: '\\ABILL PAYMENT VIA FASTER PAYMENT TO (.*) REFERENCE.*MANDATE', bankname: 'Santander UK plc' },
    //     { field: 'mb7', regExp: 'Outward Faster Payment (.*)\\n', bankname: 'Metro Bank PLC' },
    //     { field: 'mb8', regExp: 'Bill Payment[\\n|\\s](.*)[\\n|\\s]INV', bankname: 'Barclays Bank UK PLC' },
    // ]

    const filterCondition = `description ilike '%transfer%'`

    const regExpressions = [
        { field: 'mc1', regExp: 'Pay \\w{3}\\s\\d{1,}.\\d{2}\\sto\\s(.*),', bankname: 'Airwallex' },
        { field: 'mc2', regExp: '\\|\\s[G][A]\\s(.*)\\s-\\s', bankname: 'Airwallex' },
        { field: 'mc3', regExp: '0016[01TI][01TI]\\d{7}[\\n|\\s](.*)[\\s|\\n]USD[\\s|\\n]', bankname: 'DBS Bank Ltd.' },
        { field: 'mc4_1', regExp: '0016[01TI][01TI]\\d{7}[\\n|\\s](.*)[\\s|\\n]SGD[\\s|\\n]\\d{1,},', bankname: 'DBS Bank Ltd.' },
        { field: 'mc4_2', regExp: '0016[01TI][01TI]\\d{7}[\\n|\\s](.*)[\\s|\\n]SGD[\\s|\\n]\\d{2,}\\.\\d{2}\\,', bankname: 'DBS Bank Ltd.' },
        { field: 'mc4_3', regExp: '0016[01TI][01TI]\\d{7}[\\n|\\s](.*)[\\s|\\n]HKD[\\s|\\n]\\d{1,}[\\s|\\n][Aa][Tt][\\s|\\n]SGD', bankname: 'DBS Bank Ltd.' },
        { field: 'mc4_4', regExp: '0016[01TI][01TI]\\d{7}[\\n|\\s](.*)[\\s|\\n]INR[\\s|\\n]\\d{1,}[\\s|\\n][Aa][Tt][\\s|\\n]SGD', bankname: 'DBS Bank Ltd.' },
        { field: 'mc4_5', regExp: '0016[01TI][01TI]\\d{7}[\\n|\\s](.*)[\\s|\\n]NZD[\\s|\\n]\\d{1,}[\\s|\\n][Aa][Tt][\\s|\\n]SGD', bankname: 'DBS Bank Ltd.' },
        { field: 'mc4_6', regExp: '0016[01TI][01TI]\\d{7}[\\n|\\s](.*)[\\s|\\n]USD[\\s|\\n]\\d{1,}[\\s|\\n][Aa][Tt][\\s|\\n]SGD', bankname: 'DBS Bank Ltd.' },
        { field: 'mc4_7', regExp: '0016[01TI][01TI]\\d{7}[\\n|\\s](.*)[\\s|\\n]CNH[\\s|\\n]\\d{1,}\\.\\d{2}[\\s|\\n][Aa][Tt][\\s|\\n]SGD', bankname: 'DBS Bank Ltd.' },
        { field: 'mc4_8', regExp: '0016[01TI][01TI]\\d{7}[\\n|\\s](.*)[\\s|\\n]GBP[\\s|\\n]\\d{1,}\\.\\d{2}[\\s|\\n][Aa][Tt][\\s|\\n]SGD', bankname: 'DBS Bank Ltd.' },
        { field: 'mc4_9', regExp: '0016[01TI][01TI]\\d{7}[\\n|\\s](.*)[\\s|\\n]AED[\\s|\\n]\\d{1,}[\\s|\\n][Aa][Tt][\\s|\\n]SGD', bankname: 'DBS Bank Ltd.' },
        { field: 'mc4_10', regExp: '0016[01TI][01TI]\\d{7}[\\n|\\s](.*)[\\s|\\n]SGD[\\s|\\n]\\d{1,}\\.\\d{2}[\\s|\\n][Aa][Tt][\\s|\\n]USD', bankname: 'DBS Bank Ltd.' },
        { field: 'mc4_11', regExp: '0016[01TI][01TI]\\d{7}[\\n|\\s](.*)[\\s|\\n]HKD[\\s|\\n]\\d{1,}[\\s|\\n][Aa][Tt][\\s|\\n]SGD', bankname: 'DBS Bank Ltd.' },
    ]

    // const filterCondition = `bankname ilike '%PayPal%'`
    // const regExpressions = [
    //     { field: 'ms1', regExp: 'Express Checkout Payment:\\s(.*)\\sID', bankname: 'PayPal, Inc.' },
    //     { field: 'ms2', regExp: 'Direct Credit Card Payment:\\s(.*)\\sID', bankname: 'PayPal, Inc.' },
    //     { field: 'ms3', regExp: 'Website Payment:\\s(.*)\\sID', bankname: 'PayPal, Inc.' },
    //     { field: 'ms4', regExp: 'Payment Review Release\\s(.*)\\sID', bankname: 'PayPal, Inc.' },
    //     { field: 'ms5', regExp: 'Payment Refund:\\s(.*)\\sID', bankname: 'PayPal, Inc.' },
    //     { field: 'ms6', regExp: 'Mobile Payment:\\s(.*)\\sID', bankname: 'PayPal, Inc.' },
    //     { field: 'ms7', regExp: 'Chargeback:\\s(.*)\\sID', bankname: 'PayPal, Inc.' },
    //     { field: 'ms8', regExp: '\\d{2}/\\d{2}/\\d{4}\\s\\d{2}:\\d{2}:\\d{2}\\sSGT\\s(.*)', bankname: 'PayPal Inc,' },
    // ]

    // const filterCondition = `bankname ilike '%DBS Bank Ltd.%'`
    // const regExpressions = [
    //     { field: 'mp1', regExp: '(?<=Card payment Card:\\s)(.*)(?=,\\s[xX]{4}\\s\\d{4})', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp2', regExp: '(?<=Card payment Card\\s:\\s)(.*)(?=\\s,\\s[xX]{4}\\s\\d{4})', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp4', regExp: '(?<=TRANSACTION BAT[\\s|\\n])([^\\*0-9\\-\\_]+)(?=[\\s|\\n]SI[\\s|\\n]NG)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp5', regExp: '(?<=TRANSACTION BAT[\\s|\\n])([^\\*0-9\\-\\_]+)(?=[\\s|\\n]HO[\\s|\\n]NG)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp6', regExp: '(?<=TRANSACTION BAT[\\s|\\n])([^\\*0-9\\-\\_]+)(?=[\\s|\\n]LO[\\s|\\n]ND)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp7', regExp: '(?<=TRANSACTION BAT[\\s|\\n])([^\\*0-9\\-\\_]+)(?=[\\s|\\n]LU[\\s|\\n]XE)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp8', regExp: '(?<=TRANSACTION BAT[\\s|\\n])([^\\*0-9\\-\\_]+)(?=[\\s|\\n]DU[\\s|\\n]BL)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp9', regExp: '(?<=TRANSACTION BAT[\\s|\\n])([^\\*0-9\\-\\_]+)(?=[\\s|\\n]KI[\\s|\\n]TC)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp10', regExp: '(?<=TRANSACTION BAT[\\s|\\n])([^\\*0-9\\-\\_]+)(?=[\\s|\\n]MI[\\s|\\n]NA)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp11', regExp: '(?<=TRANSACTION BAT[\\s|\\n])([^\\*0-9\\-\\_]+)(?=[\\s|\\n]\\-\\d{9}REF)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp12', regExp: '(?<=TRANSACTION BAT[\\s|\\n])([^\\*0-9\\-\\_]+)(?=[\\s|\\n]TO[\\s|\\n]RO)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp13', regExp: '(?<=TRANSACTION BAT[\\s|\\n])([^\\*0-9\\-\\_]+)(?=[\\s|\\n]SH[\\s|\\n]EN)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp14', regExp: '(?<=TRANSACTION BAT[\\s|\\n])([^\\*0-9\\-\\_]+)(?=[\\s|\\n]GO[\\s|\\n]RO)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp15', regExp: '(?<=TRANSACTION BAT[\\s|\\n])([^\\*0-9\\-\\_]+)(?=[\\s|\\n]\\d{3}\\-\\d{3}\\-\\d{4})', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp16', regExp: '(?<=TRANSACTION BAT[\\s|\\n])(.*)(?=\\*[\\s|\\n]\\d{9}[\\s|\\n]SI[\\s|\\n]NG)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp17', regExp: '(?<=TRANSACTION BAT[\\s|\\n])(.*)(?=[\\s|\\n]\\*[\\s|\\n]\\w\\d{4}\\w{5}[\\s|\\n]SI[\\s|\\n]NG)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp18', regExp: '(?<=TRANSACTION BAT[\\s|\\n])(.*)(?=[\\s|\\n]INTERNET\\sPAYMEN[\\s|\\n]SI[\\s|\\n]NG)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp19', regExp: '(?<=TRANSACTION BAT[\\s|\\n])(.*)(?=\\s\\-\\sONLINE[\\s|\\n]SI[\\s|\\n]NG)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp20', regExp: '(?<=TRANSACTION BAT[\\s|\\n])(.*)(?=[\\s|\\*\\s]IOS.*[\\s|\\n]SI[\\s|\\n]NG)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp21', regExp: '(?<=TRANSACTION BAT[\\s|\\n])(.*)(?=\\sA\\-2HK.*[\\s|\\n]SI[\\s|\\n]NG)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp22', regExp: '(?<=TRANSACTION BAT[\\s|\\n])(.*)(?=\\*\\w+[\\s|\\n]\\w+[\\s|\\n]SI[\\s|\\n]NG)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp23', regExp: '(?<=TRANSACTION BAT[\\s|\\n])(.*)(?=XTRA\\-JURONG[\\s|\\n]SI[\\s|\\n]NG)', bankname: 'DBS Bank Ltd.' },
    //     { field: 'mp24', regExp: '(?<=TRANSACTION BAT[\\s|\\n])(.*)(?=SG\\-ADC\\s\\=[\\s|\\n]SI[\\s|\\n]NG)', bankname: 'DBS Bank Ltd.' },
    // ]

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