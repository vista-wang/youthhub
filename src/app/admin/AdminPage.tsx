"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  FileText,
  Users,
  Megaphone,
  Sparkles,
  Trash2,
  Ban,
  RotateCcw,
  Plus,
  Edit,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { cn, formatRelativeTime } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PromptDialog } from "@/components/ui/prompt-dialog";
import type { Profile as User, Announcement, WeeklyTopic as Topic } from "@/types/database";

type TabType = "posts" | "users" | "announcements" | "topics";

interface Post {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_avatar: string | null;
  likes_count: number;
  comments_count: number;
  is_deleted: boolean;
  created_at: string;
}

export function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [postPage, setPostPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const [promptDialog, setPromptDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    placeholder?: string;
    onSubmit: (value: string) => void;
  }>({ isOpen: false, title: "", message: "", onSubmit: () => {} });

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab, postPage, userPage, userSearch, includeDeleted]);

  const checkAdmin = async () => {
    try {
      const response = await fetch("/api/admin/check");
      const data = await response.json();
      setIsAdmin(data.isAdmin);
      if (!data.isAdmin) {
        router.push("/");
      }
    } catch (error) {
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    switch (activeTab) {
      case "posts":
        await loadPosts();
        break;
      case "users":
        await loadUsers();
        break;
      case "announcements":
        await loadAnnouncements();
        break;
      case "topics":
        await loadTopics();
        break;
    }
  };

  const loadPosts = async () => {
    try {
      const params = new URLSearchParams({
        page: postPage.toString(),
        limit: "10",
        include_deleted: includeDeleted.toString(),
      });
      const response = await fetch(`/api/admin/posts?${params}`);
      const data = await response.json();
      if (response.ok) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Failed to load posts:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: userPage.toString(),
        limit: "10",
        search: userSearch,
      });
      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const response = await fetch("/api/admin/announcements");
      const data = await response.json();
      if (response.ok) {
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error("Failed to load announcements:", error);
    }
  };

  const loadTopics = async () => {
    try {
      const response = await fetch("/api/admin/topics");
      const data = await response.json();
      if (response.ok) {
        setTopics(data.topics);
      }
    } catch (error) {
      console.error("Failed to load topics:", error);
    }
  };

  const handleDeletePost = async (postId: string, reason?: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "删除帖子",
      message: "确定要删除这篇帖子吗？此操作不可撤销。",
      variant: "destructive",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch("/api/admin/posts", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, reason }),
          });
          if (response.ok) {
            loadPosts();
          }
        } catch (error) {
          console.error("Failed to delete post:", error);
        }
      },
    });
  };

  const handleRestorePost = async (postId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "恢复帖子",
      message: "确定要恢复这篇帖子吗？",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch("/api/admin/posts", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId }),
          });
          if (response.ok) {
            loadPosts();
          }
        } catch (error) {
          console.error("Failed to restore post:", error);
        }
      },
    });
  };

  const handleBanUser = async (userId: string, reason?: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "封禁用户",
      message: "确定要封禁该用户吗？",
      variant: "destructive",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, action: "ban", reason }),
          });
          if (response.ok) {
            loadUsers();
          }
        } catch (error) {
          console.error("Failed to ban user:", error);
        }
      },
    });
  };

  const handleUnbanUser = async (userId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "解封用户",
      message: "确定要解封该用户吗？",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, action: "unban" }),
          });
          if (response.ok) {
            loadUsers();
          }
        } catch (error) {
          console.error("Failed to unban user:", error);
        }
      },
    });
  };

  const handleSaveAnnouncement = async (data: Partial<Announcement>) => {
    try {
      const url = "/api/admin/announcements";
      const method = editingAnnouncement ? "PUT" : "POST";
      const body = editingAnnouncement ? { ...data, id: editingAnnouncement.id } : data;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowAnnouncementModal(false);
        setEditingAnnouncement(null);
        loadAnnouncements();
      }
    } catch (error) {
      console.error("Failed to save announcement:", error);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "删除公告",
      message: "确定要删除这条公告吗？此操作不可撤销。",
      variant: "destructive",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`/api/admin/announcements?id=${id}`, {
            method: "DELETE",
          });
          if (response.ok) {
            loadAnnouncements();
          }
        } catch (error) {
          console.error("Failed to delete announcement:", error);
        }
      },
    });
  };

  const handleSaveTopic = async (data: Partial<Topic>) => {
    try {
      const url = "/api/admin/topics";
      const method = editingTopic ? "PUT" : "POST";
      const body = editingTopic ? { ...data, id: editingTopic.id } : data;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowTopicModal(false);
        setEditingTopic(null);
        loadTopics();
      }
    } catch (error) {
      console.error("Failed to save topic:", error);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "删除话题",
      message: "确定要删除这个话题吗？此操作不可撤销。",
      variant: "destructive",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const response = await fetch(`/api/admin/topics?id=${id}`, {
            method: "DELETE",
          });
          if (response.ok) {
            loadTopics();
          }
        } catch (error) {
          console.error("Failed to delete topic:", error);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const tabs = [
    { key: "posts" as TabType, label: "帖子管理", icon: FileText },
    { key: "users" as TabType, label: "用户管理", icon: Users },
    { key: "announcements" as TabType, label: "公告管理", icon: Megaphone },
    { key: "topics" as TabType, label: "话题管理", icon: Sparkles },
  ];

  return (
    <main className="min-h-screen pb-10">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-brand-blue to-brand-teal">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">管理员中心</h1>
          </div>
          <p className="text-slate-500">管理社区内容、用户和公告</p>
        </div>

        <div role="tablist" className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-gradient-to-r from-brand-blue to-brand-teal text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "posts" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>帖子列表</CardTitle>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={includeDeleted}
                    onChange={(e) => setIncludeDeleted(e.target.checked)}
                    className="rounded"
                  />
                  显示已删除
                </label>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      post.is_deleted ? "bg-red-50 border-red-200" : "bg-white border-slate-200"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{post.author_name}</span>
                          {post.is_deleted && (
                            <Badge variant="warning" className="text-xs">已删除</Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{post.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span>❤️ {post.likes_count}</span>
                          <span>💬 {post.comments_count}</span>
                          <span>{formatRelativeTime(post.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.is_deleted ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestorePost(post.id)}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            恢复
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            删除
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-4 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPostPage((p) => Math.max(1, p - 1))}
                  disabled={postPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <span className="text-sm text-slate-500">第 {postPage} 页</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPostPage((p) => p + 1)}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>用户列表</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="搜索用户..."
                    className="pl-9 w-48"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      user.is_banned ? "bg-red-50 border-red-200" : "bg-white border-slate-200"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{user.username}</span>
                          {user.role === "admin" && (
                            <Badge className="text-xs bg-brand-purple text-white">管理员</Badge>
                          )}
                          {user.role === "moderator" && (
                            <Badge className="text-xs bg-brand-blue text-white">版主</Badge>
                          )}
                          {user.is_banned && (
                            <Badge variant="warning" className="text-xs">已封禁</Badge>
                          )}
                        </div>
                        {user.bio && (
                          <p className="text-sm text-slate-500 mb-1">{user.bio}</p>
                        )}
                        {user.is_banned && user.ban_reason && (
                          <p className="text-xs text-red-500">封禁原因: {user.ban_reason}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          注册于 {formatRelativeTime(user.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.role === "user" && (
                          user.is_banned ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnbanUser(user.id)}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              解封
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPromptDialog({
                                  isOpen: true,
                                  title: "封禁用户",
                                  message: "请输入封禁原因：",
                                  placeholder: "输入封禁原因...",
                                  onSubmit: (reason) => {
                                    setPromptDialog((prev) => ({ ...prev, isOpen: false }));
                                    if (reason) handleBanUser(user.id, reason);
                                  },
                                });
                              }}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              封禁
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-4 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  disabled={userPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <span className="text-sm text-slate-500">第 {userPage} 页</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserPage((p) => p + 1)}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "announcements" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>公告管理</CardTitle>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setShowAnnouncementModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  新建公告
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-4 rounded-lg border bg-white border-slate-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              announcement.type === "important" ? "default" :
                              announcement.type === "warning" ? "warning" :
                              "secondary"
                            }
                            className="text-xs"
                          >
                            {announcement.type === "important" ? "重要" :
                             announcement.type === "warning" ? "注意" :
                             announcement.type === "event" ? "活动" : "公告"}
                          </Badge>
                          {!announcement.is_active && (
                            <Badge variant="outline" className="text-xs">已停用</Badge>
                          )}
                          <span className="text-xs text-slate-400">
                            优先级: {announcement.priority}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{announcement.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2">{announcement.content}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          发布于 {formatRelativeTime(announcement.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingAnnouncement(announcement);
                            setShowAnnouncementModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "topics" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>每周话题管理</CardTitle>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingTopic(null);
                    setShowTopicModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  新建话题
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="p-4 rounded-lg border bg-white border-slate-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {!topic.is_active && (
                            <Badge variant="outline" className="text-xs">已停用</Badge>
                          )}
                          <span className="text-xs text-slate-400">
                            {topic.week_start} ~ {topic.week_end}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{topic.title}</h3>
                        {topic.description && (
                          <p className="text-sm text-slate-500 line-clamp-2">{topic.description}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          创建于 {formatRelativeTime(topic.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTopic(topic);
                            setShowTopicModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showAnnouncementModal && (
        <AnnouncementModal
          announcement={editingAnnouncement}
          onClose={() => {
            setShowAnnouncementModal(false);
            setEditingAnnouncement(null);
          }}
          onSave={handleSaveAnnouncement}
        />
      )}

      {showTopicModal && (
        <TopicModal
          topic={editingTopic}
          onClose={() => {
            setShowTopicModal(false);
            setEditingTopic(null);
          }}
          onSave={handleSaveTopic}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />

      <PromptDialog
        isOpen={promptDialog.isOpen}
        onClose={() => setPromptDialog((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={promptDialog.onSubmit}
        title={promptDialog.title}
        message={promptDialog.message}
        placeholder={promptDialog.placeholder}
      />
    </main>
  );
}

function AnnouncementModal({
  announcement,
  onClose,
  onSave,
}: {
  announcement: Announcement | null;
  onClose: () => void;
  onSave: (data: Partial<Announcement>) => void;
}) {
  const [title, setTitle] = useState(announcement?.title || "");
  const [content, setContent] = useState(announcement?.content || "");
  const [type, setType] = useState(announcement?.type || "info");
  const [priority, setPriority] = useState(announcement?.priority || 0);
  const [isActive, setIsActive] = useState(announcement?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, content, type, priority, is_active: isActive });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={announcement ? "编辑公告" : "新建公告"}>
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Announcement["type"])}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
            >
              <option value="info">普通</option>
              <option value="warning">警告</option>
              <option value="important">重要</option>
              <option value="event">活动</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <Input
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">启用</span>
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" variant="primary">
            保存
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function TopicModal({
  topic,
  onClose,
  onSave,
}: {
  topic: Topic | null;
  onClose: () => void;
  onSave: (data: Partial<Topic>) => void;
}) {
  const [title, setTitle] = useState(topic?.title || "");
  const [description, setDescription] = useState(topic?.description || "");
  const [weekStart, setWeekStart] = useState(topic?.week_start || "");
  const [weekEnd, setWeekEnd] = useState(topic?.week_end || "");
  const [isActive, setIsActive] = useState(topic?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, description, week_start: weekStart, week_end: weekEnd, is_active: isActive });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={topic ? "编辑话题" : "新建话题"}>
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <Input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <Input
              type="date"
              value={weekEnd}
              onChange={(e) => setWeekEnd(e.target.value)}
              required
            />
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700">启用</span>
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" variant="primary">
            保存
          </Button>
        </div>
      </form>
    </Modal>
  );
}
