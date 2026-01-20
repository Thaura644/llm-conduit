import { ConduitDatabase } from './db';

export class KnowledgeBase {
    constructor(private db: ConduitDatabase) { }

    async addRecord(category: string, content: string): Promise<void> {
        const id = `kb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        this.db.addRecord({ id, category, content });
    }

    async getKnowledgeContext(): Promise<string> {
        const records = this.db.getRecords();
        if (records.length === 0) {
            return 'No organizational knowledge records available.';
        }

        return records
            .map((r: any) => `[${r.category}]\n${r.content}`)
            .join('\n\n---\n\n');
    }

    getRecords() {
        return this.db.getRecords();
    }

    deleteRecord(id: string) {
        this.db.deleteRecord(id);
    }
}
