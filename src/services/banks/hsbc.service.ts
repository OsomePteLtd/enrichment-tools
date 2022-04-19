import pool from "../../dbconfig/dbConnector";
import {getTopPatterns, toCSV} from "../patterns.service";

export async function hsbcBank() {
    const client = await pool.connect();

    const bankNames = [
        'HSBC', 'HSBC BANK', 'HSBC Bank (China) Company Limited', 'HSBC Bank Limited', 'HSBC Bank Plc', 'HSBC Bank (Singapore) Limited', 'HSBC Business Direct', 'HSBC Offshore', 'HSBC Sprint Account Statement', 'HSBC UK Bank PLC', 'The Hongkong and Shanghai Banking Corporation Limited',
        'The Hongkong and Shanghai Banking Corporation', 'The Hongkong and Shanghai Banking Corporation Limited', 'The Hongkong And Shanghai Banking Corporation Limited', 'The HongKong and Shanghai Banking Corporation Limited', 'The Hongkong & Shanghai Banking Corporation Limited', 'The Hong Kong & Shanghai Banking Corporation Limited'
    ]
    const transactionCodes: string[] = [
        'BEXP', 'BONU', 'CBTV', 'CCRD', 'CHAR', 'COLL', 'COMM', 'CPKC', 'CSDB', 'DCRD', 'DIVD',
        'DNTS', 'EDUC', 'FCPM', 'OTHR', 'PHON', 'PTXP', 'RDTX', 'REBT', 'REFU', 'RENT', 'SALA', 'STDY', 'FWLV', 'GDDS',
        'GOVI', 'GSTX', 'HSPC', 'IHRP', 'INSU', 'INTC', 'INTE', 'INVS', 'IVPT', 'LOAN', 'MDCS', 'NITX', 'SUPP', 'TAXS',
        'TBIL', 'TCSC', 'TRAD', 'TREA', 'TRPT', 'UBIL', 'WHLD',
    ]
    const commands = [
        'CALL', 'A\/C', 'A \/ C', 'DEP', 'WDL',
        'CHECK', 'CHECKING',
        'FAST', 'PAYMENT', 'FUND', 'TRANSFER', 'CHARGES', 'REVERSAL', 'REBATE', 'CHARGE', 'CHEQUE', 'DEPOSIT', 'DISBURSEMENT',
        'TRANS CHARGE', 'BILL PAYMENT', 'NETS', 'POS', 'IACH', 'OD INT',
        'DEBIT', 'CREDIT', 'PURCHASE', 'PAYMENT\/TRANSFER', 'STATEMENT', 'SALARY', 'SETTLEMENT', 'PARTIAL REFUND', 'FULL REFUND',
        'CASHCARD\/FLASHPAY', 'CASH REBATE', 'CHARGES DETAILS', 'CASH DEPOSIT', 'CASH DEPOSIT CDM', 'WITHDRAWAL', 'ATM',
        'SERVICE CHARGE', 'LON DEBIT PURCHASE', 'CREDIT ADVICE',
        'CCY CONVERSION FEE', 'AGENT FEE',
        'INTERBANK GIRO', 'IBG', 'GIRO', 'GIROS', 'PAYROLL', 'GOVT', 'CPF', 'HTSG', 'BEXP', 'OTHR', 'IRAS',
        'MEPS', 'RECEIPTS', 'MEPS RECEIPT MER', 'Advice MEPS Payment',
        'Billing Statement', 'Bank Charges', 'Commission to', 'Received against Inv\.', 'Inward Remittance', 'Received for',
        'Payment\:', 'Fund Transfer from', 'Commission\:', 'Commission in lieu\:', 'Fund Transfer to',

        'REMITTANCE TRANSFER OF FUNDS', 'REMITTANCE TRANSFER OF FUNDS RTF', 'REMITTANCE RTF',
        'TRANSFER REMITTANCE',
        'INWARD TELEGRAPHIC TRANSFER', 'INWARD TELEGRAPHIC TRANSFER AGENT', 'INWARD TELEGRAPHIC TRANSFER COMM IB CHARGES', 'ITT', 'ITT CHG',
        'OUTWARD TELEGRAPHIC TRANSFER', 'OUTWARD TELEGRAPHIC TRANSFER COMM \& CHARGES', 'OUTWARD TELEGRAPHIC TRANSFER AGENT CHARGES',
        'AUTOSAVE TRANSFER FEE',
        'TRANSFER AGENT CHGS',
        'TRANSFER TO OTHER DBS A\/CS',
        'Advice Service Charge for FAST Payment',
        'Advice FAST Payment',
        'Advice Inward Telegraphic Transfer',
        'Advice Inward Telegraphic Transfer Comm \& Charges',
        'Advice Inward Telegraphic Transfer Agent Charges',
        'Advice Outward Telegraphic Transfer',
        'Advice Outward Telegraphic Transfer Comm \& Charges',
        'Advice Outward Telegraphic Transfer Agent Charges',
        'Inbound transfer ID\:',
        'Outbound transfer ID\:',
        'Advice Funds Transfer',
        'SERVICE CHARGE FOR FAST PAYMENT',
        'POINT\-OF\-SALE', 'POINT\-OF\-SALE TRANSACTION', 'SERVICE CHARGE FOR PROCESSING OF IDEAL TRANSACTIONS SCIDEAL',
        'GIRO DBS CARD CENTER DCC PAYMENT', 'SUPPLIER PAYMENT',
        'TRANSFER OF FUND TRF', 'TRANSFER CHGS', 'TRANSFER DR', 'TRANSFER CR',
        'QUICK CHEQUE DEPOSIT QCDM',
        'Payment to',
        'Refund',
        'BUSINESS ADVANCE CARD TRANSACTION',
        'BUSINESS ADVANCE CARD TRANSACTION BAT',
        'Card payment Card\:',
        'Debit Card Transaction',
        'Inward PayNow', 'Inward PayNow Transfer',
        'MEPS PAYMENT COMM & CHARGES', 'MEP',
        'STANDING ORDER INSTRUCTION \/ SERVICE FEE',
        'Loan agreement', 'Consulting fees',
        'Salary payment',
        'SERVICE CHARGE SC',
        'Point\-of\-Sale Transaction',
        'CashCard\/FlashPay',
        'IDEAL INVOICE PAYMENT', 'INVOICE PAYMENT', 'CASH DISBURSEMENT', 'INTEREST REPAYMENT',
        'IDEAL BUSINESS EXPENSES', 'IDEAL COMMISSION', 'IDEAL CASH', 'IDEAL SALARY PAYMENT', 'SALARY PAYMENT',
        'IDEAL PURCHASE SALE OF GOODS', 'IDEAL MONTHLY SERVICE FEE',
        'PLUS ATM Transaction Cash Withdrawal', 'Service Charge', 'ATM Transaction', 'Cash Withdrawal',
        'FAST Payment \/ Receipt',
        'Advice Service Charge for Processing of Ideal Transactions',

        'FUNDS TRANSFER', 'FUNDS TRF', 'Funds Trf', 'FUNDS TRA', 'FUNDS TRE',
        'Inward Cr', 'Inward CR', 'Inward DR', 'Inward Credit', 'INWARD TRF', 'Inward TT', 'Outward TT', 'Misc DR',
        'SERV CHARGE', 'Service Charge',
        'Misc Credit BIL', 'Misc Debit', 'Misc Credit', 'Misc DR\-Debit Card', 'Misc DR \- Debit Card',
        'PAYNOW', 'CR Retail', 'IPT',
        'SVC Chg', 'Serv Charge', 'Debit Adj', 'Funds Transfer-IB', 'Salary', 'Transaction Rebate',
        'Point of Sale Transaction', 'NETS Debit', 'Single Svc Reb', 'Cash Disb', 'WDRL',

        'GG', 'HIB', 'REF', 'INTERNET', 'INTERNET TRANSFER', 'TFR', 'CREDIT INTEREST', 'DD EASY DIRECT DEBITS',
        'CR', 'Cr', 'Credit', 'DR', 'BP', 'OBP', 'DD',
        'COMMERCIAL CARD', 'VIS', 'COMMISSION', 'INT\'L',
        'Visa Rate', 'Non-Sterling', 'Non-Sterling Transaction Fee',
        'RFLX', 'INSTANT TRF', 'RFLX INSTANT TRF',
        'BIB',
        'CREDIT AS ADVISED', 'STS PYT', 'SVC CHGS', 'ACCOUNT SERVICE FEE', 'CMB',
        'Oversea chrg', 'POST OFFICE COUNTE', 'POSTOFFICE', 'POST OFFICE',
        'FIRST PAYMENT', 'CORP CARD PAYMENT', 'CREDIT CARD',
        'MACHINE', 'MACHINE ABR', 'MACHINE AER', 'MACHINE AB',
        'PYMNT FOR ORDER', 'MONTHLY SERVICE FEE',

        'INTERNATIONAL',
    ]

    const {totalRows, topPatterns, coveredRows} = await getTopPatterns(client, bankNames, transactionCodes, commands)

    await toCSV(topPatterns, './hsbc-patterns.csv')

    return {
        totalRows,
        coveredRows,
        percentage: (coveredRows * 100 / totalRows).toFixed(2) + '%',
        patternsCount: topPatterns.length,
        patterns: topPatterns
    }
}