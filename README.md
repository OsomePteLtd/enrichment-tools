# Enrichment tools

## Why?

This repository aims to collect all the supporting scripts being used to empower the main development process

## What?

Approximate list of developed functions in this repo:
- **Classification patterns generators**
  - !!! make sure that the local Postgres table MY_TABLE is created and initialized with the actual data
  - Approach: recursive generation from seed strings
  - `src/services/patterns.service.ts` - base service being used in corresponding bank implementations
  - `src/services/banks/*.service.ts` - list of implementations (one per bank) extracting classification patterns from bank transactions' descriptions
  - To get the results use following routes from browser or Postman (`http://localhost:4000`):
    * `/banks/ocbc` - get patterns for OCBC bank
    * `/banks/dbs` - ...
    * `/banks/uob` -  ...
    * `/banks/hsbc` - ...
    * `/banks/paypal` - ...
    * `/banks/wise` - ...
    * `/banks/aspire` - ...
    * `/banks/starling` - ...
    * `/banks/neat` - ...
    * ... to be continued :D
- **Extraction of the Global contacts:**
  - !!! make sure that the local Postgres tables "MY_TABLE" and "contacts" is created and initialized with the actual data
  - Algorithms: Jaro-Winkler distance, Aho-Corasick, lots of small heuristics to preprocess and filter data
  - `src/services/globalContacts.service.ts` - all code is here
  - To get the results use following routes from browser or Postman (`http://localhost:4000`):
    * `/global-contacts` - response have to look like the content of the `global-contacts_2022-10-20.json` file
- **Increasing the number of extracted invoice references**
  - Idea: modify original invoice numbers to have more occurrences in bank transactions' descriptions
  - Algorithms: Jaro-Winkler distance, lots of small heuristics to preprocess and filter data
  - `src/services/searchReference.service.ts` - all code is here
- **Check bank statement balance convergence**
  - Condition: sum of line-items equals to the difference of its opening and closing balances
  - Result: subset of line-items (sum of which gives the exact convergence) 
  - Features: balances could be **negative** and **non-integer**
  - Algorithm: [0-1 Knapsack problem](https://en.wikipedia.org/wiki/Knapsack_problem#0-1_knapsack_problem) 
  - `src/services/knapsack.service.ts` - all code is here
  - `tide-bank-statement.json` - example of recognized Tide bank statement appropriate to be used as an input 
  - states of the dynamic programming execution are stored in files `states/XXX.json` (as it is too huge to store in RAM) 
  - To get the results use following routes from browser or Postman (`http://localhost:4000`):
    * `/knapsack` - the more line-items BS has the longer it will execute
- **Run NER (Named Entity Recognition) on the whole list of bank transactions**
  - !!! make sure that the local Postgres table MY_TABLE is created and initialized with the actual data
  - roBERTa-NER model is used
  - model should be built in Docker and run on port `https://localhost:80`
  - `src/services/ner.service.ts` - all code is here

## How to start?

1. Initialize SQL DB according to the connection params in `src/dbconfig/dbConnector.ts`

2. "MY_TABLE" stores the list of bank statements' transactions:
```postgresql
create table "MY_TABLE"
(
  bankname    text,
  description text,
  amount      double precision,
  direction   text,
  osome_link  text,
  document_id serial
);
```
3. To get actual list of bank statements' transactions from Core DB:
```postgresql
select details ->> 'bankName' as bankName,
       lineitems.description,
       lineitems.amount,
       case
           when lineitems.amount >= 0 then 'out' else 'in' end as direction,
       'https://agent.osome.team/companies/' || "companyId" || '/documents/' || id osome_link,
       id as document_id
from documents,
  jsonb_to_recordset(documents.details -> 'lineItems') AS lineitems(description text, amount float)
where true
    and subcategory = 'bankStatement'
    and details -> 'externalDetails' ->> 'source' = 'bluesheets'
    and "createdAt" between '2022-6-11' and now()
    and details ->> 'bankName' is not null
    and lineitems.description is not null
    and lineitems.amount != 0
    and details -> 'lineItems' -> 0 ->> 'description' is not null
order by 1 desc, 4 desc, 2 desc;
```
4. ```npm i && npm start```