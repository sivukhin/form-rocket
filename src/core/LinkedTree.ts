import {Tree, Path} from "./Tree";

type LinkedTreesArgs = {
    [key: string]: Tree;
}

type LinkedTreesPath<TLinkedTrees> = {
    [P in keyof TLinkedTrees]: Path[];
}

type LinkedTree<TLinkedTrees extends LinkedTreesArgs> = {
    [P in keyof TLinkedTrees]: Tree;
} & {
    connect(nodes: Partial<LinkedTreesPath<TLinkedTrees>>): void;
    connections(nodes: Partial<LinkedTreesPath<TLinkedTrees>>): LinkedTreesPath<TLinkedTrees>;
}

function getKey(treeName: string, path: Path) {
    return treeName + ":" + path.join(".");
}

function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
    if (a.size > b.size) {
        return intersect(b, a);
    }
    const result = new Set<T>();
    a.forEach(x => {
        if (b.has(x)) {
            result.add(x);
        }
    });
    return result;
}

export function createLinkedTree<TLinkedTrees extends LinkedTreesArgs>(trees: TLinkedTrees): LinkedTree<TLinkedTrees> {
    const connections: Map<string, Set<string>> = new Map();
    return {
        ...trees,
        connect(nodes: LinkedTreesPath<TLinkedTrees>) {
            for (const sourceTree of Object.keys(nodes)) {
                for (const targetTree of Object.keys(nodes)) {
                    if (sourceTree === targetTree) {
                        continue;
                    }
                    for (const a of nodes[sourceTree]) {
                        for (const b of nodes[targetTree]) {
                            const sourceKey = getKey(sourceTree, a);
                            const targetKey = getKey(targetTree, b);
                            if (!connections.has(sourceKey))
                                connections.set(sourceKey, new Set());
                            connections.get(sourceKey).add(targetKey);
                        }
                    }
                }
            }
        },
        connections(nodes: LinkedTreesPath<TLinkedTrees>): LinkedTreesPath<TLinkedTrees> {
            let intersection: Set<string> | null = null;
            for (const sourceTree of Object.keys(nodes)) {
                for (const a of nodes[sourceTree]) {
                    const key = getKey(sourceTree, a);
                    const current = connections.has(key) ? connections.get(key) : new Set<string>();
                    if (intersection == null) {
                        intersection = current;
                    } else {
                        intersection = intersect(intersection, current);
                    }
                }
            }
            // @ts-ignore
            const result: LinkedTreesPath<TLinkedTrees> = Object.fromEntries(Object.keys(trees).map(x => [x, []]));
            intersection.forEach(x => {
                const [treeName, pathString] = x.split(":");
                const path = pathString.split(".");
                if (!result.hasOwnProperty(treeName)) {
                    // @ts-ignore
                    result[treeName] = [];
                }
                result[treeName].push(path);
            })
            return result;
        }
    };
}