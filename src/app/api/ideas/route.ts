import { NextRequest, NextResponse } from 'next/server';

import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';

export interface Idea {
  id?: string;
  title: string;
  description?: string;
  source: 'manual' | 'voice' | 'ai-suggestion' | 'url' | 'transcript' | 'rich-text';
  status: 'new' | 'scripted' | 'template' | 'save-for-later' | 'done';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  scriptId?: string;
  // Structured video content fields
  videoContent?: {
    transcript?: string;
    components?: {
      hook?: string;
      bridge?: string;
      nugget?: string;
      wta?: string;
    };
    contentMetadata?: {
      platform?: string;
      author?: string;
      description?: string;
      source?: string;
      hashtags?: string[];
    };
    visualContext?: string;
    sourceUrl?: string;
  };
}

// GET - Fetch user's ideas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const ideasRef = collection(db, 'ideas');
    const q = query(
      ideasRef,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const ideas: Idea[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      ideas.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as Idea);
    });

    return NextResponse.json({
      success: true,
      ideas,
    });

  } catch (error) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

// POST - Create a new idea
export async function POST(request: NextRequest) {
  try {
    const { title, description, source, status, tags, userId, videoContent } = await request.json();

    if (!title || !userId) {
      return NextResponse.json(
        { error: 'Title and userId are required' },
        { status: 400 }
      );
    }

    const ideasRef = collection(db, 'ideas');
    const now = Timestamp.now();

    const newIdea: Omit<Idea, 'id'> = {
      title,
      description: description || '',
      source: source || 'manual',
      status: status || 'new',
      tags: tags || [],
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
      userId,
      videoContent: videoContent || undefined,
    };

    const docRef = await addDoc(ideasRef, {
      ...newIdea,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      idea: {
        id: docRef.id,
        ...newIdea,
      },
    });

  } catch (error) {
    console.error('Error creating idea:', error);
    return NextResponse.json(
      { error: 'Failed to create idea' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing idea
export async function PUT(request: NextRequest) {
  try {
    const { id, title, description, source, status, tags, videoContent } = await request.json();

    if (!id || !title) {
      return NextResponse.json(
        { error: 'ID and title are required' },
        { status: 400 }
      );
    }

    const ideaRef = doc(db, 'ideas', id);
    const now = Timestamp.now();

    const updateData: Partial<Idea> = {
      title,
      description: description || '',
      source: source || 'manual',
      status: status || 'new',
      tags: tags || [],
      updatedAt: now.toDate().toISOString(),
      videoContent: videoContent || undefined,
    };

    await updateDoc(ideaRef, {
      ...updateData,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: 'Idea updated successfully',
    });

  } catch (error) {
    console.error('Error updating idea:', error);
    return NextResponse.json(
      { error: 'Failed to update idea' },
      { status: 500 }
    );
  }
} 