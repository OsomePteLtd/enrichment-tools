import {Request, Response} from 'express';
import {ocbcBank} from "../services/ocbcPatterns.service";
import {dbsBank} from "../services/dbsPatterns.service";
import {uobBank} from "../services/uobPatterns.service";
import {hsbcBank} from "../services/hsbcPatterns.service";
import {paypalBank} from "../services/paypalPatterns.service";
import {transferwiseBank} from "../services/transferwisePatterns.service";
import {aspireBank} from "../services/aspirePatterns.service";
import {starlingBank} from "../services/starlingPatterns.service";
import {coverage, getMatchedRows} from "../services/regexes.service";
import {coverageByNER} from "../services/ner.service";

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

    public async nerCoverage(req: Request, res: Response) {
        try {
            res.json(await coverageByNER());
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

type RegExpression = {field: string, regExp: string, bankname: string}

export default TodosController;