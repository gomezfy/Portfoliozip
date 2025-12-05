const { Client } = require('pg');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.NEON_DATABASE_URL;
    
    if (!databaseUrl) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Database not configured' })
        };
    }

    let data;
    try {
        data = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid JSON' })
        };
    }

    const name = (data.name || 'Anônimo').trim().substring(0, 20) || 'Anônimo';
    const score = parseInt(data.score) || 0;

    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        await client.query(`
            CREATE TABLE IF NOT EXISTS leaderboard (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                score INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(
            'INSERT INTO leaderboard (name, score) VALUES ($1, $2)',
            [name, score]
        );

        const result = await client.query(`
            SELECT name, score, TO_CHAR(created_at, 'DD/MM/YYYY') as date
            FROM leaderboard 
            ORDER BY score DESC 
            LIMIT 10
        `);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, leaderboard: result.rows })
        };
    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Database error', details: error.message })
        };
    } finally {
        await client.end();
    }
};
