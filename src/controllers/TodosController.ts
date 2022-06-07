import {Request, Response} from 'express';
import {ocbcBank} from "../services/banks/ocbc.service";
import {dbsBank} from "../services/banks/dbs.service";
import {uobBank} from "../services/banks/uob.service";
import {hsbcBank} from "../services/banks/hsbc.service";
import {paypalBank} from "../services/banks/paypal.service";
import {transferwiseBank} from "../services/banks/transferwise.service";
import {aspireBank} from "../services/banks/aspire.service";
import {starlingBank} from "../services/banks/starling.service";
import {coverage, getMatchedRows} from "../services/regexes.service";
import {compareNER, coverageByNER, processBatch} from "../services/ner.service";

class TodosController {

    // manual regexes

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

    // NER

    public async nerCoverage(req: Request, res: Response) {
        try {
            res.json(await coverageByNER());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async nerBatch(req: Request, res: Response) {
        const input: string[] = req.body.input
        try {
            const results = await processBatch(input)
            res.json({ results });
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async nerCompare(req: Request, res: Response) {
        try {
            res.json(await compareNER());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    // banks patterns

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

    public async uob(req: Request, res: Response) {
        try {
            res.json(await uobBank());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async hsbc(req: Request, res: Response) {
        try {
            res.json(await hsbcBank());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async paypal(req: Request, res: Response) {
        try {
            res.json(await paypalBank());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async transferwise(req: Request, res: Response) {
        try {
            res.json(await transferwiseBank());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async aspire(req: Request, res: Response) {
        try {
            res.json(await aspireBank());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

    public async starling(req: Request, res: Response) {
        try {
            res.json(await starlingBank());
        } catch (error) {
            console.log(error)
            res.status(400).send(error);
        }
    }

}

export default TodosController;