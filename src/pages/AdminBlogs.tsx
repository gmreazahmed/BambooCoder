import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Save, ArrowLeft, Eye } from "lucide-react";
import { z } from "zod";

const blogSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  slug: z.string().trim().min(1, "Slug is required").max(200, "Slug must be less than 200 characters").regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  excerpt: z.string().max(160, "Excerpt must be less than 160 characters").optional().or(z.literal("")),
  content: z.string().trim().min(1, "Content is required").max(50000, "Content must be less than 50000 characters"),
  thumbnail_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
});

const AdminBlogs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    thumbnail_url: "",
    status: "draft" as "draft" | "published" | "archived",
  });
  const [aiTopic, setAiTopic] = useState("");

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleGenerateWithAI = async () => {
    if (!aiTopic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for the blog post",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);
      console.log("Generating blog with AI for topic:", aiTopic);

      const { data, error } = await supabase.functions.invoke("generate-blog", {
        body: { topic: aiTopic, tone: "professional" },
      });

      if (error) {
        console.error("Error from generate-blog function:", error);
        throw error;
      }

      console.log("AI generated blog data:", data);

      setFormData({
        ...formData,
        title: data.title,
        slug: generateSlug(data.title),
        excerpt: data.excerpt,
        content: data.content,
      });

      toast({
        title: "Blog generated!",
        description: "AI has created your blog post. Review and edit as needed.",
      });
    } catch (error: any) {
      console.error("Error generating blog:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate blog with AI",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    // Validate input using Zod schema
    const validation = blogSchema.safeParse(formData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const blogData = {
        title: validation.data.title,
        slug: validation.data.slug,
        content: validation.data.content,
        excerpt: validation.data.excerpt || null,
        thumbnail_url: validation.data.thumbnail_url || null,
        status: validation.data.status,
        author_id: user.id,
        published_at: validation.data.status === "published" ? new Date().toISOString() : null,
      };

      const { error } = await supabase.from("blogs").insert([blogData]);

      if (error) throw error;

      toast({
        title: "Blog saved!",
        description: `Your blog post has been ${validation.data.status === "published" ? "published" : "saved as draft"}`,
      });

      navigate("/admin");
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save blog post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <Button onClick={() => navigate("/admin")} variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-gradient">Create Blog Post</h1>
          <p className="text-muted-foreground mt-2">Write or generate content with AI</p>
        </div>

        {/* AI Generator Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Blog Generator
              </CardTitle>
              <CardDescription>
                Enter a topic and let AI create a complete blog post for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ai-topic">Blog Topic</Label>
                <Input
                  id="ai-topic"
                  placeholder="e.g., React Server Components in Next.js 14"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  disabled={generating}
                />
              </div>
              <Button
                onClick={handleGenerateWithAI}
                disabled={generating || !aiTopic.trim()}
                className="w-full glow-primary"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Blog Form */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Blog Details</CardTitle>
            <CardDescription>Fill in the details for your blog post</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter blog title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                placeholder="auto-generated-from-title"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL: /blog/{formData.slug || "your-blog-slug"}
              </p>
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                placeholder="Brief description (max 160 characters)"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.excerpt.length}/160 characters
              </p>
            </div>

            <div>
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                placeholder="https://example.com/image.jpg"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="content">Content (Markdown) *</Label>
              <Textarea
                id="content"
                placeholder="Write your blog content in Markdown format..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Blog
                  </>
                )}
              </Button>
              {formData.status === "published" && formData.slug && (
                <Button
                  onClick={() => window.open(`/blog/${formData.slug}`, "_blank")}
                  variant="outline"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBlogs;