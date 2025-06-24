import { NextRequest, NextResponse } from 'next/server';

interface ImprovMXCreateAliasRequest {
  email: string;
  forward: string;
}

interface ImprovMXAliasResponse {
  success: boolean;
  alias?: {
    id: number;
    email: string;
    forward: string;
    domain: string;
    created: string;
  };
  error?: string;
}

// Create email alias using ImprovMX API
export async function POST(request: NextRequest) {
  try {
    const { email, forward }: ImprovMXCreateAliasRequest = await request.json();

    if (!email || !forward) {
      return NextResponse.json(
        { error: 'Email and forward address are required' },
        { status: 400 }
      );
    }

    if (!process.env.IMPROVMX_API_KEY) {
      return NextResponse.json(
        { error: 'ImprovMX API key not configured' },
        { status: 500 }
      );
    }

    if (!process.env.IMPROVMX_DOMAIN) {
      return NextResponse.json(
        { error: 'ImprovMX domain not configured' },
        { status: 500 }
      );
    }

    // Create alias using ImprovMX API
    const improvmxResponse = await fetch(
      `https://api.improvmx.com/v3/domains/${process.env.IMPROVMX_DOMAIN}/aliases`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${process.env.IMPROVMX_API_KEY}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alias: email.split('@')[0], // Extract the local part (before @)
          forward: forward,
        }),
      }
    );

    const improvmxData = await improvmxResponse.json();

    if (!improvmxResponse.ok) {
      console.error('ImprovMX API error:', improvmxData);
      return NextResponse.json(
        { 
          error: 'Failed to create email alias',
          details: improvmxData.error || 'Unknown error'
        },
        { status: improvmxResponse.status }
      );
    }

    // Return success response
    const response: ImprovMXAliasResponse = {
      success: true,
      alias: {
        id: improvmxData.alias?.id || 0,
        email: `${improvmxData.alias?.alias}@${process.env.IMPROVMX_DOMAIN}`,
        forward: improvmxData.alias?.forward || forward,
        domain: process.env.IMPROVMX_DOMAIN,
        created: improvmxData.alias?.created || new Date().toISOString(),
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error creating email alias:', error);
    return NextResponse.json(
      { error: 'Failed to create email alias' },
      { status: 500 }
    );
  }
}

// Get existing aliases for the domain
export async function GET(request: NextRequest) {
  try {
    if (!process.env.IMPROVMX_API_KEY || !process.env.IMPROVMX_DOMAIN) {
      return NextResponse.json(
        { error: 'ImprovMX configuration missing' },
        { status: 500 }
      );
    }

    const improvmxResponse = await fetch(
      `https://api.improvmx.com/v3/domains/${process.env.IMPROVMX_DOMAIN}/aliases`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${process.env.IMPROVMX_API_KEY}`).toString('base64')}`,
        },
      }
    );

    const improvmxData = await improvmxResponse.json();

    if (!improvmxResponse.ok) {
      console.error('ImprovMX API error:', improvmxData);
      return NextResponse.json(
        { error: 'Failed to fetch email aliases' },
        { status: improvmxResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      aliases: improvmxData.aliases || [],
      domain: process.env.IMPROVMX_DOMAIN,
    });

  } catch (error) {
    console.error('Error fetching email aliases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email aliases' },
      { status: 500 }
    );
  }
}

// Delete email alias
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const aliasId = searchParams.get('id');

    if (!aliasId) {
      return NextResponse.json(
        { error: 'Alias ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.IMPROVMX_API_KEY || !process.env.IMPROVMX_DOMAIN) {
      return NextResponse.json(
        { error: 'ImprovMX configuration missing' },
        { status: 500 }
      );
    }

    const improvmxResponse = await fetch(
      `https://api.improvmx.com/v3/domains/${process.env.IMPROVMX_DOMAIN}/aliases/${aliasId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${process.env.IMPROVMX_API_KEY}`).toString('base64')}`,
        },
      }
    );

    if (!improvmxResponse.ok) {
      const improvmxData = await improvmxResponse.json();
      console.error('ImprovMX API error:', improvmxData);
      return NextResponse.json(
        { error: 'Failed to delete email alias' },
        { status: improvmxResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email alias deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting email alias:', error);
    return NextResponse.json(
      { error: 'Failed to delete email alias' },
      { status: 500 }
    );
  }
} 