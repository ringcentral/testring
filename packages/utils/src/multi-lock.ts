
/**
 * manages multi-count lock for multiple Ids - holds total count of locks & manages its change
 * 
 * during init max total lock amount can be set defaulted to 1
 *  
 * on any given id lock can be acquired and released in the future
 * all locks can be cleared for specified id 
 */
export class MultiLock {

    private lockHash: Map<string, number> = new Map();
    private lockLength: number = 0;

    /**
     * 
     * @param lockLimit - max amount of locks for all ids
     */
    constructor(public lockLimit: number = 0) { }

    /**
    * try to one acquire lock - if lock acquired returns true otherwise false
    * 
    * @param {string} id  - lockID
    */
    acquire(id: string): boolean {

        if (this.lockLimit !== 0 && this.lockLength >= this.lockLimit) {
            return false;
        }
        const val = this.lockHash.get(id) || 0;
        this.lockHash.set(id, val + 1);
        this.lockLength += 1;
        return true;
    }
    /**
     * releases one lock for given id 
     * 
     * @param {string} id  - lockID
     */
    release(id: string): boolean {
        const val = this.lockHash.get(id);
        if (!val) {
            return false;
        }
        if (val === 1) {
            this.lockHash.delete(id);
        } else {
            this.lockHash.set(id, val - 1);
        }
        this.lockLength -= 1;
        return true;
    }

    /**
     * unlocks all locks for given Id
     * 
     * @param {string|void} id  - lockID
     */
    clean(id: string | void) {
        if (id) {
            const count = this.lockHash.get(id) || 0;
            this.lockHash.delete(id);
            this.lockLength -= count;
            return;
        }
        this.lockHash.forEach((_, key) => {
            this.lockHash.delete(key);
        });
        this.lockLength = 0;
    }

    /**
     * if given a string, returns lock amount for that id else returns total amount for all ids in sum
     * 
     * @param {string|void} id  - lockID
     */
    getSize(id: string | void): number {
        if (id) {
            return this.lockHash.get(id) || 0;
        }
        return this.lockLength;
    }
    /**
     * return map if given a string, returns lock amount for that id else returns total amount for all ids in sum
     * 
     */
    getIds() {
        return new Map<string, number>(this.lockHash);
    }
}
