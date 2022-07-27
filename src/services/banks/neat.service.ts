import pool from "../../dbconfig/dbConnector";
import {getTopPatterns, toCSV} from "../patterns.service";

export async function neatBank() {
    const client = await pool.connect();

    const bankNames = [
        'Neat Limited', 'Neat Ltd.'
    ]
    const transactionCodes: string[] = []
    const commands = [
        'Fee',
        'Refund',
        'Payment to', 'Pa y ment to', 'Pa ment to',
        'Payment from', 'Pa y ment from', 'Pa ment fro m', 'Pa y ment fro m',
        'Payment', 'Pa y et', 'Christian Pa y et',
        'Payout', 'Pa y o ut', 'Pa y out',
        'Refund',
        'Converted and transferred to', 'Conve ted and transferred to',
        'cash rebate',
        'Neat Business Card Subscription',
        'Neat Card Monthl y', 'Neat Card Monthly', 'NeatCardMonthly1',
        'Cashback',
        'TEMPORARY HOLD',

        // 'Adyen N.V.',
        // 'Alice Sayer',
        //
        // 'Alibaba', 'Alibaba.com', 'ALIBABA.COM',
        //
        // 'AliExpress', 'Aliexpress Com',
        //

        'Amazon', 'Amazon.co.uk', 'Amazon Marketplace', 'Amazon Payments', 'Amazon Payments Uk',

        'AMAZON PAYMENTS EUROPE S.C.A', 'Amazon Prime', 'AMAZON SERVICES INTERNATIONAL', 'AMAZON UK RETAIL',
        'Amazon Web Services', 'Amz corp ltd (Funds)', 'Amz corp ltd (G)',  'Amz corp ltd (money)',
        'Amz corp ltd (Monthly spending)', 'Amz corp ltd (payment returned)', 'Amz corp ltd (Revolut Vat)',
        'Amz corp ltd (Spending)', 'Amz corp ltd (Vat)', 'Amz corp ltd (VAT payments )', 'AMZN AD', 'AMZN Digital',
        'AMZNMktplace', 'AMZNMKTPLACE', 'AMZNMKTPLACE', 'AMZNMktplace', 'Amzn Mktp', 'Ama z o n web serv ices',

        'American Expr', 'American Express',

        "American Express",

        // 'APPLE.COM/BILL',
        // 'Aqua Card',
        // 'Argos', 'ARGOS',
        // 'Asda', 'ASDA',
        // 'ASOS',
        // 'ATOZ ESSENTIALS UK',
        // 'Barclaycard', 'Barclays',
        // 'B&M', 'B M',
        // 'Bolt', 'BOLT',
        // 'Boots', 'BOOTS',
        // 'Bounce Back Loan',
        // 'BP',
        // 'B&Q',

        'Clearpay Finance L',

        "Payments",
        "Amazon",

        "Stripe",
        "\\(STRIPE\\)",
        "STRIPE PAY MENTS",
        "STRIPE",

        "\\(SHOPIFY\\)",
        "Parcel2go",
        "PayPal",
        "Adyen",
        "PAYPAL",
        "Google",
        "PAYMENT",
        "Paypal",
        "KULTKID\\)",
        "Hermes",
        "Facebook",
        "Mail",
        "Royal",
        "Aliexpress",
        "Office",
        "Tesco",
        "Post",
        "PAYMENTS",
        "AMAZON",
        "GoCardless",
        "Shopify",
        "EUROPE",
        "S\\.C\\.A",
        "American",
        "Marketplace",
        "Packlink",
        // "ONLINE",
        "Clearpay",
        "Finance",
        "Home",
        "Capital",
        "Skxn",
        "Uber",
        "Hermesparce",
        "\\(monies\\)",
        "Boots",
        "Bargains",
        "Loan",
        "Procrast",
        "Jack",
        "Knowles",
        "Sayer",
        "Back",
        "Starling",
        "FASTER",
        "\\(Transfer\\)",
        "Tropicanafitness\\.C",
        "Ebay",
        "SHOPIFY",
        "Argos",
        "Sales",
        "Suttoncoldfie",
        "Rich",
        "GIRO",
        "Sebastian",
        "Alibaba",
        // "Card",
        "Rosario",
        "Deli",
        "Palm",
        "DIRECT",
        "Lisbeth",
        // "from",
        "Pertemps",
        // "Limited",
        "Shipbob",
        "TransferWise",
        "Cash",
        "Interest",
        "Luxembourg",
        "Bounce",
        "Wise",
        "Fleurtations",
        "Dublin",
        "Muscle",
        "Finesse",
        "Monzo",
        "iHerb",
        "UBER",
        "CONTACTLESS",
        "HOUNSLOW",
        "Williams",
        "Asda",
        "Gorpets",
        "Machine",
        "Toys",
        "Curve",
        // "Bank",
        "Klarna",
        "iTunes",
        "Smyths",
        "Sainsbury\\'s",
        "Lambert",
        "Nyheke",
        "Rebate",
        "Superstores",
        "\\(Rich",
        "Marks",
        "Adobe",
        "Technologies",
        "AliExpress",
        "Huboo",
        "Spencer",
        // "Services",
        "DEBIT",
        "\\(RichSkxn",
        // "LIMITED",
        "Kent",
        "Loan\\)",
        "Fiverr",
        "Superdrug",
        "Screwfix",
        "Vincent",
        "Sent",
        "Bolt",
        // "Online",
        "Capitalontap",
        "Wilko",
        "Account",
        "\\(Taxify\\)",
        "Osome",
        "Logistics",
        "Iceland",
        "Helium10",
        "Just",
        "loan\\)",
        "corp",
        "Sftw",
        "FACEBK",
        "fb\\.me\\/ads",
        "RECEIVED",
        // "THANK",
        "Coffee",
        "\\(INVESTMENT\\)",
        "Jeremyshome",
        "\\(Bounce",
        "HMRC",
        "\\(XID006HK\\)",
        "\\(TRNFR",
        "Holland",
        "Barrett",
        // "Company",
        "\\(Weekly",
        "MERAKI\\.\\)",
        "\\*TRIP",
        "Rawlins",
        "Sarl",
        // "Software",
        "Organics",
        "GOOGLE",
        "Thomas",
        "Trade",
        "Klaviyo",
        // "James",
        "Jens",
        "Ejler",
        "Hannibal",
        "\\(Munz\\)",
        "Barclaycard",
        "PAYMENT\\/TRANSFER",
        "Charge",
        "Upwork",
        "Xero",
        "CREDIT",
        "Morrisons",
        "Organics\\)",
        "Ppoint_\\*vitae",
        "Fortis",
        "Ltlondon",
        "White",
        "\\(Sent",
        "Transfer",
        "Shop",
        "Robert",
        "Internet",
        "ELLENS",
        "Ltd\\)",
        "Petrol",
        "Maison",
        "LOAN\\)",
        "KENT",
        "BLACK",
        "\\(DANIEL",
        "KENT\\)",
        "Westbound",
        // "Limi",
        "Shokeye",
        "Luxplus",
        "Inc\\.",
        "Waitrose",
        "\\(emergency\\)",
        "Alibaba\\.com",
        "CODE",
        "\\(LOAN\\)",
        "Play",
        "HAYES",
        "CSDB",
        "MINDBODY",
        "Ecommerce",
        "Inkthreadable",
        "SumUp",
        "\\(loan",
        "HSBC",
        "Collaredcreatures\\.",
        // "SERVICES",
        "7worlds",
        "Khan",
        "INTERNATIONAL",
        "McDonald\\'s",
        "Ecomm",
        "Madrid",
        "Cloud",
        "Corner",
        "EATS",
        "Top\\-Up",
        "Elisabeth",
        "repayment\\)",
        "Stax",
        "Centres",
        "\\(Subscription",
        "Igen",
        "Entrepreneur",
        "NDJAMBA",
        "Dyas",
        "Shell",
        "eBay",
        "Maxx",
        "Alice",
        "DAVID",
        "PENDING",
        "CHAN",
        "Aqua",
        "Fulfilmentcrowd",
        "\\(Revolut",
        "Vat\\)",
        "Onegooddeal",
        "MARKETING",
        "Apps",
        "INCO"

    ]

    const {totalRows, topPatterns, coveredRows} = await getTopPatterns(client, bankNames, transactionCodes, commands)

    await toCSV(topPatterns, './neat-patterns.csv')

    return {
        totalRows,
        coveredRows,
        percentage: (coveredRows * 100 / totalRows).toFixed(2) + '%',
        patternsCount: topPatterns.length,
        patterns: topPatterns
    }
}