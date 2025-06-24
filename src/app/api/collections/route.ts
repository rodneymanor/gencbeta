import { NextRequest, NextResponse } from 'next/server';

import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

import { db } from '@/lib/firebase';

export interface CollectionItem {
  id?: string;
  title: string;
  description?: string;
  url: string;
  platform: 'instagram' | 'tiktok' | 'other';
  thumbnail?: string;
  author?: string;
  likes?: number;
  views?: number;
  duration?: number;
  addedAt: string;
  extractedAt?: string;
}

export interface Collection {
  id?: string;
  name: string;
  description?: string;
  userId: string;
  items: CollectionItem[];
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  color?: string;
}

// GET - Fetch user's collections
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

    const collectionsRef = collection(db, 'collections');
    const q = query(
      collectionsRef,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const collections: Collection[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      collections.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as Collection);
    });

    return NextResponse.json({
      success: true,
      collections,
    });

  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

// POST - Create a new collection
export async function POST(request: NextRequest) {
  try {
    const { name, description, userId, color } = await request.json();

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Name and userId are required' },
        { status: 400 }
      );
    }

    const collectionsRef = collection(db, 'collections');
    const now = Timestamp.now();

    const newCollection: Omit<Collection, 'id'> = {
      name,
      description: description || '',
      userId,
      items: [],
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
      itemCount: 0,
      color: color || 'bg-blue-100',
    };

    const docRef = await addDoc(collectionsRef, {
      ...newCollection,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      collection: {
        id: docRef.id,
        ...newCollection,
      },
    });

  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
} 