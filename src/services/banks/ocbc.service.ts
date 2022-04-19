import pool from "../../dbconfig/dbConnector";
import {getTopPatterns, toCSV} from "../patterns.service";

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

    const {totalRows, topPatterns, coveredRows} = await getTopPatterns(client, bankNames, transactionCodes, commands)

    await toCSV(topPatterns, './ocbc-patterns.csv')

    return {
        totalRows,
        coveredRows,
        percentage: (coveredRows * 100 / totalRows).toFixed(2) + '%',
        patternsCount: topPatterns.length,
        patterns: topPatterns
    }
}

