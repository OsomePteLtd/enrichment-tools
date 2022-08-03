import pool from "../../dbconfig/dbConnector";
import {getTopPatterns, toCSV} from "../patterns.service";

export async function paypalBank() {
    const client = await pool.connect();

    const bankNames = [
        'Paypal', 'PayPal', 'Paypal Inc', 'PayPal Inc', 'PayPal Inc,', 'PayPal Inc.', 'PayPal, Inc', 'PayPal, Inc.'
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

        'HIB', 'REF', 'INTERNET', 'INTERNET TRANSFER', 'TFR', 'CREDIT INTEREST', 'DD EASY DIRECT DEBITS',
        'Cr', 'Credit', 'DR', 'BP', 'OBP', 'DD',
        'COMMERCIAL CARD', 'VIS', 'COMMISSION', 'INT\'L',
        'Visa Rate', 'Non-Sterling', 'Non-Sterling Transaction Fee',
        'RFLX', 'INSTANT TRF', 'RFLX INSTANT TRF',
        'BIB',
        'CREDIT AS ADVISED', 'STS PYT', 'SVC CHGS', 'ACCOUNT SERVICE FEE', 'CMB',
        'Oversea chrg', 'POST OFFICE COUNTE', 'POSTOFFICE', 'POST OFFICE',
        'FIRST PAYMENT', 'CORP CARD PAYMENT', 'CREDIT CARD',
        'MACHINE', 'MACHINE ABR', 'MACHINE AER', 'MACHINE AB',
        'PYMNT FOR ORDER', 'MONTHLY SERVICE FEE',

        'Chargeback', 'Direct Credit Card Payment', 'Mobile Payment', 'Payment Refund',
        'Payment Review Release', 'Website Payment',
        'General Payment',
        'Pre-approved Payment Bill User Payment', 'Pre-approved Payment Bill', 'Payment Bill', 'User Payment',
        'Express Checkout Payment', 'eBay Auction Payment',
        'Direct Credit Card Payment', 'General Credit Card Deposit', 'General Credit Card Withdrawal',

        'General Authorizations',
        'General Authorizations',
        'Void of Authorizations',
        'Void of Authorizations',
        'ReAuthorization',
        'ReAuthorization',
        'Description',
        'Chargeback',
        'Chargeback',
        'Chargeback Reversal',
        'Chargeback Reversal',
        'PACMAN Buyer cancellation',
        'PACMAN Buyer cancellation',
        'PACMAN Represenment Rejected',
        'PACMAN Represenment Rejected',
        'Payment Reversal',
        'Payment Reversal',
        'Reimbursement of Chargeback',
        'Reimbursement of Chargeback',
        'Chargeback',
        'Chargeback Reversal',
        'PACMAN Buyer cancellation',
        'PACMAN Represenment Rejected',
        'Reimbursement of Chargeback',
        'Cancellation of Hold for Dispute Resolution',
        'Hold on Balance for Dispute Investigation',
        'Cancellation of Hold for Dispute Resolution',
        'Hold on Balance for Dispute Investigation',
        'Payment Reversal',
        'Description',
        'General intraaccount transfer',
        'Transfer To External GL Entity',
        'Receivables financing',
        'Charge-off Adjustment',
        'General Account Adjustment',
        'Incentive Adjustment',
        'Balance Manager Account Bonus',
        'BillPay transaction',
        'BML Credit - Transfer from BML',
        'BML Withdrawal - Transfer to BML',
        'Buyer Credit Payment Withdrawal - Transfer To BML',
        'Bonus for First ACH Use',
        'General Account Correction',
        'Coupon Redemption',
        'Credit Card Cash Back Bonus',
        'Credit Card Deposit for Negative PayPal Account Balance',
        'CC Security Charge Refund',
        'Debit Card Cash Back Bonus',
        'Hidden Virtual PayPal Debit Card Transaction',
        'Reversal of Debit Card Transaction',
        'Electronic Funds Transfer Funding',
        'General Bonus',
        'General Credit Card Deposit',
        'General Credit Card Withdrawal',
        'General Dividend',
        'General Incentive/Certificate Redemption',
        'General Reversal',
        'General withdrawal to not bank entity',
        'General GI/Open wallet Transaction',
        'Gift Certificate Redemption',
        'Instant Payment Review (IPR)reversal',
        'Merchant Referral Account Bonus',
        'MSB Redemption',
        'General PayPal Debit Card Transaction',
        'PayPal Debit Authorization',
        'PayPal Debit Card Cash Advance',
        'Virtual PayPal Debit Card Transaction',
        'Mass Pay Refund',
        'Payment Refund',
        'Generic Instrument/Open wallet Reversals (Buyer side)',
        'Mass Pay Reversal',
        'PayPal Buyer Warranty Bonus',
        'PayPal Debit Card Withdrawal to ATM',
        'PayPal Protection Bonus, Payout for PayPal Buyer Protection, Payout for Full Protection with PayPal Buyer Credit',
        'Points Incentive Redemption',
        'Reversal of ACH Deposit',
        'Reversal of ACH Withdrawal Transaction',
        'Reversal of Points Usage',
        'Generic Instrument/Open wallet Reversals (Seller side)',
        'Reward Voucher Redemption',
        'Consolidation Transfer',
        'ACH funding for Funds Recovery from Account balance',
        'Bank Deposit to PP Account',
        'PayPal Balance Manager Funding of PayPal Account',
        'Auto-sweep',
        'General Withdrawal - Bank Account',
        'World Link withdrawal',
        'Description',
        'Chargeback Fee',
        'Chargeback Fee',
        'General NonPayment Related Fee',
        'General NonPayment Related Fee',
        'Fee Refund',
        'Fee Refund',
        'Fee Reversal',
        'Fee Reversal',
        'Fee for Mass Pay request',
        'Fee for Mass Pay request',
        'Partner Fee',
        'Partner Fee',
        'Payment Fee',
        'Payment Fee',
        'Web Site Payment Pro Account Monthly Fee',
        'Web Site Payment Pro Account Monthly Fee',
        'Fee for Foreign ACH withdrawal',
        'Fee for Foreign ACH withdrawal',
        'Fee for World Link Check withdrawal',
        'Fee for World Link Check withdrawal',
        'Fee Refund',
        'Fee Refund',
        'Gift Certificate Expiration Fee',
        'Gift Certificate Expiration Fee',
        'International CC withdrawal',
        'International CC withdrawal',
        'Warranty Fee for warranty purchase',
        'Warranty Fee for warranty purchase',
        'ATM withdrawal',
        'ATM withdrawal',
        'Auto-sweep from account',
        'Auto-sweep from account',
        'Check withdrawal',
        'Check withdrawal',
        'Dispute Fee',
        'Dispute Fee',
        'Custody Fee',
        'Custody Fee',
        'Bank Return Fee',
        'Bank Return Fee',
        'Description',
        'Other',
        'Other',
        'Description',
        'Display only transaction row',
        'Display only transaction row',
        'Description',
        'Funds Payable',
        'Funds Receivable',
        'Payables and Receivables',
        'Description',
        '3rd Party Auction Payment',
        'Chained Payment/Refund',
        'Direct Credit Card Payment',
        'Donation Payment',
        'eBay Auction Payment',
        'Express Checkout Payment',
        'Buyer Credit Payment',
        'General Buyer Credit Payment',
        'General Payment',
        'Generic Instrument funded Payment',
        'Gift Certificate Payment (Purchase)',
        'Cancelled Transfer',
        'Mass Pay Payment',
        'Mobile Payment',
        'PreApproved Payment Bill User Payment',
        'Digital goods transaction',
        'Non Reference Credit Payment',
        'PayPal Buyer Credit Payment Funding',
        'PayPal Here Payment',
        'Postage Payment',
        'Rebate Payment/Cash Back',
        'Rebate/Cashback reversal',
        'Subscription Payment',
        'Tax collected by Partner',
        'Third Party Payout',
        'Third Party Recoupment',
        'Virtual Terminal Payment',
        'Website Payment',
        'Cryptocurrency',
        'Description',
        '3rd Party Auction Payment',
        'Chained Payment/Refund',
        'Direct Credit Card Payment',
        'Donation Payment',
        'eBay Auction Payment',
        'Express Checkout Payment',
        'Buyer Credit Payment Withdrawal - Transfer To BML',
        'General Buyer Credit Payment',
        'General Payment',
        'Generic Instrument funded Payment',
        'Gift Certificate Payment(Purchase)',
        'Cancelled Transfer',
        'Mass Pay Payment',
        'Mobile Payment',
        'PreApproved Payment Bill User Payment',
        'Digital goods transaction',
        'Non Reference Credit Payment',
        'PayPal Buyer Credit Payment Funding',
        'PayPal Here Payment',
        'Postage Payment',
        'Rebate Payment/Cash Back',
        'Rebate/Cashback reversal',
        'Subscription Payment',
        'Tax collected by Partner',
        'Third Party Payout',
        'Third Party Recoupment',
        'Virtual Terminal Payment',
        'Website Payment',
        'Cryptocurrency',
        'Description',
        'Funds Payable',
        'Funds Receivable',
        'Payables and Receivables',
        'Description',
        'Account Hold for ACH deposit',
        'Blocked Payments',
        'External Hold',
        'General Account Hold',
        'General Hold',
        'General Hold Release',
        'Hold on Available Balance',
        'Gift Certificate Purchase',
        'Gift Certificate Redemption',
        'Account Hold for Open Authorization',
        'Payment Hold',
        'Payment Review Hold',
        'Reversal of General Account Hold',
        'Payment Release',
        'Payment Review Release',
        'External Release',
        'Description',
        'Reserve Hold',
        'Reserve Release',
        'Description',
        'Reserve Hold',
        'Reserve Release',
        'Description',
        'Conversion to Cover Negative Balance',
        'Conversion to Cover Negative Balance',
        'General Currency Conversion',
        'General Currency Conversion',
        'User Initiated Currency Conversion',
        'User Initiated Currency Conversion',
        'Description',
        'General intraaccount transfer',
        'Transfer To External GL Entity',
        'Receivables financing',
        'General Account Adjustment',
        'Incentive Adjustment',
        'Balance Manager Account Bonus',
        'BillPay transaction',
        'BML Credit - Transfer from BML',
        'BML Withdrawal - Transfer to BML',
        'Buyer Credit Payment',
        'Bonus for First ACH Use',
        'General Bonus',
        'CC Security Charge Refund',
        'Charge-off Adjustment',
        'General Account Correction',
        'Coupon Redemption',
        'Credit Card Cash Back Bonus',
        'Credit Card Deposit for Negative PayPal Account Balance',
        'PayPal Debit Authorization',
        'Debit Card Cash Back Bonus',
        'General PayPal Debit Card Transaction',
        'Virtual PayPal Debit Card Transaction',
        'Electronic Funds Transfer Funding',
        'General Credit Card Deposit',
        'General Credit Card Withdrawal',
        'General Dividend',
        'General Incentive/ Certificate Redemption',
        'General Reversal',
        'General withdrawal to not bank entity',
        'General GI/Open wallet Transaction',
        'Gift Certificate Redemption',
        'Instant Payment Review (IPR)reversal',
        'Merchant Referral Account Bonus',
        'MSB Redemption',
        'Hidden Virtual PayPal Debit Card Transaction',
        'PayPal Debit Card Withdrawal to ATM',
        'Reversal of Debit Card Transaction',
        'Mass Pay Refund',
        'Payment Refund',
        'Generic Instrument/Open wallet Reversals (Buyer side)',
        'Mass Pay Reversal',
        'PayPal Protection Bonus, Payout for PayPal Buyer Protection, Payout for Full Protection with PayPal Buyer Credit',
        'PayPal Buyer Warranty Bonus',
        'PayPal Debit Card Cash Advance',
        'Points Incentive Redemption',
        'Reversal of ACH Deposit',
        'Reversal of ACH Withdrawal Transaction',
        'Reversal of Points Usage',
        'Generic Instrument/Open wallet Reversals (Seller side)',
        'Reward Voucher Redemption',
        'Consolidation Transfer',
        'ACH funding for Funds Recovery from Account balance',
        'Bank Deposit to PP Account',
        'PayPal Balance Manager Funding of PayPal Account',
        'Auto-sweep',
        'General Withdrawal - Bank Account',
        'World Link withdrawal',
        'Description',
        'Account Hold for ACH deposit',
        'External Hold',
        'General Account Hold',
        'General Hold',
        'General Hold Release',
        'Hold on Available Balance',
        'Gift Certificate Purchase',
        'Gift Certificate Redemption',
        'Reversal of General Account Hold',
        'Account Hold for Open Authorization',
        'Payment Hold',
        'Payment Review Hold',
        'Blocked Payments',
        'Payment Release',
        'Payment Review Release',
        'External Release'
    ]

    const {totalRows, topPatterns, coveredRows} = await getTopPatterns(client, bankNames, transactionCodes, commands)

    await toCSV(topPatterns, './paypal-patterns.csv')

    return {
        totalRows,
        coveredRows,
        percentage: (coveredRows * 100 / totalRows).toFixed(2) + '%',
        patternsCount: topPatterns.length,
        patterns: topPatterns
    }
}