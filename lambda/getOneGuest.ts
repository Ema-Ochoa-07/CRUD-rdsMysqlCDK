import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import mysql from 'mysql2/promise';

interface Guest {
  guest_id: string;
  customer_id: string | null;
  room_id: string | null;
  name: string;
  lastname: string;
  identificationType: string;
  identificationNumber: number;
  phone: string;
  emergencyPhone: string;
  created_at: string;
  updated_at: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Manejo de CORS para OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": "OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({}),
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": "OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: `Method ${event.httpMethod} not allowed` }),
    };
  }

  const guestId = event.pathParameters?.guest_id;
  if (!guestId) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": "OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: 'Guest ID is required' }),
    };
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: true }
    });

    try {
      const [rows] = await connection.execute(
        'SELECT * FROM guest WHERE guest_id = ?',
        [guestId]
      );
      const guests = rows as Guest[];

      if (guests.length === 0) {
        return {
          statusCode: 404,
          headers: {
            "Access-Control-Allow-Origin": '*',
            "Access-Control-Allow-Methods": "OPTIONS, GET",
            "Access-Control-Allow-Headers": "Content-Type",
          },
          body: JSON.stringify({ error: 'Guest not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": '*',
          "Access-Control-Allow-Methods": "OPTIONS, GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify(guests[0]),
      };

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": "OPTIONS, GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && error instanceof Error 
          ? { details: error.message } 
          : {})
      }),
    };
  }
};