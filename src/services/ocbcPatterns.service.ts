import pool from "../dbconfig/dbConnector";
import {genPatterns, toCSV} from "./utils";

export async function ocbcBank() {
    const client = await pool.connect();

    const bankNames = [
        'VERSEA - CHINESE BANKING CORPORATION','OCBC', 'OCBC Bank', 'OCBC BANK', 'OCBC Bank Ltd', 'OCBC Bank Ltd.', 'OCBC Bank Pte. Ltd.', 'OCBC Pte. Ltd.', 'OCBC WING HANG', 'OVERSEA - CHINESE BANKING CORPORATION', 'OVERSEA-CHINESE BANKING CORPORATION', 'OVERSEA - CHINESE BANKING CORPORATION 2', 'Oversea - Chinese Banking Corporation Limited', 'Oversea Chinese Banking Corporation Limited', 'Oversea-Chinese Banking Corporation Limited', 'OVERSEA-CHINESE BANKING CORPORATION LIMITED'
    ]
    const transactionCodes = [
        'BEXP', 'BONU', 'CBTV', 'CCRD', 'CHAR', 'COLL', 'COMM', 'CPKC', 'CSDB', 'DCRD', 'DIVD',
        'DNTS', 'EDUC', 'FCPM', 'OTHR', 'PHON', 'PTXP', 'RDTX', 'REBT', 'REFU', 'RENT', 'SALA', 'STDY', 'FWLV', 'GDDS',
        'GOVI', 'GSTX', 'HSPC', 'IHRP', 'INSU', 'INTC', 'INTE', 'INVS', 'IVPT', 'LOAN', 'MDCS', 'NITX', 'SUPP', 'TAXS',
        'TBIL', 'TCSC', 'TRAD', 'TREA', 'TRPT', 'UBIL', 'WHLD',]
    const commands = [
        'CALL', 'A\/C', 'A \/ C', 'TT', 'DEP', 'WDL',
        'CHECK', 'CHECKING',
        'FAST', 'PAYMENT', 'FUND', 'TRANSFER', 'CHARGES', 'REVERSAL', 'REBATE', 'CHARGE', 'CHEQUE', 'DEPOSIT',
        'TRANS CHARGE', 'BILL PAYMENT', 'NETS', 'POS', 'IACH', 'OD INT',
        'DEBIT', 'CREDIT', 'PURCHASE', 'PAYMENT\/TRANSFER', 'STATEMENT', 'SALARY', 'SETTLEMENT', 'PARTIAL REFUND', 'FULL REFUND',
        'CASHCARD\/FLASHPAY', 'CASH REBATE', 'CHARGES DETAILS\:', 'CASH DEPOSIT CDM', 'WITHDRAWAL', 'ATM',
        'CCY CONVERSION FEE', 'AGENT FEE', 'COMM\/COMM', 'COMM \/ COMM', 'IN LIEU', 'SERVICE CHARGE', 'LON DEBIT PURCHASE', 'CREDIT ADVICE',
        'IBG', 'GIRO', 'GIROS', 'COLL', 'PAYROLL', 'GOVT', 'CPF',
        'MEPS', 'RECEIPTS',
        'SUSP A\/C\-TT\-PS',
        'Billing Statement', 'Bank Charges', 'Commission to', 'Received against Inv\.', 'Inward Remittance', 'Received for',
        'Payment\:', 'Fund Transfer from', 'Commission\:', 'Commission in lieu\:', 'Fund Transfer to']

    const sql = `SELECT * FROM "MY_TABLE" where bankname in ('${bankNames.join("', '")}')`

    const {rows} = await client.query(sql);

    client.release();

    // const result: any[] = []
    const map: Map<string, number> = new Map<string, number>()
    const examples: Map<string, any[]> = new Map<string, any[]>()
    const totalRows = rows.length

    let index = 0
    for (const {description: originalDescription, document_id, osome_link, amount} of rows.reverse()) {
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
            if (examplesList.length < 1) {
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
        if (counter >= totalRows / 1000) {
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

    await toCSV(topPatterns, './ocbc-patterns.csv')

    return {
        totalRows,
        coveredRows,
        percentage: (coveredRows * 100 / totalRows).toFixed(2) + '%',
        patternsCount: topPatterns.length,
        patterns: topPatterns
    }
}

