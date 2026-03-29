"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LogOut, 
  FileText, 
  Loader2,
  PenSquare
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard } from "@/components/post";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import type { Profile, PostWithAuthor } from "@/types/database";

interface ProfilePageProps {
  profile: Profile | null;
  posts: PostWithAuthor[];
}

export function ProfilePage({ profile, posts }: ProfilePageProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-dopamine-pink" />
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-10">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Card className="dopamine-shadow mb-6 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-dopamine-pink via-dopamine-purple to-dopamine-blue" />
          <CardContent className="pt-0 pb-6">
            <div className="flex flex-col items-center -mt-12">
              <Avatar
                src={profile.avatar_url}
                alt={profile.username}
                size="lg"
                className="ring-4 ring-white shadow-lg"
              />
              <h1 className="mt-4 text-xl font-bold text-gray-900">
                {profile.username}
              </h1>
              {profile.bio && (
                <p className="mt-2 text-sm text-gray-500 text-center max-w-md">
                  {profile.bio}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                加入于 {formatRelativeTime(profile.created_at)}
              </p>
              
              <div className="mt-4 flex items-center gap-3">
                <Link href="/create">
                  <Button variant="dopamine" size="sm">
                    <PenSquare className="mr-1.5 h-4 w-4" />
                    发布帖子
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-gray-500"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-dopamine-blue" />
            我的帖子 ({posts.length})
          </h2>
        </div>

        {posts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="rounded-full bg-gray-100 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm mb-4">
                还没有发布过帖子
              </p>
              <Link href="/create">
                <Button variant="dopamine" size="sm">
                  发布第一篇帖子
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
