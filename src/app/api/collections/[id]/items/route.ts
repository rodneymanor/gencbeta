import { NextRequest, NextResponse } from 'next/server';

import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';

import { db } from '@/lib/firebase';

import { CollectionItem } from '../../route';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST - Add items to a collection
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { items, userId } = await request.json();
    const resolvedParams = await params;
    const collectionId = resolvedParams.id;

    if (!items || !Array.isArray(items) || !userId) {
      return NextResponse.json(
        { error: 'Items array and userId are required' },
        { status: 400 }
      );
    }

    // Verify collection exists and belongs to user
    const collectionRef = doc(db, 'collections', collectionId);
    const collectionDoc = await getDoc(collectionRef);

    if (!collectionDoc.exists()) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const collectionData = collectionDoc.data();
    if (collectionData.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Prepare new items with IDs
    const newItems: CollectionItem[] = items.map((item: Omit<CollectionItem, 'id'>) => ({
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      addedAt: new Date().toISOString(),
    }));

    // Update collection with new items
    const updatedItems = [...(collectionData.items || []), ...newItems];
    
    await updateDoc(collectionRef, {
      items: updatedItems,
      itemCount: updatedItems.length,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Added ${newItems.length} items to collection`,
      items: newItems,
    });

  } catch (error) {
    console.error('Error adding items to collection:', error);
    return NextResponse.json(
      { error: 'Failed to add items to collection' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an item from a collection
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { itemId, userId } = await request.json();
    const resolvedParams = await params;
    const collectionId = resolvedParams.id;

    if (!itemId || !userId) {
      return NextResponse.json(
        { error: 'Item ID and userId are required' },
        { status: 400 }
      );
    }

    // Verify collection exists and belongs to user
    const collectionRef = doc(db, 'collections', collectionId);
    const collectionDoc = await getDoc(collectionRef);

    if (!collectionDoc.exists()) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const collectionData = collectionDoc.data();
    if (collectionData.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Remove item from collection
    const updatedItems = (collectionData.items || []).filter(
      (item: CollectionItem) => item.id !== itemId
    );

    await updateDoc(collectionRef, {
      items: updatedItems,
      itemCount: updatedItems.length,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Item removed from collection',
    });

  } catch (error) {
    console.error('Error removing item from collection:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from collection' },
      { status: 500 }
    );
  }
}

// GET - Fetch items from a collection
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const resolvedParams = await params;
    const collectionId = resolvedParams.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify collection exists and belongs to user
    const collectionRef = doc(db, 'collections', collectionId);
    const collectionDoc = await getDoc(collectionRef);

    if (!collectionDoc.exists()) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const collectionData = collectionDoc.data();
    if (collectionData.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Return items from the collection
    const items = collectionData.items || [];

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    });

  } catch (error) {
    console.error('Error fetching collection items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection items' },
      { status: 500 }
    );
  }
} 