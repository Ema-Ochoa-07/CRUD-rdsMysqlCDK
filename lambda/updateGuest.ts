import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import mysql from 'mysql2/promise';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": "OPTIONS, PUT",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({}),
    };
  }

  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": "OPTIONS, PUT",
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
        "Access-Control-Allow-Methods": "OPTIONS, PUT",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: 'Guest ID is required' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": "OPTIONS, PUT",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: 'Invalid JSON format' }),
    };
  }

  const { name, lastname, identificationType, identificationNumber, phone, emergencyPhone } = body;
  if (!name && !lastname && !identificationType && !identificationNumber && !phone && !emergencyPhone) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": '*',
        "Access-Control-Allow-Methods": "OPTIONS, PUT",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: 'At least one field must be provided for update' }),
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
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (name) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (lastname) {
        updateFields.push('lastname = ?');
        updateValues.push(lastname);
      }
      if (identificationType) {
        updateFields.push('identificationType = ?');
        updateValues.push(identificationType);
      }
      if (identificationNumber) {
        updateFields.push('identificationNumber = ?');
        updateValues.push(identificationNumber);
      }
      if (phone) {
        updateFields.push('phone = ?');
        updateValues.push(phone);
      }
      if (emergencyPhone) {
        updateFields.push('emergencyPhone = ?');
        updateValues.push(emergencyPhone);
      }

      updateValues.push(guestId);

      const query = `UPDATE guest SET ${updateFields.join(', ')} WHERE guest_id = ?`;
      const [result] = await connection.execute(query, updateValues);

      if ((result as any).affectedRows === 0) {
        return {
          statusCode: 404,
          headers: {
            "Access-Control-Allow-Origin": '*',
            "Access-Control-Allow-Methods": "OPTIONS, PUT",
            "Access-Control-Allow-Headers": "Content-Type",
          },
          body: JSON.stringify({ error: 'Guest not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": '*',
          "Access-Control-Allow-Methods": "OPTIONS, PUT",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ message: 'Guest updated successfully' }),
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
        "Access-Control-Allow-Methods": "OPTIONS, PUT",
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
