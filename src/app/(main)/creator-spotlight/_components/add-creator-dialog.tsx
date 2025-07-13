'use client';

import React, { useState } from 'react';
import { Plus, Loader2, Check, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AddCreatorDialogProps {
  children: React.ReactNode;
  onCreatorAdded: () => void;
}

interface CreatorFormData {
  username: string;
  platform: 'tiktok' | 'instagram';
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
  website?: string;
}

export function AddCreatorDialog({ children, onCreatorAdded }: AddCreatorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatorFormData>({
    username: '',
    platform: 'tiktok',
    displayName: '',
    profileImageUrl: '',
    bio: '',
    website: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.platform) {
      setError('Username and platform are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/creators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        resetForm();
        setTimeout(() => {
          setOpen(false);
          onCreatorAdded();
        }, 2000);
      } else {
        setError(data.error ?? 'Failed to add creator');
      }
    } catch (error) {
      console.error('Error adding creator:', error);
      if (error instanceof Error && error.message.includes('401')) {
        setError('Authentication required. Please log in to add creators.');
      } else {
        setError('Failed to add creator. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      platform: 'tiktok',
      displayName: '',
      profileImageUrl: '',
      bio: '',
      website: ''
    });
  };

  const handleInputChange = (field: keyof CreatorFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Creator to Spotlight
          </DialogTitle>
          <DialogDescription>
            Add a new creator from TikTok or Instagram to analyze their content and videos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform">Platform *</Label>
            <Select
              value={formData.platform}
              onValueChange={(value: 'tiktok' | 'instagram') => handleInputChange('platform', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎵</span>
                    <span>TikTok</span>
                    <Badge variant="outline" className="ml-auto bg-[#FF0050] text-white border-[#FF0050]">
                      TikTok
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="instagram">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📸</span>
                    <span>Instagram</span>
                    <Badge variant="outline" className="ml-auto bg-[#E4405F] text-white border-[#E4405F]">
                      Instagram
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Username *
              <span className="text-muted-foreground ml-1">
                (without @ symbol)
              </span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value.replace('@', ''))}
                placeholder="username"
                className="pl-8"
                required
              />
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="Optional display name"
            />
          </div>

          {/* Profile Image URL */}
          <div className="space-y-2">
            <Label htmlFor="profileImageUrl">Profile Image URL</Label>
            <Input
              id="profileImageUrl"
              type="url"
              value={formData.profileImageUrl}
              onChange={(e) => handleInputChange('profileImageUrl', e.target.value)}
              placeholder="https://example.com/profile.jpg"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              type="text"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Creator's bio or description"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {formData.username && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Preview</h4>
              <div className="flex items-center gap-3">
                <div className="relative">
                                  <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white"
                  style={{
                    backgroundColor: formData.platform === 'tiktok' ? '#FF0050' : '#E4405F'
                  }}
                >
                  {formData.username.charAt(0).toUpperCase()}
                </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "absolute -bottom-1 -right-1 text-xs capitalize",
                      formData.platform === 'tiktok' && "bg-[#FF0050] text-white border-[#FF0050]",
                      formData.platform === 'instagram' && "bg-[#E4405F] text-white border-[#E4405F]"
                    )}
                  >
                    {formData.platform}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium">
                    {formData.displayName ?? formData.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{formData.username}
                  </p>
                  {formData.bio && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.username || !formData.platform}
              className={cn(
                "flex items-center gap-2",
                formData.platform === 'tiktok' && "bg-[#FF0050] hover:bg-[#E6004C]",
                formData.platform === 'instagram' && "bg-[#E4405F] hover:bg-[#D6336C]"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Creator
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 