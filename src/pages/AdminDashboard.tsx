import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, FileText, Mail, Loader2, Edit, Trash2, Eye, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ blogs: 0, messages: 0 });
  const [blogs, setBlogs] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [blogsRes, messagesRes] = await Promise.all([
        supabase
          .from("blogs")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("contact_messages")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (blogsRes.data) setBlogs(blogsRes.data);
      if (messagesRes.data) setMessages(messagesRes.data);

      setStats({
        blogs: blogsRes.data?.length || 0,
        messages: messagesRes.data?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
    toast({ title: "Logged out successfully" });
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const { error } = await supabase.from("blogs").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Blog deleted successfully" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRead = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ read: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({ title: `Message marked as ${!currentStatus ? "read" : "unread"}` });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gradient">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your content and messages</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Blog Posts</CardTitle>
                  <CardDescription>Total published and draft posts</CardDescription>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats.blogs}</p>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Messages</CardTitle>
                  <CardDescription>Contact form submissions</CardDescription>
                </div>
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats.messages}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your site content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={() => navigate("/admin/blogs/new")} className="w-full glow-primary">
                Create New Blog Post
              </Button>
              <Button onClick={() => navigate("/blog")} variant="outline" className="w-full">
                View Published Blogs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Blog Posts Table */}
        <Card className="glass mt-8">
          <CardHeader>
            <CardTitle>All Blog Posts</CardTitle>
            <CardDescription>Manage and edit your blog posts</CardDescription>
          </CardHeader>
          <CardContent>
            {blogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No blog posts yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogs.map((blog) => (
                      <TableRow key={blog.id}>
                        <TableCell className="font-medium">{blog.title}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              blog.status === "published"
                                ? "default"
                                : blog.status === "draft"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {blog.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(blog.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {blog.status === "published" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(`/blog/${blog.slug}`, "_blank")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/admin/blogs/edit/${blog.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteBlog(blog.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Messages Table */}
        <Card className="glass mt-8">
          <CardHeader>
            <CardTitle>Contact Messages</CardTitle>
            <CardDescription>Messages from your contact form</CardDescription>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No messages yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => (
                      <TableRow key={message.id} className={message.read ? "opacity-60" : ""}>
                        <TableCell className="font-medium">{message.name}</TableCell>
                        <TableCell className="text-muted-foreground">{message.email}</TableCell>
                        <TableCell className="max-w-md truncate">{message.message}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(message.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(message.id, message.read)}
                          >
                            <CheckCircle
                              className={`h-4 w-4 ${message.read ? "text-primary" : "text-muted-foreground"}`}
                            />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;