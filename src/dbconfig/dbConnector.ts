import { Pool } from 'pg';

export default new Pool ({
    max: 20,
    connectionString: 'postgres://user:password@localhost:5414/enrique-test',
    idleTimeoutMillis: 30000
});