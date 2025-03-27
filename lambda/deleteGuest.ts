import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import mysql from 'mysql2/promise';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": "OPTIONS, DELETE",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({}),
    };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": "OPTIONS, DELETE",
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
        "Access-Control-Allow-Methods": "OPTIONS, DELETE",
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
      const [result] = await connection.execute(
        'DELETE FROM guest WHERE guest_id = ?',
        [guestId]
      );

      if ((result as any).affectedRows === 0) {
        return {
          statusCode: 404,
          headers: {
            "Access-Control-Allow-Origin": '*',
            "Access-Control-Allow-Methods": "OPTIONS, DELETE",
            "Access-Control-Allow-Headers": "Content-Type",
          },
          body: JSON.stringify({ error: 'Guest not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": '*',
          "Access-Control-Allow-Methods": "OPTIONS, DELETE",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ message: 'Guest deleted successfully' }),
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
        "Access-Control-Allow-Methods": "OPTIONS, DELETE",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && error instanceof Error 
          ? { details: error.message } 
          : {} )
      }),
    };
  }
};
