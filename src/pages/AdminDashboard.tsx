import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, FileText, Mail, Loader2 } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ blogs: 0, messages: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [blogsRes, messagesRes] = await Promise.all([
        supabase.from("blogs").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        blogs: blogsRes.count || 0,
        messages: messagesRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
    toast({ title: "Logged out successfully" });
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
            <p className="text-muted-foreground">
              Blog management and AI generation features coming soon. Use Lovable Cloud to view and manage your database directly.
            </p>
            <Button onClick={() => navigate("/blog")}>View Published Blogs</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;