export class Node<T> {
    data: T;

    next?: Node<T>;
    alternates: Node<T>[];

    constructor(data: T) {
        this.data = data;
        this.alternates = [];
    }

    addAlternates(node: Node<T>): void {
        this.alternates.push(node);
    }
}
