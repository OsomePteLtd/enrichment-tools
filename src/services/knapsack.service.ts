const fs = require('fs');

function toInteger(x: number) {
    return (((x) * 100) | 0)
}

type Item = { amount: number}
type State = {l: number, p: number}

export async function execute(sum: number = 5) {
    let raw = fs.readFileSync('tide-bank-statement.json');
    let {lineItems, openingBalance, closingBalance} = JSON.parse(raw);

    lineItems.reverse()

    // const diff = toInteger(closingBalance - openingBalance)
    // console.log('DIFF = ' + diff)

    const items: Item[] = lineItems.map((lineItem: {amount: number}) => ({
        amount: toInteger(lineItem.amount)
    }))

    // const state = solve(toInteger(openingBalance), toInteger(closingBalance), items)
    // const state: State = { l: 340, p: 46429 }
    // console.log('END state', state)

    // const path = getPath(items.length, toInteger(closingBalance))
    // fs.writeFileSync('states/path.json', JSON.stringify(path))
    const rawPath = fs.readFileSync('states/path.json');
    const path = JSON.parse(rawPath);

    for (let i = 1; i < path.length; i++) {
        if (path[i] - 1 != path[i - 1]) {
            const index = path[i] - 1
            console.log(lineItems.length - 1 - index)
            console.log(lineItems[index])
        }
    }

    let acc = toInteger(openingBalance)
    for (const p of path) {
        console.log('ACC = ' + (acc / 100))
        acc += toInteger(lineItems[p].amount)
    }
    console.log('closingBalance = ' + closingBalance)
}

function getNextMapIndex(i: number) {
    return (i + 1) % 2
}

function solve(startSum: number, endSum: number, items: {amount: number}[]) {
    const states = [
        new Map<number, State>([[startSum, {l: 0, p: -1}]]),
        new Map<number, State>([])
    ]

    let currMap = 0
    let nextMap = getNextMapIndex(currMap)
    fs.writeFileSync('states/0.json', JSON.stringify([...states[currMap].entries()]))

    for (let i = 0; i < items.length; i++) {
        const item = items[i]

        console.log('i = ' + i)
        console.log('currMap = ' + currMap)
        console.log('keys = ' + states[currMap].size)
        console.log('')

        for (const sum of states[currMap].keys()) {
            const currentState = states[currMap].get(sum)!

            const toState1 = sum
            if (states[nextMap].has(toState1)) {
                const oldValue = states[nextMap].get(toState1)!
                if (oldValue.l < currentState.l) {
                    states[nextMap].set(toState1, { l: currentState.l, p: sum })
                }
            } else {
                states[nextMap].set(toState1, { l: currentState.l, p: sum })
            }

            const toState2 = sum + item.amount
            if (states[nextMap].has(toState2)) {
                const oldValue = states[nextMap].get(toState2)!
                if (oldValue.l < currentState.l + 1) {
                    states[nextMap].set(toState2, { l: currentState.l + 1, p: sum })
                }
            } else {
                states[nextMap].set(toState2, { l: currentState.l + 1, p: sum })
            }
        }

        fs.writeFileSync('states/' + (i + 1) + '.json', JSON.stringify([...states[nextMap].entries()]))

        currMap = nextMap
        nextMap = getNextMapIndex(currMap)
        states[nextMap].clear()
    }

    return states[currMap].get(endSum)
}

function getPath(itemsCount: number, sum: number) {
    let curr = sum
    let answer = []
    for (let i = itemsCount; i > 0; i--) {
        console.log('i = ' + i)
        let raw = fs.readFileSync('states/' + i + '.json');
        let entries = JSON.parse(raw);

        const map = new Map<number, State>(entries)
        const state = map.get(curr)!
        if (state.p != curr) {
            answer.push(i - 1)
        }

        curr = state.p
    }

    return answer.reverse()
}

