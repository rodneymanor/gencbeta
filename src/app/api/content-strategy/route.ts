import { NextRequest, NextResponse } from 'next/server';

import { ContentStrategyEngine, WizardData } from '@/lib/content-strategy-engine';

export async function POST(request: NextRequest) {
  try {
    // Get the Gemini API key from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Parse the request body
    const wizardData: WizardData = await request.json();
    
    // Initialize the content strategy engine
    const engine = new ContentStrategyEngine(geminiApiKey);
    
    // Validate the wizard data
    const validation = engine.validateWizardData(wizardData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors,
          warnings: validation.warnings 
        },
        { status: 400 }
      );
    }
    
    // Generate the content strategy
    const strategy = await engine.generateContentStrategy(wizardData, {
      model: 'gemini-1.5-flash',
      temperature: 0.8,
      enableDebugMode: process.env.NODE_ENV === 'development'
    });
    
    return NextResponse.json({
      success: true,
      strategy
    });
    
  } catch (error) {
    console.error('Content Strategy API Error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API configuration' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('Validation failed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Content strategy generation failed',
        message: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve saved content strategy (placeholder for future database integration)
export async function GET() {
  try {
    // For now, return empty as we don't have database integration yet
    // In the future, this would fetch from Supabase based on user ID
    
    return NextResponse.json({
      success: true,
      strategy: null,
      message: 'No saved content strategy found'
    });
    
  } catch (error) {
    console.error('Content Strategy GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve content strategy' },
      { status: 500 }
    );
  }
} 